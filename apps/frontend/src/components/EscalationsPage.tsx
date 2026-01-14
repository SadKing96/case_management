import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Case } from '../../../../packages/shared/src/types';

interface CaseWithDetails extends Case {
    board: { id: string; name: string; slug: string; color: string };
    column: { id: string; name: string; color: string };
    assignee?: {
        id: string;
        name: string;
        email: string;
        teams?: { team: { id: string; name: string; color: string } }[]
    };
}

import { CreateCardModal } from './CreateCardModal';
import { CardDetailModal } from './CardDetailModal';

type SortDirection = 'asc' | 'desc' | null;
interface SortConfig {
    key: string;
    direction: SortDirection;
}

export function EscalationsPage() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<CaseWithDetails[]>([]);
    const [deescalatedTickets, setDeescalatedTickets] = useState<CaseWithDetails[]>([]);
    // ... (lines 25-227 skipped, no changes) ...

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Initial Sort by Date desc
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'dueDate', direction: 'desc' });
    const [viewingCard, setViewingCard] = useState<CaseWithDetails | null>(null);

    const fetchTickets = async () => {
        try {
            // Fetch active cases. We will filter client-side for now as backend doesn't have specific endpoint
            const data = await apiClient.get<CaseWithDetails[]>('/cases?active=true');
            // Filter strictly for "Escalations" column
            const escalated = data.filter(t => t.column?.name === 'Escalations');
            const deescalated = data.filter(t => t.column?.name === 'De-escalated');
            setTickets(escalated);
            setDeescalatedTickets(deescalated);
        } catch (err) {
            console.error(err);
            setError('Failed to load escalations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleView = (ticket: CaseWithDetails) => {
        setViewingCard(ticket);
    };

    const handleMoveCard = async (cardId: string, targetColumnId: string) => {
        try {
            await apiClient.post(`/cases/${cardId}/move`, { columnId: targetColumnId });
            fetchTickets();
            setViewingCard(null);
        } catch (err) {
            alert('Failed to move card');
        }
    };

    const handleUpdate = async (cardId: string, updates: any) => {
        try {
            await apiClient.put(`/cases/${cardId}`, updates);
            fetchTickets();
        } catch (err) {
            alert('Failed to update card');
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this card? This cannot be undone.')) return;
        try {
            await apiClient.delete(`/cases/${id}`);
            fetchTickets();
        } catch (err) {
            alert('Failed to delete card');
        }
    };

    const handleDeescalate = async (id: string) => {
        try {
            await apiClient.post(`/cases/${id}/deescalate`, {});
            fetchTickets(); // It stays on board but moves column, but we are viewing filtered list? 
            // We filtered by "Escalations" column. If it moves to "De-escalated", it should disappear from this list.
        } catch (err) {
            alert('Failed to de-escalate');
        }
    };

    const handleDropDeescalate = async (e: React.DragEvent) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('text/plain');
        const source = e.dataTransfer.getData('source');

        if (source === 'deescalated') return; // Already in target zone

        // Confirm before action
        if (confirm('De-escalate/Resolve this card?')) {
            await handleDeescalate(cardId);
        }
    };

    const handleDropEscalate = async (e: React.DragEvent) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('text/plain');
        const source = e.dataTransfer.getData('source');

        if (source === 'escalated') return; // Already in target zone

        // Find the card details
        const draggedCard = deescalatedTickets.find(t => t.id === cardId);
        if (!draggedCard) return;

        if (confirm('Re-escalate this card?')) {
            try {
                // We need to find the "Escalations" column ID for the card's board
                // 1. Try to find from existing escalated tickets on the same board
                let targetColumnId = tickets.find(t => t.board.id === draggedCard.board.id)?.column.id;

                // 2. If not found (no current escalations for that board), fetch board details
                if (!targetColumnId) {
                    try {
                        const boardData = await apiClient.get<any>(`/boards/${draggedCard.board.id}`);
                        const escCol = boardData.columns.find((c: any) => c.name === 'Escalations');
                        if (escCol) {
                            targetColumnId = escCol.id;
                        }
                    } catch (err) {
                        console.error('Failed to fetch board details', err);
                    }
                }

                if (targetColumnId) {
                    await handleMoveCard(cardId, targetColumnId);
                } else {
                    alert('Could not look up "Escalations" column for this board. Please try escalating manually first.');
                }
            } catch (err) {
                alert('Failed to move card');
            }
        }
    };

    // Simple Render
    if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Loading escalations...</div>;
    if (error) return <div style={{ padding: '24px', textAlign: 'center', color: '#ef4444' }}>{error}</div>;

    return (
        <div style={{ padding: '24px', maxWidth: '100%' }}>
            <div style={{ paddingBottom: '24px', borderBottom: '1px solid var(--color-border)', marginBottom: '24px' }}>
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, margin: 0, color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⚠️</span> Escalations
                </h1>
                <p style={{ marginTop: '4px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                    High priority cards escalated for admin review.
                </p>
            </div>

            {/* Escalated Zone */}
            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropEscalate(e)}
                style={{
                    minHeight: '200px',
                    border: '2px dashed transparent',
                    transition: 'border-color 0.2s',
                    borderRadius: '8px'
                }}
                onDragEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-danger)')}
                onDragLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
            >
                {tickets.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)', background: 'var(--color-bg-surface)', borderRadius: '8px', border: '1px dashed var(--color-border)' }}>
                        <h3>No escalated cards found</h3>
                        <p>Good job! The queue is empty.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                        {tickets.map(ticket => (
                            <div key={ticket.id}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', ticket.id);
                                    e.dataTransfer.setData('source', 'escalated');
                                }}
                                style={{
                                    background: 'var(--color-bg-surface)',
                                    border: '1px solid var(--color-danger)',
                                    borderLeft: '4px solid var(--color-danger)',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    boxShadow: 'var(--shadow-sm)',
                                    cursor: 'grab',
                                    transition: 'transform 0.1s, box-shadow 0.1s',
                                    position: 'relative'
                                }}
                                onClick={() => handleView(ticket)}
                                className="escalation-card"
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        color: 'var(--color-danger)',
                                        background: '#fee2e2',
                                        padding: '2px 6px',
                                        borderRadius: '4px'
                                    }}>
                                        ESCALATED
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                        {ticket.board?.name}
                                    </span>
                                </div>

                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-main)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                                    {ticket.title.replace('[ESCALATED] ', '')}
                                </h3>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                            {ticket.assignee?.name?.charAt(0) || '?'}
                                        </div>
                                        <span>{ticket.assignee?.name || 'Unassigned'}</span>
                                    </div>
                                    {ticket.assignee?.teams && ticket.assignee.teams.length > 0 && (
                                        <span style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            backgroundColor: ticket.assignee.teams[0].team.color,
                                            color: '#fff',
                                            textTransform: 'uppercase'
                                        }}>
                                            {ticket.assignee.teams[0].team.name}
                                        </span>
                                    )}
                                </div>

                                <div style={{ marginBottom: '12px' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('De-escalate/Resolve this card?')) {
                                                handleDeescalate(ticket.id);
                                            }
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '6px 12px',
                                            background: 'transparent',
                                            color: 'var(--color-success)',
                                            border: '1px solid var(--color-success)',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-success-light, #f0fdf4)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        De-escalated / Resolved
                                    </button>
                                </div>

                                {/* Menu removed as per request */}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Separator */}
            <div style={{ marginTop: '48px', marginBottom: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>✅</span> De-escalated / Resolved
                </h2>
            </div>

            {/* De-escalated Zone */}
            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropDeescalate(e)}
                style={{
                    minHeight: '200px',
                    border: '2px dashed transparent',
                    transition: 'border-color 0.2s',
                    borderRadius: '8px'
                }}
                onDragEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-success)')}
                onDragLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
            >

                {deescalatedTickets.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        <p>No recently de-escalated cards.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                        {deescalatedTickets.map(ticket => (
                            <div key={ticket.id}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', ticket.id);
                                    e.dataTransfer.setData('source', 'deescalated');
                                }}
                                style={{
                                    background: 'var(--color-bg-surface)',
                                    border: '1px solid var(--color-border)',
                                    borderLeft: '4px solid var(--color-success)',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    boxShadow: 'var(--shadow-sm)',
                                    cursor: 'grab',
                                    opacity: 0.8
                                }}
                                onClick={() => handleView(ticket)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        color: 'var(--color-success)',
                                        background: '#dcfce7',
                                        padding: '2px 6px',
                                        borderRadius: '4px'
                                    }}>
                                        RESOLVED
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                        {ticket.board?.name}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)', margin: '0 0 8px 0', textDecoration: 'line-through' }}>
                                    {ticket.title.replace('[ESCALATED] ', '')}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>{ticket.assignee?.name || 'Unassigned'}</span>
                                    </div>
                                </div>
                                {/* Actions for de-escalated items? Maybe just delete? */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(ticket.id); }}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', fontSize: '0.75rem' }}
                                    >
                                        Delete Forever
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {viewingCard && (
                <CardDetailModal
                    card={{
                        ...viewingCard,
                        priority: (viewingCard.priority?.toLowerCase() as 'high' | 'medium' | 'low') || 'medium',
                        assignee: viewingCard.assignee?.name
                    }}
                    onClose={() => setViewingCard(null)}
                    currentColumnId={viewingCard.columnId}
                    columnIds={[]}
                    onMove={handleMoveCard}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
}
