import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/kanban.css';
import { EditBoardModal } from './EditBoardModal';

import { CreateBoardModal } from './CreateBoardModal';
import { useAuth } from '../context/AuthContext';
import { useBoards } from '../context/BoardsContext';
// Reuse existing styles or add specific ones

export function BoardsLanding() {
    // boards come from context now
    const { boards, loading, refreshBoards } = useBoards();
    const { currentRole } = useAuth();

    // Modals
    const [editingBoard, setEditingBoard] = useState<any | null>(null);
    const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);

    useEffect(() => {
        refreshBoards();
    }, [currentRole]);

    const handleUpdateBoard = async (data: any) => {
        if (!editingBoard) return;
        await fetch(`http://localhost:3001/api/v1/boards/${editingBoard.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer mock-token'
            },
            body: JSON.stringify(data)
        });
        await refreshBoards(); // Refresh context
        setEditingBoard(null);
    };



    const handleCreateBoard = async (data: any) => {
        await fetch('http://localhost:3001/api/v1/boards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer mock-token'
            },
            body: JSON.stringify(data)
        });
        await refreshBoards(); // Refresh context
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading boards...</div>;

    const isAdmin = currentRole === 'Admin' || currentRole === 'SuperUser';

    return (
        <div style={{ padding: '1.5rem', maxWidth: '100%', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Your Workspace</h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem', fontSize: '1.1rem' }}>Manage your teams and projects.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {isAdmin && (
                        <>
                            <button
                                className="btn btn-primary"
                                onClick={() => setIsCreateBoardOpen(true)}
                                style={{ padding: '0.75rem 1.25rem', fontSize: '0.95rem', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)' }}
                            >
                                + New Board
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                {/* Board Cards */}
                {boards.map(board => (
                    <div
                        key={board.id}
                        className="board-card"
                        style={{
                            background: 'var(--color-bg-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.5rem',
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                            e.currentTarget.style.borderColor = board.color || 'var(--color-primary)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
                            e.currentTarget.style.borderColor = 'var(--color-border)';
                        }}
                    >
                        {/* Colored decorative top bar */}
                        <div style={{ height: '6px', width: '100%', background: board.color || 'var(--color-primary)', position: 'absolute', top: 0, left: 0 }} />

                        <div style={{ marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{board.name}</h3>
                                {board.description && <span style={{ fontSize: '1.5rem', lineHeight: '1rem', opacity: 0.5 }}>📝</span>}
                            </div>
                            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', margin: '0.75rem 0 0 0', lineHeight: 1.5, minHeight: '3em' }}>
                                {board.description || 'No description provided for this board.'}
                            </p>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', gap: '0.75rem' }}>
                            <Link
                                to={`/boards/${board.id}`}
                                className="btn btn-primary"
                                style={{
                                    flex: 1,
                                    textAlign: 'center',
                                    textDecoration: 'none',
                                    justifyContent: 'center',
                                    backgroundColor: board.color || 'var(--color-primary)',
                                    borderColor: board.color || 'var(--color-primary)'
                                }}
                            >
                                Open Board
                            </Link>
                            {isAdmin && (
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setEditingBoard(board)}
                                    style={{ padding: '0.5rem 1rem' }}
                                >
                                    Settings
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {/* Empty State / Create New Placeholder if empty */}
                {boards.length === 0 && !loading && (
                    <div
                        style={{
                            gridColumn: '1 / -1',
                            textAlign: 'center',
                            padding: '4rem',
                            border: '2px dashed var(--color-border)',
                            borderRadius: '12px',
                            opacity: 0.6
                        }}
                    >
                        <h3>No boards found</h3>
                        <p>Get started by creating your first team board.</p>
                        <button className="btn btn-primary" onClick={() => setIsCreateBoardOpen(true)}>Create Board</button>
                    </div>
                )}
            </div>

            {editingBoard && (
                <EditBoardModal
                    board={editingBoard}
                    onClose={() => setEditingBoard(null)}
                    onUpdate={handleUpdateBoard}
                />
            )}



            {isCreateBoardOpen && (
                <CreateBoardModal
                    onClose={() => setIsCreateBoardOpen(false)}
                    onSubmit={handleCreateBoard}
                />
            )}
        </div>
    );
}
