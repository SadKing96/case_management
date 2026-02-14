import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { KanbanCard, CardProps } from './KanbanCard';
import { CardDetailModal } from './CardDetailModal';

interface Column {
    id: string;
    title: string;
    color?: string;
    cards: CardProps[];
}

export function KanbanBoard() {
    const { boardId } = useParams<{ boardId: string }>();
    const { currentRole } = useAuth();
    const [columns, setColumns] = useState<Column[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
    const [tempTitle, setTempTitle] = useState('');
    const [activeMenuColumnId, setActiveMenuColumnId] = useState<string | null>(null);
    const [selectedCard, setSelectedCard] = useState<CardProps | null>(null);
    const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

    // Check if user has permission to edit board
    const canManageBoard = currentRole === 'SuperUser' || currentRole === 'Admin';

    // Fetch Board Data
    useEffect(() => {
        const fetchBoard = async () => {
            if (!boardId) return;

            setLoading(true);
            try {
                // Fetch full board details directly using boardId
                const boardData: any = await apiClient.get(`/boards/${boardId}`);

                if (!boardData || !boardData.columns) {
                    // Try to handle case where columns might be missing (new board?)
                    if (boardData && !boardData.columns) {
                        setColumns([]);
                        return;
                    }
                    throw new Error('Invalid board data received');
                }

                // Transform to Column format
                const mappedColumns = boardData.columns.map((col: any) => ({
                    id: col.id,
                    title: col.name,
                    color: col.color || '#cbd5e1', // Add color to DB schema if missing
                    cards: col.cases.map((c: any) => ({
                        id: c.id,
                        title: c.title,
                        priority: c.priority?.toLowerCase() || 'medium',
                        assignee: c.assignee ? c.assignee.name : 'Unassigned',
                        team: c.assignee?.teams?.[0]?.team ? {
                            id: c.assignee.teams[0].team.id,
                            name: c.assignee.teams[0].team.name,
                            color: c.assignee.teams[0].team.color
                        } : undefined,
                        dueDate: c.opdsl ? new Date(c.opdsl).toLocaleDateString() : '',
                        type: c.caseType, // Map backend 'caseType' to frontend 'type'
                        quoteId: c.quoteId,
                        productType: c.productType,
                        customerName: c.customerName,
                        poNumber: c.poNumber,
                        escalatedToId: c.escalatedTo?.column?.name === 'Escalations' ? c.escalatedToId : undefined,
                        createdAt: c.createdAt
                    }))
                }));
                setColumns(mappedColumns);
            } catch (err: any) {
                console.error('Failed to fetch board:', err);
                setError(err.message || 'Failed to load board data. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchBoard();
    }, [boardId]);

    if (loading) return <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading board...</div>;
    if (error) return <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-danger)' }}>{error}</div>;

    const getColumnIdForCard = (cardId: string): string => {
        for (const column of columns) {
            if (column.cards.find(c => c.id === cardId)) {
                return column.id;
            }
        }
        return '';
    };

    const handleMoveCard = async (cardId: string, targetColumnId: string) => {
        const sourceColumnId = getColumnIdForCard(cardId);
        if (!sourceColumnId || sourceColumnId === targetColumnId) return;

        // Check if card is a QUOTE - Quotes cannot be moved manually
        // We need to look up the card in the columns
        const sourceColCheck = columns.find(c => c.id === sourceColumnId);
        const cardCheck = sourceColCheck?.cards.find(c => c.id === cardId);
        if (cardCheck?.type === 'QUOTE') {
            alert('Quote cards cannot be moved manually. Use Win/Lose actions.');
            return;
        }

        // Optimistic update
        const previousColumns = [...columns];

        setColumns(prev => {
            const newColumns = prev.map(c => ({
                ...c,
                cards: [...c.cards]
            }));
            const sourceCol = newColumns.find(c => c.id === sourceColumnId);
            const targetCol = newColumns.find(c => c.id === targetColumnId);

            if (sourceCol && targetCol) {
                const cardIndex = sourceCol.cards.findIndex(c => c.id === cardId);
                if (cardIndex !== -1) {
                    const [movedCard] = sourceCol.cards.splice(cardIndex, 1);
                    targetCol.cards.push(movedCard);
                }
            }
            return newColumns;
        });

        try {
            const targetCol = columns.find(c => c.id === targetColumnId);
            const position = targetCol ? targetCol.cards.length : 0; // Append to end

            await apiClient.post(`/cases/${cardId}/move`, {
                columnId: targetColumnId,
                position: position + 1 // Backend logic often expects 0-indexed or 1-indexed, using +1 safely for append?
                // Actually sticking to large number or let backend handle?
                // Using targetCol.cards.length from PREVIOUS state should be fine as 0-index for NEW item.
            });

        } catch (err) {
            console.error('Failed to move card:', err);
            setColumns(previousColumns);
            alert('Failed to save card move');
        }
    };

    const handleAddColumn = async () => {
        if (!canManageBoard) return;

        try {
            const newPosition = columns.length;
            const res: any = await apiClient.post(`/boards/${boardId}/columns`, {
                name: 'New Section',
                position: newPosition,
                isFinal: false
            });

            const newCol: Column = {
                id: res.id,
                title: res.name,
                color: res.color || '#94a3b8',
                cards: []
            };
            setColumns(prev => [...prev, newCol]);
        } catch (err) {
            console.error('Failed to create column:', err);
            alert('Failed to create new section');
        }
    };

    const handleMoveColumn = async (columnId: string, direction: 'left' | 'right') => {
        if (!canManageBoard) return;

        const index = columns.findIndex(c => c.id === columnId);
        if (index === -1) return;

        const newIndex = direction === 'left' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= columns.length) return;

        // Optimistic swap
        const newColumns = [...columns];
        [newColumns[index], newColumns[newIndex]] = [newColumns[newIndex], newColumns[index]];
        setColumns(newColumns);

        try {
            // Update positions for BOTH columns
            const col1 = newColumns[index]; // Was at newIndex
            const col2 = newColumns[newIndex]; // Was at index

            // Allow parallel updates
            await Promise.all([
                apiClient.put(`/boards/${boardId}/columns/${col1.id}`, { position: index }),
                apiClient.put(`/boards/${boardId}/columns/${col2.id}`, { position: newIndex })
            ]);
        } catch (err) {
            console.error('Failed to move column:', err);
            // Revert is complex, just alert for now or reload
            alert('Failed to save column order. Please refresh.');
        }
    };

    const handleUpdateColumn = async (columnId: string, updates: Partial<Column>) => {
        if (!canManageBoard) return;

        // Optimistic
        setColumns(prev => prev.map(c => c.id === columnId ? { ...c, ...updates } : c));

        try {
            // Map 'title' to 'name'
            const payload: any = {};
            if (updates.title !== undefined) payload.name = updates.title;
            if (updates.color !== undefined) payload.color = updates.color;
            if (updates.title === undefined && updates.color === undefined) return; // Nothing to sync

            await apiClient.put(`/boards/${boardId}/columns/${columnId}`, payload);
        } catch (err) {
            console.error('Failed to update column:', err);
            alert('Failed to save changes');
        }
    };

    const handleDeleteColumn = async (columnId: string) => {
        if (!canManageBoard) return;
        if (!window.confirm('Are you sure you want to delete this section? All cards in it will be deleted.')) return;

        // Optimistic
        const previousColumns = [...columns];
        setColumns(prev => prev.filter(c => c.id !== columnId));

        try {
            await apiClient.delete(`/boards/${boardId}/columns/${columnId}`);
        } catch (err) {
            console.error('Failed to delete column:', err);
            setColumns(previousColumns);
            alert('Failed to delete section');
        }
    };

    const startEditing = (column: Column) => {
        setEditingColumnId(column.id);
        setTempTitle(column.title);
    };

    const saveTitle = (columnId: string) => {
        if (tempTitle.trim()) {
            handleUpdateColumn(columnId, { title: tempTitle });
        }
        setEditingColumnId(null);
    };

    const handleDragStart = (e: React.DragEvent, cardId: string) => {
        e.stopPropagation();
        setDraggedCardId(cardId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedCardId) {
            // Find the card to check type
            const sourceColumnId = getColumnIdForCard(draggedCardId);
            const sourceCol = columns.find(c => c.id === sourceColumnId);
            const card = sourceCol?.cards.find(c => c.id === draggedCardId);

            // Prevent dragging QUOTE cards (except maybe within same column?)
            // Requirement: "Quote cards can never leave the first column"
            // Also checking title as fallback for data inconsistency
            const isQuote = card?.type === 'QUOTE' || card?.title?.startsWith('Quote');

            if (isQuote && sourceColumnId !== targetColumnId) {
                alert('Quote cards cannot be moved manually. Use Win/Lose actions.');
                return;
            }

            handleMoveCard(draggedCardId, targetColumnId);
            setDraggedCardId(null);
        }
    };

    const handleWinCard = async (cardId: string) => {
        if (!window.confirm('Mark this quote as WON? It will be converted to an Order and moved.')) return;

        // Find second column logic
        // Assuming columns are sorted by position, index 1 is the 2nd column
        if (columns.length < 2) {
            alert('Cannot move to next stage: Board has fewer than 2 columns.');
            return;
        }
        const targetColumn = columns[1]; // Second column

        // Find card to get details
        const sourceColumnId = getColumnIdForCard(cardId);
        const sourceCol = columns.find(c => c.id === sourceColumnId);
        const cardToWin = sourceCol?.cards.find(c => c.id === cardId);

        if (!cardToWin) return;

        const newTitle = cardToWin.quoteId
            ? `${cardToWin.title} (Ref: ${cardToWin.quoteId})`
            : cardToWin.title;

        try {
            // Optimistic Update
            // We need to move it AND update type
            setColumns(prev => {
                const newCols = prev.map(c => ({ ...c, cards: [...c.cards] }));
                // Find and remove from old
                let card: CardProps | undefined;
                newCols.forEach(c => {
                    const idx = c.cards.findIndex(card => card.id === cardId);
                    if (idx !== -1) {
                        [card] = c.cards.splice(idx, 1);
                    }
                });

                if (card) {
                    // Update card props
                    card.type = 'ORDER';
                    card.title = newTitle;
                    // Add to target
                    const newTarget = newCols.find(c => c.id === targetColumn.id);
                    if (newTarget) newTarget.cards.push(card);
                }
                return newCols;
            });

            // API Call
            await apiClient.put(`/cases/${cardId}`, {
                caseType: 'ORDER',
                columnId: targetColumn.id,
                title: newTitle
            });

            // Reload board to ensure sync
            // window.location.reload(); // Or refetch
        } catch (err) {
            console.error('Failed to win card', err);
            alert('Failed to update card status');
        }
    };

    const handleLoseCard = async (cardId: string) => {
        if (!window.confirm('Mark this quote as LOST? It will be archived.')) return;

        // Optimistic Remove
        setColumns(prev => prev.map(c => ({
            ...c,
            cards: c.cards.filter(card => card.id !== cardId)
        })));

        try {
            await apiClient.put(`/cases/${cardId}`, {
                archivedAt: new Date().toISOString()
            });
        } catch (err) {
            console.error('Failed to archive card', err);
            alert('Failed to archive card');
        }
    };

    const handleUpdateCard = async (cardId: string, updates: Partial<CardProps>) => {
        // Optimistic
        setColumns(prev => prev.map(col => ({
            ...col,
            cards: col.cards.map(c => c.id === cardId ? { ...c, ...updates } : c)
        })));
        if (selectedCard && selectedCard.id === cardId) {
            setSelectedCard(prev => prev ? { ...prev, ...updates } : null);
        }

        try {
            await apiClient.put(`/cases/${cardId}`, updates);
        } catch (err) {
            console.error(err);
            alert("Failed to update card");
        }
    };

    const handleDeleteCard = async (cardId: string) => {
        // Optimistic remove
        setColumns(prev => prev.map(col => ({
            ...col,
            cards: col.cards.filter(c => c.id !== cardId)
        })));

        if (selectedCard?.id === cardId) setSelectedCard(null);

        try {
            await apiClient.delete(`/cases/${cardId}`); // Soft delete (Trash) is safer and avoids FK constraints
        } catch (err) {
            console.error("Failed to delete card:", err);
            alert("Failed to delete card");
        }
    };

    return (
        <div className="kanban-board">
            {/* Filter Escalations Column - Moved to Sidebar Page */}
            {columns.filter(col => {
                if (col.title === 'Escalations' || col.title === 'De-escalated') {
                    return false; // Always hide from board view
                }
                return true;
            }).map((column, index) => (
                <div
                    key={column.id}
                    className="kanban-column"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.id)}
                    style={{ borderTop: `3px solid ${column.color || 'transparent'}` }}
                >
                    <div className="column-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
                        {editingColumnId === column.id ? (
                            <input
                                autoFocus
                                value={tempTitle}
                                onChange={e => setTempTitle(e.target.value)}
                                onBlur={() => saveTitle(column.id)}
                                onKeyDown={e => e.key === 'Enter' && saveTitle(column.id)}
                                style={{
                                    border: '1px solid var(--color-primary)',
                                    borderRadius: '4px',
                                    padding: '2px 4px',
                                    width: '100%'
                                }}
                            />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 600 }}>{column.title}</span>
                                <span className="column-count">{column.cards.length}</span>
                            </div>
                        )}

                        {canManageBoard && (
                            <div
                                className="column-settings-trigger"
                                style={{ position: 'relative', cursor: 'pointer' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuColumnId(activeMenuColumnId === column.id ? null : column.id);
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.5 }}>
                                    <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
                                </svg>

                                {activeMenuColumnId === column.id && (
                                    <div
                                        className="column-menu"
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: 0,
                                            marginTop: '0.5rem',
                                            background: 'var(--color-bg-surface)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)',
                                            boxShadow: 'var(--shadow-lg)',
                                            zIndex: 50,
                                            minWidth: '150px',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div
                                            className="menu-item"
                                            onClick={() => { startEditing(column); setActiveMenuColumnId(null); }}
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            ✏️ Edit Name
                                        </div>
                                        <div
                                            className="menu-item"
                                            onClick={() => { handleMoveColumn(column.id, 'left'); setActiveMenuColumnId(null); }}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                fontSize: '0.875rem',
                                                cursor: index === 0 ? 'not-allowed' : 'pointer',
                                                opacity: index === 0 ? 0.5 : 1
                                            }}
                                        >
                                            ⬅️ Move Left
                                        </div>
                                        <div
                                            className="menu-item"
                                            onClick={() => { handleMoveColumn(column.id, 'right'); setActiveMenuColumnId(null); }}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                fontSize: '0.875rem',
                                                cursor: index === columns.length - 1 ? 'not-allowed' : 'pointer',
                                                opacity: index === columns.length - 1 ? 0.5 : 1
                                            }}
                                        >
                                            ➡️ Move Right
                                        </div>
                                        <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.25rem 0' }} />
                                        <div style={{ padding: '0.5rem 1rem' }}>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Color</p>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(color => (
                                                    <div
                                                        key={color}
                                                        onClick={() => { handleUpdateColumn(column.id, { color }); setActiveMenuColumnId(null); }}
                                                        style={{
                                                            width: '16px',
                                                            height: '16px',
                                                            borderRadius: '50%',
                                                            backgroundColor: color,
                                                            cursor: 'pointer',
                                                            border: column.color === color ? '2px solid var(--color-text-main)' : '1px solid transparent'
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.25rem 0' }} />
                                        <div
                                            className="menu-item"
                                            onClick={() => { handleDeleteColumn(column.id); setActiveMenuColumnId(null); }}
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--color-danger)' }}
                                        >
                                            🗑️ Delete Section
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="column-body">
                        {column.cards.map(card => (
                            <KanbanCard
                                key={card.id}
                                {...card}
                                onClick={() => setSelectedCard(card)}
                                onDragStart={(e) => handleDragStart(e, card.id)}
                                onWin={(e) => handleWinCard(card.id)}
                                onLose={(e) => handleLoseCard(card.id)}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {canManageBoard && (
                <button
                    className="btn"
                    onClick={handleAddColumn}
                    style={{
                        minWidth: '300px',
                        background: 'transparent',
                        border: '1px dashed var(--color-border)',
                        color: 'var(--color-text-secondary)',
                        height: 'fit-content',
                        justifyContent: 'center'
                    }}
                >
                    + Add Section
                </button>
            )}

            {selectedCard && (
                <CardDetailModal
                    card={selectedCard}
                    onClose={() => setSelectedCard(null)}
                    currentColumnId={getColumnIdForCard(selectedCard.id)}
                    columnIds={columns.map(c => c.id)}
                    onMove={handleMoveCard}
                    onUpdate={handleUpdateCard}
                    onDelete={handleDeleteCard}
                    onEscalate={async (cardId) => {
                        if (!window.confirm('Escalate this card? It will be copied to the Escalations queue.')) return;
                        try {
                            const res: any = await apiClient.post(`/cases/${cardId}/escalate`, {});
                            alert('Card escalated successfully');
                            // Optimistic Update: Add escalatedToId
                            setColumns(prev => prev.map(col => ({
                                ...col,
                                cards: col.cards.map(c => c.id === cardId ? { ...c, escalatedToId: res.id } : c)
                            })));
                            if (selectedCard?.id === cardId) {
                                setSelectedCard(prev => prev ? { ...prev, escalatedToId: res.id } : null);
                            }
                        } catch (err) {
                            console.error(err);
                            alert('Failed to escalate card');
                        }
                    }}
                    onDeescalate={async (cardId) => {
                        if (!window.confirm('Undo escalation? This will move the escalated card to "De-escalated".')) return;
                        try {
                            await apiClient.post(`/cases/${cardId}/deescalate`, {});
                            alert('Escalation undone.');
                            // Optimistic Update: Remove escalatedToId
                            setColumns(prev => prev.map(col => ({
                                ...col,
                                cards: col.cards.map(c => c.id === cardId ? { ...c, escalatedToId: undefined } : c)
                            })));
                            if (selectedCard?.id === cardId) {
                                setSelectedCard(prev => prev ? { ...prev, escalatedToId: undefined } : null);
                            }
                        } catch (err) {
                            console.error(err);
                            alert('Failed to undo escalation');
                        }
                    }}
                />
            )}
        </div>
    );
}
