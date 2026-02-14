import React, { useState, useEffect } from 'react';
import '../styles/variables.css';

interface Board {
    id: string;
    name: string;
    description?: string;
    slug: string;
    color?: string;
}

interface User {
    id: string;
    name: string;
    email: string;
}

interface Team {
    id: string;
    name: string;
}

export function BoardManagement() {
    const [boards, setBoards] = useState<Board[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);

    // Create State
    const [newBoardName, setNewBoardName] = useState('');
    const [newBoardColor, setNewBoardColor] = useState('#3b82f6');
    const [columns, setColumns] = useState<string[]>(['To Do', 'In Progress', 'Done']);

    // Assign State
    const [selectedBoardId, setSelectedBoardId] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedTeamId, setSelectedTeamId] = useState('');

    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = () => {
        fetchBoards();
        fetchUsers();
        fetchTeams();
    };

    const fetchUsers = () => {
        fetch('http://localhost:3001/api/v1/users', {
            headers: { 'Authorization': 'Bearer mock-token' }
        })
            .then(res => res.json())
            .then(data => setUsers(Array.isArray(data) ? data : []))
            .catch(err => console.error(err));
    };

    const fetchTeams = () => {
        fetch('http://localhost:3001/api/v1/teams', {
            headers: { 'Authorization': 'Bearer mock-token' }
        })
            .then(res => res.json())
            .then(data => setTeams(Array.isArray(data) ? data : []))
            .catch(err => console.error(err));
    };

    const fetchBoards = () => {
        fetch('http://localhost:3001/api/v1/boards/mine', {
            headers: { 'Authorization': 'Bearer mock-token' }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setBoards(data);
            })
            .catch(err => console.error(err));
    };

    const addColumn = () => {
        setColumns([...columns, '']);
    };

    const removeColumn = (index: number) => {
        const newCols = [...columns];
        newCols.splice(index, 1);
        setColumns(newCols);
    };

    const updateColumn = (index: number, value: string) => {
        const newCols = [...columns];
        newCols[index] = value;
        setColumns(newCols);
    };

    const createBoard = async () => {
        if (!newBoardName.trim()) {
            setMessage({ text: 'Board name is required', type: 'error' });
            return;
        }

        try {
            const validColumns = columns.filter(c => c.trim() !== '');
            const res = await fetch('http://localhost:3001/api/v1/boards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-token'
                },
                body: JSON.stringify({
                    name: newBoardName,
                    color: newBoardColor,
                    columns: validColumns.length > 0 ? validColumns : undefined
                })
            });
            if (res.ok) {
                setMessage({ text: 'Board created successfully', type: 'success' });
                setNewBoardName('');
                setColumns(['To Do', 'In Progress', 'Done']);
                fetchBoards();
            } else {
                setMessage({ text: 'Failed to create board', type: 'error' });
            }
        } catch (e) {
            setMessage({ text: 'Error creating board', type: 'error' });
        }
    };

    const assignMember = async () => {
        if (!selectedBoardId || (!selectedUserId && !selectedTeamId)) return;

        try {
            let res;
            if (selectedUserId) {
                res = await fetch(`http://localhost:3001/api/v1/boards/${selectedBoardId}/members`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mock-token' },
                    body: JSON.stringify({ userId: selectedUserId, role: 'Member' })
                });
            } else if (selectedTeamId) {
                res = await fetch(`http://localhost:3001/api/v1/boards/${selectedBoardId}/teams`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mock-token' },
                    body: JSON.stringify({ teamId: selectedTeamId, role: 'Member' })
                });
            }

            if (res && res.ok) {
                setMessage({ text: 'Assignment successful', type: 'success' });
                setSelectedUserId('');
                setSelectedTeamId('');
            } else {
                setMessage({ text: 'Failed to assign', type: 'error' });
            }
        } catch (e) {
            setMessage({ text: 'Error assigning', type: 'error' });
        }
    };

    // Styles
    const cardStyle: React.CSSProperties = {
        background: 'var(--color-bg-surface)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        padding: '2rem',
        boxShadow: 'var(--shadow-md)',
        color: 'var(--color-text-main)',
        transition: 'all 0.2s ease',
        height: '100%'
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.75rem 1rem',
        background: 'var(--color-bg-app)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        color: 'var(--color-text-main)',
        outline: 'none',
        fontSize: '0.95rem',
        transition: 'all 0.2s'
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--color-text-secondary)',
        marginBottom: '0.5rem',
        fontWeight: 600
    };

    const primaryBtnStyle: React.CSSProperties = {
        background: 'var(--color-primary)',
        color: 'white',
        border: 'none',
        padding: '0.75rem 1.5rem',
        borderRadius: '8px',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.1s',
        fontSize: '0.95rem'
    };

    const secondaryBtnStyle: React.CSSProperties = {
        background: 'transparent',
        color: 'var(--color-text-secondary)',
        border: '1px dashed var(--color-border)',
        padding: '0.75rem 1.5rem',
        borderRadius: '8px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 0.2s',
        fontSize: '0.95rem'
    };

    return (
        <div style={{ padding: '2rem', width: '100%', color: 'var(--color-text-main)' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0, color: 'var(--color-text-main)' }}>
                    Board Management
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem', fontSize: '1.1rem' }}>Overview and control of all workspace boards.</p>
            </div>

            {message && (
                <div style={{
                    padding: '1rem',
                    marginBottom: '2rem',
                    borderRadius: '8px',
                    background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`,
                    color: message.type === 'success' ? '#15803d' : '#b91c1c'
                }}>
                    {message.text}
                </div>
            )}

            {/* Main Grid: All Full Width */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

                {/* 1. All Boards Section */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Active Boards</h2>
                        <span style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem' }}>{boards.length} Boards</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {boards.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', border: '2px dashed var(--color-border)', borderRadius: '12px', color: 'var(--color-text-secondary)' }}>
                                No boards found. Create a new one below.
                            </div>
                        ) : (
                            boards.map(board => (
                                <div key={board.id} style={{
                                    ...cardStyle,
                                    padding: '1.5rem',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    borderLeft: `4px solid ${board.color || '#3b82f6'}`
                                }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                    }}
                                >
                                    <div style={{ marginBottom: '1rem' }}>
                                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{board.name}</h3>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            /{board.slug}
                                        </div>
                                    </div>
                                    {board.description && (
                                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>{board.description}</p>
                                    )}
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'var(--color-bg-app)', borderRadius: '4px', color: 'var(--color-text-secondary)' }}>
                                            ID: {board.id.substring(0, 8)}...
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <div style={{ width: '100%', height: '1px', background: 'var(--color-border)' }} />

                {/* 2. Management Panels Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>

                    {/* Create Board Panel */}
                    <div style={cardStyle}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%' }}></span>
                            Create New Board
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={labelStyle}>Board Name</label>
                                <input
                                    type="text"
                                    value={newBoardName}
                                    onChange={e => setNewBoardName(e.target.value)}
                                    placeholder="e.g. Engineering Team"
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Board Color</label>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    {colors.map(c => (
                                        <div
                                            key={c}
                                            onClick={() => setNewBoardColor(c)}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                backgroundColor: c,
                                                cursor: 'pointer',
                                                border: newBoardColor === c ? '2px solid var(--color-text-main)' : '2px solid transparent',
                                                boxShadow: newBoardColor === c ? '0 0 0 2px var(--color-bg-surface)' : 'none',
                                                transition: 'all 0.2s'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Default Columns</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'var(--color-bg-app)', borderRadius: '8px' }}>
                                    {columns.map((col, index) => (
                                        <div key={index} style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                type="text"
                                                value={col}
                                                onChange={(e) => updateColumn(index, e.target.value)}
                                                placeholder={`Column ${index + 1}`}
                                                style={{ ...inputStyle, padding: '0.5rem', background: 'var(--color-bg-surface)' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeColumn(index)}
                                                style={{ padding: '0.5rem', border: 'none', background: 'transparent', color: 'var(--color-danger, #ef4444)', cursor: 'pointer', borderRadius: '6px' }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addColumn}
                                        style={{ ...secondaryBtnStyle, width: '100%', borderStyle: 'dashed', marginTop: '0.5rem', background: 'var(--color-bg-surface)' }}
                                    >
                                        + Add Column
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button style={primaryBtnStyle} onClick={createBoard}>
                                    Create Board
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Assign Members Panel */}
                    <div style={cardStyle}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ width: '8px', height: '8px', background: '#ec4899', borderRadius: '50%' }}></span>
                            Assign Access
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={labelStyle}>1. Select Board</label>
                                <select
                                    value={selectedBoardId}
                                    onChange={e => setSelectedBoardId(e.target.value)}
                                    style={inputStyle}
                                >
                                    <option value="">Select a board...</option>
                                    {boards.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ padding: '1.5rem', background: 'var(--color-bg-app)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                                <label style={labelStyle}>2. Select Target</label>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Individual User</label>
                                    <select
                                        value={selectedUserId}
                                        onChange={e => { setSelectedUserId(e.target.value); setSelectedTeamId(''); }}
                                        style={{ ...inputStyle, opacity: selectedTeamId ? 0.5 : 1, background: 'var(--color-bg-surface)' }}
                                        disabled={!!selectedTeamId}
                                    >
                                        <option value="">Choose user...</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ textAlign: 'center', margin: '0.5rem 0', color: 'var(--color-text-secondary)', fontSize: '0.8rem', position: 'relative' }}>
                                    <span style={{ background: 'var(--color-bg-app)', padding: '0 0.5rem', zIndex: 1, position: 'relative' }}>OR</span>
                                    <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '1px', background: 'var(--color-border)' }}></div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Entire Team</label>
                                    <select
                                        value={selectedTeamId}
                                        onChange={e => { setSelectedTeamId(e.target.value); setSelectedUserId(''); }}
                                        style={{ ...inputStyle, opacity: selectedUserId ? 0.5 : 1, background: 'var(--color-bg-surface)' }}
                                        disabled={!!selectedUserId}
                                    >
                                        <option value="">Choose team...</option>
                                        {teams.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    style={{
                                        ...primaryBtnStyle,
                                        opacity: (!selectedBoardId || (!selectedUserId && !selectedTeamId)) ? 0.5 : 1,
                                        cursor: (!selectedBoardId || (!selectedUserId && !selectedTeamId)) ? 'not-allowed' : 'pointer',
                                        background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                                        boxShadow: '0 4px 6px -1px rgba(236, 72, 153, 0.3)'
                                    }}
                                    onClick={assignMember}
                                    disabled={!selectedBoardId || (!selectedUserId && !selectedTeamId)}
                                >
                                    Assign Access
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
