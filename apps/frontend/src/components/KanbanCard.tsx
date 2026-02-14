import React from 'react';
import '../styles/kanban.css';

export interface CardProps {
    id: string;
    title: string;
    description?: string;
    priority: 'high' | 'medium' | 'low';
    assignee?: string;
    // New prop for team
    team?: {
        id: string;
        name: string;
        color: string;
    };
    createdAt?: string | Date;
    dueDate?: string;
    tags?: string[];
    type?: 'ORDER' | 'QUOTE' | 'QUESTION' | 'SR' | string;
    quoteId?: string;
    productType?: string;
    customerName?: string;
    poNumber?: string;
    emailSlug?: string;
    escalatedToId?: string;
    onClick?: () => void;
    onDragStart?: (e: React.DragEvent) => void;
    onWin?: (e: React.MouseEvent) => void;
    onLose?: (e: React.MouseEvent) => void;
}

export function KanbanCard({
    title, priority, assignee, team, dueDate, tags, type, quoteId, productType, customerName, poNumber, escalatedToId, createdAt,
    onClick, onDragStart, onWin, onLose
}: CardProps) {
    const isQuote = type === 'QUOTE';
    const isSR = type === 'SR';
    const isQuestion = type === 'QUESTION';

    return (
        <div
            className={`kanban-card ${isQuote ? 'quote-card' : ''}`}
            onClick={onClick}
            draggable={!!onDragStart}
            onDragStart={onDragStart}
            style={escalatedToId ? { borderLeft: '4px solid var(--color-danger)' } : undefined}
        >
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {escalatedToId && (
                        <span title="Escalated" style={{ fontSize: '1rem' }}>⚠️</span>
                    )}
                    {isSR && <span title="Service Request" style={{ fontSize: '1rem' }}>🛠️</span>}
                    {isQuestion && <span title="Question" style={{ fontSize: '1rem' }}>❓</span>}
                    {priority && (
                        <div className="card-tags">
                            <span className={`tag ${priority}`}>{priority}</span>
                        </div>
                    )}
                    {/* Team Badge */}
                    {team && (
                        <div className="card-tags">
                            <span style={{
                                display: 'inline-block',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor: team.color,
                                color: '#fff',
                                textTransform: 'uppercase'
                            }}>
                                {team.name}
                            </span>
                        </div>
                    )}
                </div>
                {/* Days Open / Actions - Top Right */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    {isQuote && quoteId && (
                        <span className="quote-badge" style={{ marginBottom: '2px' }}>
                            #{quoteId}
                        </span>
                    )}
                    {createdAt && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                            {Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 3600 * 24))}d
                        </span>
                    )}
                </div>
            </div>

            <div className="card-title" style={{ marginBottom: isQuote ? '0.25rem' : '0.75rem' }}>
                {!isQuote && poNumber ? poNumber : title}
            </div>

            {isQuote && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                    {customerName && <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{customerName}</div>}
                    {productType && <div>{productType}</div>}
                </div>
            )}

            <div className="card-footer">
                <div className="card-assignee">
                    {assignee ? (
                        <>
                            <div className="assignee-avatar" title={assignee}>
                                {assignee.charAt(0).toUpperCase()}
                            </div>
                            <span>{assignee.split(' ')[0]}</span>
                        </>
                    ) : (
                        <span style={{ fontStyle: 'italic', fontSize: '0.8rem', opacity: 0.7 }}>Unassigned</span>
                    )}
                </div>
                {dueDate && (
                    <div className="card-meta">
                        📅 {dueDate}
                    </div>
                )}
            </div>

            {isQuote && (
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onWin?.(e); }}
                        style={{
                            flex: 1,
                            padding: '4px',
                            background: 'var(--color-success)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600
                        }}
                    >
                        WIN
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onLose?.(e); }}
                        style={{
                            flex: 1,
                            padding: '4px',
                            background: 'var(--color-danger)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600
                        }}
                    >
                        LOSE
                    </button>
                </div>
            )}
        </div>
    );
}
