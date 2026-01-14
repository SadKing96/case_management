import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Case } from '../../../../packages/shared/src/types';

interface CaseWithDetails extends Case {
    board: { id: string; name: string; slug: string; color: string };
    column: { id: string; name: string; color: string };
    assignee?: { id: string; name: string; email: string };
    escalatedTo?: { column: { name: string } };
}

import { CreateCardModal } from './CreateCardModal';
import { CardDetailModal } from './CardDetailModal';

type SortDirection = 'asc' | 'desc' | null;
interface SortConfig {
    key: string;
    direction: SortDirection;
}

export function TicketList() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<CaseWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Filter & Sort State
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null });
    const [filters, setFilters] = useState<Record<string, string[]>>({});
    const [openFilterColumn, setOpenFilterColumn] = useState<string | null>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    // Modal States
    const [viewingCard, setViewingCard] = useState<CaseWithDetails | null>(null);
    const [editingCard, setEditingCard] = useState<CaseWithDetails | null>(null);

    const fetchTickets = async () => {
        try {
            const data = await apiClient.get<CaseWithDetails[]>('/cases?active=true');
            setTickets(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load cases');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();

        // click outside to close menu
        const handleClickOutside = (event: MouseEvent) => {
            if (openMenuId && !(event.target as Element).closest('.action-menu-trigger')) {
                setOpenMenuId(null);
            }
            if (openFilterColumn && filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setOpenFilterColumn(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId, openFilterColumn]);

    const toggleMenu = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === id ? null : id);
    };

    const handleView = (ticket: CaseWithDetails) => {
        setViewingCard(ticket);
    };

    const handleEdit = (ticket: CaseWithDetails) => {
        setEditingCard(ticket);
    };

    const handleArchive = async (id: string) => {
        if (!confirm('Are you sure you want to archive this card?')) return;
        try {
            await apiClient.patch(`/cases/${id}/archive`, {});
            fetchTickets();
        } catch (err) {
            alert('Failed to archive card');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this card? This cannot be undone.')) return;
        try {
            await apiClient.delete(`/cases/${id}`);
            fetchTickets();
        } catch (err) {
            alert('Failed to delete card');
        }
    };

    const handleUpdateSubmit = async (data: any) => {
        if (!editingCard) return;
        try {
            await apiClient.put(`/cases/${editingCard.id}`, data);
            setEditingCard(null);
            fetchTickets();
        } catch (err) {
            alert('Failed to update card');
        }
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

    const handleEscalate = async (cardId: string) => {
        if (!confirm('Escalate this card? It will be copied to the Escalations queue.')) return;
        try {
            await apiClient.post(`/cases/${cardId}/escalate`, {});
            alert('Card escalated successfully');
            fetchTickets();
        } catch (err) {
            console.error(err);
            alert('Failed to escalate card');
        }
    };

    const handleDeescalate = async (cardId: string) => {
        if (!confirm('Undo escalation? This will move the escalated card to "De-escalated".')) return;
        try {
            await apiClient.post(`/cases/${cardId}/deescalate`, {});
            alert('Escalation undone.');
            setViewingCard(prev => prev ? { ...prev, escalatedToId: undefined } : null); // Optimistic
            fetchTickets(); // Refresh list to be sure
        } catch (err) {
            console.error(err);
            alert('Failed to undo escalation');
        }
    };

    // --- Filtering & Sorting Logic ---

    const getColumnValue = (ticket: CaseWithDetails, columnKey: string): string => {
        switch (columnKey) {
            case 'title': return ticket.title;
            case 'board': return ticket.board?.name || 'Unknown';
            case 'column': return ticket.column?.name || 'Unknown';
            case 'assignee': return ticket.assignee?.name || 'Unassigned';
            case 'priority': return ticket.priority || 'Medium';
            case 'dueDate': return ticket.opdsl ? new Date(ticket.opdsl).toLocaleDateString() : '-';
            case 'daysOpen': return Math.floor((new Date().getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 3600 * 24)).toString();
            default: return '';
        }
    };

    const getUniqueValues = (columnKey: string) => {
        const values = new Set(tickets.map(t => getColumnValue(t, columnKey)));
        return Array.from(values).sort();
    };

    const handleSort = (key: string, direction: SortDirection) => {
        setSortConfig({ key, direction });
        setOpenFilterColumn(null); // Close dropdown after sort
    };

    const handleFilterChange = (columnKey: string, value: string) => {
        setFilters(prev => {
            const current = prev[columnKey] || [];
            if (current.includes(value)) {
                return { ...prev, [columnKey]: current.filter(v => v !== value) };
            } else {
                return { ...prev, [columnKey]: [...current, value] };
            }
        });
    };

    const handleSelectAll = (columnKey: string, values: string[]) => {
        setFilters(prev => {
            const current = prev[columnKey] || [];
            if (current.length === values.length) {
                return { ...prev, [columnKey]: [] }; // Deselect all
            } else {
                return { ...prev, [columnKey]: values }; // Select all
            }
        });
    };

    const clearFilter = (columnKey: string) => {
        setFilters(prev => {
            const next = { ...prev };
            delete next[columnKey];
            return next;
        });
    };

    const filteredTickets = useMemo(() => {
        let result = [...tickets];

        // Apply Filters
        Object.entries(filters).forEach(([key, selectedValues]) => {
            if (selectedValues.length > 0) {
                result = result.filter(ticket => selectedValues.includes(getColumnValue(ticket, key)));
            }
        });

        // Apply Sort
        if (sortConfig.key && sortConfig.direction) {
            result.sort((a, b) => {
                const valA = getColumnValue(a, sortConfig.key).toLowerCase();
                const valB = getColumnValue(b, sortConfig.key).toLowerCase();
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [tickets, filters, sortConfig]);

    const renderFilterDropdown = (columnKey: string, label: string) => {
        if (openFilterColumn !== columnKey) return null;

        const uniqueValues = getUniqueValues(columnKey);
        const selectedValues = filters[columnKey] || [];
        const isAllSelected = selectedValues.length === uniqueValues.length;

        return (
            <div ref={filterRef} style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-lg)',
                width: '240px',
                zIndex: 100,
                color: 'var(--color-text-main)',
                fontSize: 'var(--text-sm)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ padding: '8px', borderBottom: '1px solid var(--color-border)' }}>
                    <button
                        onClick={() => handleSort(columnKey, 'asc')}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-main)' }}
                        className="hover-bg-app"
                    >
                        Sort A to Z
                    </button>
                    <button
                        onClick={() => handleSort(columnKey, 'desc')}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-main)' }}
                        className="hover-bg-app"
                    >
                        Sort Z to A
                    </button>
                </div>
                <div style={{ padding: '8px', overflowY: 'auto', maxHeight: '200px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', cursor: 'pointer', fontWeight: 600 }}>
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={() => handleSelectAll(columnKey, uniqueValues)}
                        />
                        (Select All)
                    </label>
                    {uniqueValues.map(val => (
                        <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={selectedValues.includes(val)}
                                onChange={() => handleFilterChange(columnKey, val)}
                            />
                            {val}
                        </label>
                    ))}
                </div>
                <div style={{ padding: '8px', borderTop: '1px solid var(--color-border)', textAlign: 'right' }}>
                    <button
                        onClick={() => clearFilter(columnKey)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}
                    >
                        Clear Filter
                    </button>
                </div>
            </div>
        );
    };

    const renderHeaderCell = (label: string, columnKey: string, align: 'left' | 'right' = 'left') => {
        const isFiltered = filters[columnKey]?.length > 0;
        const isSorted = sortConfig.key === columnKey;

        return (
            <th style={{ textAlign: align, padding: '12px 24px', fontWeight: 600, color: 'var(--color-text-secondary)', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
                    {label}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenFilterColumn(openFilterColumn === columnKey ? null : columnKey);
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: isFiltered || isSorted ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z" />
                        </svg>
                    </button>
                </div>
                {renderFilterDropdown(columnKey, label)}
            </th>
        );
    };


    if (loading) {
        return <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Loading cases...</div>;
    }

    if (error) {
        return <div style={{ padding: '24px', textAlign: 'center', color: '#ef4444' }}>{error}</div>;
    }

    if (tickets.length === 0) {
        return <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>No active cases found.</div>;
    }

    return (
        <div style={{ padding: '24px', maxWidth: '100%' }}>
            <div style={{ paddingBottom: '24px' }}>
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, margin: 0, color: 'var(--color-text-main)' }}>Cards</h1>
                <p style={{ marginTop: '4px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>View and manage all active cards across all boards.</p>
            </div>

            <div style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'visible' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                    <thead style={{ background: 'var(--color-bg-app)', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                            {renderHeaderCell('Case Title', 'title')}
                            {renderHeaderCell('Board', 'board')}
                            {renderHeaderCell('Column', 'column')}
                            {renderHeaderCell('Assignee', 'assignee')}
                            {renderHeaderCell('Priority', 'priority')}
                            {renderHeaderCell('Due Date', 'dueDate')}
                            {renderHeaderCell('Days Open', 'daysOpen')}
                            <th style={{ textAlign: 'right', padding: '12px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTickets.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    No cards match the current filters.
                                </td>
                            </tr>
                        ) : (
                            filteredTickets.map(ticket => (
                                <tr key={ticket.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--color-text-main)' }}>
                                        {ticket.title}
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: 'var(--radius-sm)',
                                            background: ticket.board?.color || 'var(--color-bg-app)',
                                            color: '#fff',
                                            fontSize: 'var(--text-xs)',
                                            fontWeight: 600
                                        }}>
                                            {ticket.board?.name || 'Unknown Board'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>
                                        {ticket.column?.name || 'Unknown'}
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                background: 'var(--color-border)',
                                                color: 'var(--color-text-secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '10px',
                                                fontWeight: 700
                                            }}>
                                                {ticket.assignee?.name?.charAt(0) || '?'}
                                            </div>
                                            <span style={{ color: 'var(--color-text-secondary)' }}>{ticket.assignee?.name || 'Unassigned'}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{
                                            textTransform: 'uppercase',
                                            fontSize: 'var(--text-xs)',
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: '99px',
                                            background: ticket.priority === 'High' ? 'var(--color-bg-column)' : ticket.priority === 'Medium' ? 'var(--color-bg-column)' : 'var(--color-bg-column)',
                                            color: ticket.priority === 'High' ? 'var(--color-danger)' : ticket.priority === 'Medium' ? 'var(--color-warning)' : 'var(--color-success)',
                                            border: `1px solid ${ticket.priority === 'High' ? 'var(--color-danger)' : ticket.priority === 'Medium' ? 'var(--color-warning)' : 'var(--color-success)'}`
                                        }}>
                                            {ticket.priority || 'Medium'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>
                                        {ticket.opdsl ? new Date(ticket.opdsl).toLocaleDateString() : '-'}
                                    </td>
                                    <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>
                                        {Math.floor((new Date().getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 3600 * 24))}d
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right', position: 'relative' }}>
                                        <button
                                            className="action-menu-trigger"
                                            onClick={(e) => toggleMenu(e, ticket.id)}
                                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', color: 'var(--color-text-secondary)' }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                                            </svg>
                                        </button>

                                        {openMenuId === ticket.id && (
                                            <div style={{
                                                position: 'absolute',
                                                right: '24px',
                                                top: '40px',
                                                background: 'var(--color-bg-surface)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '8px',
                                                boxShadow: 'var(--shadow-md)',
                                                width: '160px',
                                                zIndex: 50,
                                                textAlign: 'left',
                                                overflow: 'hidden'
                                            }}>
                                                <button
                                                    onClick={() => handleView(ticket)}
                                                    style={{ width: '100%', padding: '8px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-main)', display: 'block' }}
                                                    className="hover-bg-app"
                                                >
                                                    View Card
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(ticket)}
                                                    style={{ width: '100%', padding: '8px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-main)', display: 'block' }}
                                                    className="hover-bg-app"

                                                >
                                                    Edit Card
                                                </button>
                                                <button
                                                    onClick={() => handleEscalate(ticket.id)}
                                                    style={{ width: '100%', padding: '8px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-danger)', fontWeight: 600, display: 'block' }}
                                                    className="hover-bg-app"
                                                >
                                                    ⚠️ Escalate
                                                </button>
                                                <button
                                                    onClick={() => handleArchive(ticket.id)}
                                                    style={{ width: '100%', padding: '8px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-main)', display: 'block' }}
                                                    className="hover-bg-app"
                                                >
                                                    Archive Card
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(ticket.id)}
                                                    style={{ width: '100%', padding: '8px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-danger)', display: 'block' }}
                                                    className="hover-bg-app"
                                                >
                                                    Delete Card
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* View Modal */}
            {viewingCard && (
                <CardDetailModal
                    card={{
                        id: viewingCard.id,
                        title: viewingCard.title,
                        priority: (viewingCard.priority?.toLowerCase() as 'high' | 'medium' | 'low') || 'medium',
                        assignee: viewingCard.assignee?.name,
                        dueDate: viewingCard.opdsl ? new Date(viewingCard.opdsl).toLocaleDateString() : undefined,
                        tags: [], // map details if needed
                        type: viewingCard.type,
                        quoteId: viewingCard.quoteId,
                        productType: viewingCard.productType,
                        customerName: viewingCard.customerName,
                        escalatedToId: viewingCard.escalatedTo?.column?.name === 'Escalations' ? viewingCard.escalatedToId : undefined,
                        createdAt: viewingCard.createdAt,
                    }}
                    onClose={() => setViewingCard(null)}
                    currentColumnId={viewingCard.columnId}
                    columnIds={[]} // We don't have board columns context here easily, move might be limited unless we fetch board.
                    onMove={handleMoveCard}
                    onEscalate={handleEscalate}
                    onDeescalate={handleDeescalate}
                />
            )}
        </div>
    );
}
