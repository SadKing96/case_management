import React, { useEffect, useRef, useState } from 'react';
import { CardProps } from './KanbanCard';
import { apiClient } from '../api/client';
import '../styles/kanban.css';

interface CardDetailModalProps {
    card: CardProps;
    onClose: () => void;
    currentColumnId: string;
    columnIds: string[];
    onMove: (cardId: string, targetColumnId: string) => void;
    onUpdate?: (cardId: string, updates: Partial<CardProps>) => void;
    onDelete?: (cardId: string) => void;
    onEscalate?: (cardId: string) => void;
    onDeescalate?: (cardId: string) => void;
}

export function CardDetailModal({ card, onClose, currentColumnId, columnIds, onMove, onUpdate, onDelete, onEscalate, onDeescalate }: CardDetailModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const [isEditingQuoteId, setIsEditingQuoteId] = useState(false);
    const [editQuoteId, setEditQuoteId] = useState(card.quoteId || '');
    const [editPoNumber, setEditPoNumber] = useState(card.poNumber || '');

    // Description State
    const [description, setDescription] = useState(card.description || '');

    // Refs for auto-save on unmount
    const editPoNumberRef = useRef(editPoNumber);
    const cardPoNumberRef = useRef(card.poNumber);
    const descriptionRef = useRef(description);
    const cardDescriptionRef = useRef(card.description || ''); // Initial val

    const onUpdateRef = useRef(onUpdate);
    const cardIdRef = useRef(card.id);

    // Attachments & Notes State (Mock for now, would fetch later)
    const [attachments, setAttachments] = useState<any[]>([]); // To be fetched
    const [notes, setNotes] = useState<any[]>([]); // To be fetched
    const [emails, setEmails] = useState<any[]>([]); // Fetched
    const [emailSlug, setEmailSlug] = useState(card.emailSlug || '');
    const [newNote, setNewNote] = useState('');
    const [uploading, setUploading] = useState(false);

    // Initial Sync
    useEffect(() => {
        setEditQuoteId(card.quoteId || '');
        setEditPoNumber(card.poNumber || '');
        setDescription(card.description || '');
        // Fetch extra data? Ideally backend includes them or we fetch here
        fetchDetails();
    }, [card]);

    const fetchDetails = async () => {
        try {
            // We need an endpoint that returns full details if 'card' prop is shallow.
            // Assuming 'card' prop might be stale or shallow.
            // But let's assume we fetch attachments/notes here.

            // Parallel fetch
            const [baseCase, noteData, emailData] = await Promise.all([
                apiClient.get(`/cases/${card.id}`),
                apiClient.get(`/cases/${card.id}/notes`),
                apiClient.get(`/cases/${card.id}/emails`)
            ]);

            // Base case might have attachments included if backend supports it
            // Backend schema has CaseAttachment[], we need to ensure GET /cases/:id includes it
            // Backend route currently: includes _count. Let's rely on that or update backend to include keys. 
            // WAIT, implementation plan said "Ensure GET /:caseId includes attachments".
            // I should update backend GET route to include attachments.
            // For now, let's assume I will fix backend route or use separate call if needed. 
            // Actually, let's assume baseCase has attachments if I update the route.
            if ((baseCase as any).attachments) setAttachments((baseCase as any).attachments);
            if ((baseCase as any).emailSlug) setEmailSlug((baseCase as any).emailSlug);
            if (noteData) setNotes(noteData as any[]);
            if (emailData) setEmails(emailData as any[]);

        } catch (err) {
            console.error(err);
        }
    };

    // Ref Sync
    useEffect(() => {
        editPoNumberRef.current = editPoNumber;
    }, [editPoNumber]);

    useEffect(() => {
        descriptionRef.current = description;
    }, [description]);

    useEffect(() => {
        cardPoNumberRef.current = card.poNumber;
        cardDescriptionRef.current = card.description || '';
        onUpdateRef.current = onUpdate;
        cardIdRef.current = card.id;
    }, [card.poNumber, card.description, onUpdate, card.id]);

    // Cleanup Save
    useEffect(() => {
        return () => {
            const updates: any = {};
            if (editPoNumberRef.current !== cardPoNumberRef.current) {
                updates.poNumber = editPoNumberRef.current;
            }
            if (descriptionRef.current !== cardDescriptionRef.current) {
                updates.description = descriptionRef.current;
            }

            if (Object.keys(updates).length > 0) {
                onUpdateRef.current?.(cardIdRef.current, updates);
            }
        };
    }, []);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Close on Escape key
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onClose();
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const saveQuoteId = () => {
        if (editQuoteId !== card.quoteId) {
            onUpdate?.(card.id, { quoteId: editQuoteId });
        }
        setIsEditingQuoteId(false);
    };

    const savePoNumber = () => {
        if (editPoNumber !== card.poNumber) {
            onUpdate?.(card.id, { poNumber: editPoNumber });
        }
    };

    const saveDescription = () => {
        if (description !== card.description) {
            onUpdate?.(card.id, { description });
        }
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this card?')) {
            onDelete?.(card.id);
            onClose();
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res: any = await apiClient.postFormData(`/cases/${card.id}/attachments`, formData);
            setAttachments((prev: any[]) => [...prev, res]);
        } catch (err) {
            console.error("Upload failed", err);
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        try {
            const res: any = await apiClient.post(`/cases/${card.id}/notes`, { content: newNote });
            setNotes(prev => [res, ...prev]);
            setNewNote('');
        } catch (err) {
            console.error(err);
            alert("Failed to add note");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" ref={modalRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                <button className="modal-close-btn" onClick={onClose}>×</button>

                {/* Header */}
                <div className="modal-header" style={{ flexShrink: 0 }}>
                    <div className="modal-meta-top" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {card.escalatedToId ? (
                            <button
                                onClick={() => onDeescalate?.(card.id)}
                                style={{
                                    background: 'var(--color-bg-surface)',
                                    border: '1px solid var(--color-success)',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    color: 'var(--color-success)',
                                    marginRight: '8px',
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                                title="Undo Escalation"
                            >
                                ↩ Undo Escalation
                            </button>
                        ) : (
                            onEscalate && (
                                <button
                                    onClick={() => onEscalate(card.id)}
                                    style={{
                                        background: 'var(--color-bg-column)',
                                        border: '1px solid var(--color-danger)',
                                        cursor: 'pointer',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        color: 'var(--color-danger)',
                                        marginRight: '8px',
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                    title="Escalate to Admin"
                                >
                                    ⚠️ Escalate
                                </button>
                            )
                        )}
                        <button
                            onClick={handleDelete}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                color: '#94a3b8',
                                marginRight: '8px'
                            }}
                            title="Delete Card"
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fee2e2'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                        {card.priority && (
                            <span className={`tag ${card.priority}`}>{card.priority} Priority</span>
                        )}
                        {card.tags?.map(tag => (
                            <span key={tag} className="tag">{tag}</span>
                        ))}
                        {card.team && (
                            <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: card.team.color,
                                color: '#fff',
                                textTransform: 'uppercase',
                                marginLeft: '8px'
                            }}>
                                {card.team.name}
                            </span>
                        )}

                        {(card.type === 'QUOTE' || card.type === 'ORDER' || card.quoteId) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto', marginRight: '32px' }}>
                                <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 600 }}>ID:</span>
                                {isEditingQuoteId ? (
                                    <input
                                        autoFocus
                                        value={editQuoteId}
                                        onChange={(e) => setEditQuoteId(e.target.value)}
                                        onBlur={saveQuoteId}
                                        onKeyDown={(e) => e.key === 'Enter' && saveQuoteId()}
                                        style={{
                                            fontSize: '12px',
                                            padding: '2px 4px',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '4px',
                                            width: '100px',
                                            background: 'var(--color-bg-surface)',
                                            color: 'var(--color-text-main)'
                                        }}
                                    />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ fontFamily: 'monospace', background: 'var(--color-bg-column)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                                            {card.quoteId || 'No ID'}
                                        </span>
                                        <button
                                            onClick={() => setIsEditingQuoteId(true)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--color-text-secondary)' }}
                                            title="Edit ID"
                                        >
                                            ✏️
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}


                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1rem' }}>
                        {card.type === 'QUOTE' ? (
                            <h2 className="modal-title">{card.title}</h2>
                        ) : (
                            <div style={{ flex: 1, marginRight: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder="Enter PO Number..."
                                    value={editPoNumber}
                                    onChange={(e) => setEditPoNumber(e.target.value)}
                                    onBlur={savePoNumber}
                                    onKeyDown={(e) => e.key === 'Enter' && savePoNumber()}
                                    style={{
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        width: '100%',
                                        padding: '4px 8px',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '4px',
                                        color: 'var(--color-text-main)',
                                        background: 'var(--color-bg-surface)',
                                        height: '28px'
                                    }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {card.type !== 'QUOTE' && (
                                <>
                                    {columnIds.indexOf(currentColumnId) > 0 && (
                                        <button
                                            className="btn"
                                            onClick={() => onMove(card.id, columnIds[columnIds.indexOf(currentColumnId) - 1])}
                                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                        >
                                            ← Move Prev
                                        </button>
                                    )}
                                    {columnIds.indexOf(currentColumnId) < columnIds.length - 1 && (
                                        <button
                                            className="btn"
                                            onClick={() => onMove(card.id, columnIds[columnIds.indexOf(currentColumnId) + 1])}
                                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                        >
                                            Move Next →
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    {emailSlug && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', background: 'var(--color-bg-column)', padding: '4px 8px', borderRadius: '4px', alignSelf: 'flex-start' }}>
                            ✉️ Send updates to: <strong style={{ userSelect: 'all' }}>card-{emailSlug}@yourdomain.com</strong>
                        </div>
                    )}
                </div>

                {/* Scrollable Content Body */}
                <div className="modal-body" style={{ flexGrow: 1, overflowY: 'auto', paddingBottom: '1rem' }}>

                    {/* Description */}
                    <div className="modal-section">
                        <label className="section-title">DESCRIPTION</label>
                        <textarea
                            className="description-input"
                            rows={4}
                            placeholder="Add a more detailed description..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            onBlur={saveDescription}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                resize: 'vertical',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                background: 'var(--color-bg-surface)',
                                color: 'var(--color-text-main)'
                            }}
                        />
                    </div>

                    {/* Attachments */}
                    <div className="modal-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label className="section-title" style={{ marginBottom: 0 }}>ATTACHMENTS</label>
                            <label className="btn" style={{ fontSize: '0.75rem', cursor: 'pointer', padding: '4px 8px' }}>
                                <span>{uploading ? 'Uploading...' : '+ Upload'}</span>
                                <input type="file" hidden onChange={handleFileUpload} disabled={uploading} />
                            </label>
                        </div>

                        {attachments.length === 0 && <p style={{ color: '#94a3b8', fontSize: '0.875rem', fontStyle: 'italic' }}>No files attached.</p>}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {attachments.map(att => (
                                <div key={att.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '6px 10px', background: 'var(--color-bg-column)', borderRadius: '4px', border: '1px solid var(--color-border)'
                                }}>
                                    <a
                                        href={`http://localhost:3001/${att.blobPath}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ textDecoration: 'none', color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 500 }}
                                    >
                                        📄 {att.fileName}
                                    </a>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{(att.sizeBytes / 1024).toFixed(1)} KB</span>
                                </div>
                            ))}
                        </div>
                    </div>




                    {/* Info Grid (Assignee, Due Date) + Delete */}
                    <div className="modal-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', gap: '2rem' }}>
                            <div>
                                <label className="section-title">ASSIGNEE</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div className="assignee-avatar large">
                                        {card.assignee ? card.assignee.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <span style={{ fontWeight: 500 }}>{card.assignee || 'Unassigned'}</span>
                                </div>


                            </div>

                            {card.dueDate && (
                                <div>
                                    <label className="section-title">DUE DATE</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563' }}>
                                        📅 {card.dueDate}
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="section-title">DAYS OPEN</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563' }}>
                                    ⏱️ {card.createdAt ? Math.floor((new Date().getTime() - new Date(card.createdAt).getTime()) / (1000 * 3600 * 24)) : 0} Days
                                </div>
                            </div>
                        </div>

                        {/* Trash Icon Removed from here */}
                    </div>

                    {/* Notes Section (Conversation style) */}
                    <div className="modal-section" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '1rem' }}>
                        <label className="section-title">NOTES</label>

                        <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse', gap: '8px', marginBottom: '1rem', paddingRight: '4px' }}>
                            {notes.length === 0 && <span style={{ color: '#94a3b8', fontSize: '0.875rem', fontStyle: 'italic' }}>No notes yet.</span>}

                            {notes.map(note => (
                                <div key={note.id} style={{ background: 'var(--color-bg-column)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-main)' }}>{note.content}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px', textAlign: 'right' }}>
                                        {new Date(note.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                placeholder="Add a note..."
                                value={newNote}
                                onChange={e => setNewNote(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                            />
                            <button onClick={handleAddNote} className="btn btn-primary" style={{ border: 'none' }}>Add</button>
                        </div>
                    </div>

                </div>

                {/* Emails Section (Moved to Bottom) */}
                <div className="modal-section" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '1rem' }}>
                    <label className="section-title">EMAILS ({emails.length})</label>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        minHeight: '100px',
                        background: 'var(--color-bg-surface)', // Slightly different bg?
                        borderRadius: '6px',
                        padding: emails.length === 0 ? '1rem' : '4px',
                        border: emails.length === 0 ? '2px dashed var(--color-border)' : 'none',
                        justifyContent: emails.length === 0 ? 'center' : 'flex-start',
                        alignItems: emails.length === 0 ? 'center' : 'stretch'
                    }}>
                        {emails.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📭</div>
                                <p>No emails yet.</p>
                                <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Emails sent to <strong>card-{emailSlug}@yourdomain.com</strong> will appear here.</p>
                            </div>
                        ) : (
                            emails.map(email => (
                                <div key={email.id} style={{ background: 'var(--color-bg-column)', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{email.from}</span>
                                        <span>{new Date(email.receivedAt).toLocaleString()}</span>
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '4px' }}>{email.subject}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-main)', whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'hidden', textOverflow: 'ellipsis' }}>
                                        {email.bodyText || 'No plain text content.'}
                                    </div>
                                    {/* Attachments */}
                                    {email.attachments && email.attachments.length > 0 && (
                                        <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {email.attachments.map((att: any) => (
                                                <span key={att.id} style={{ fontSize: '0.75rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>
                                                    📎 {att.fileName}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

        </div >
    );
}
