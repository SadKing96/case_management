import React, { useState, useEffect } from 'react';
import '../styles/variables.css';

interface Board {
    id: string;
    name: string;
    slug: string;
}

interface User {
    id: string;
    name: string;
    email: string;
}

export function BoardManagement() {
    const [boards, setBoards] = useState<Board[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [newBoardName, setNewBoardName] = useState('');
    const [selectedBoardId, setSelectedBoardId] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [message, setMessage] = useState('');
    const [columns, setColumns] = useState<string[]>(['To Do', 'In Progress', 'Done']);

    useEffect(() => {
        fetchBoards();
        fetchUsers();
        fetchTeams();
    }, []);

    const fetchUsers = () => {
        fetch('http://localhost:3001/api/v1/users', {
            headers: { 'Authorization': 'Bearer mock-token' }
        })
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(err => console.error(err));
    };

    const fetchTeams = () => {
        fetch('http://localhost:3001/api/v1/teams', {
            headers: { 'Authorization': 'Bearer mock-token' }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setTeams(data);
                else setTeams([]);
            })
            .catch(err => {
                console.error(err);
                setTeams([]);
            });
    };

    const fetchBoards = () => {
        // Fetch all boards for admin/superuser ideally, but 'mine' works if superuser owns them or we update API to list all
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
                    columns: validColumns.length > 0 ? validColumns : undefined
                })
            });
            if (res.ok) {
                setMessage('Board created successfully');
                setNewBoardName('');
                setColumns(['To Do', 'In Progress', 'Done']);
                fetchBoards();
            } else {
                setMessage('Failed to create board');
            }
        } catch (e) {
            setMessage('Error creating board');
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
                setMessage('Assignment successful');
                setSelectedUserId('');
                setSelectedTeamId('');
            } else {
                setMessage('Failed to assign');
            }
        } catch (e) {
            setMessage('Error assigning');
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <h2>Board Management</h2>
            {message && <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.1)', margin: '1rem 0', borderRadius: '4px' }}>{message}</div>}

            <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* Create Board */}
                <div style={{ padding: '1.5rem', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <h3>Create Board</h3>
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={newBoardName}
                                onChange={e => setNewBoardName(e.target.value)}
                                placeholder="Board Name"
                                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                            />
                            <button className="btn btn-primary" onClick={createBoard}>Create</button>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Columns (optional)</label>
                            {columns.map((col, index) => (
                                <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={col}
                                        onChange={(e) => updateColumn(index, e.target.value)}
                                        placeholder={`Column ${index + 1}`}
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeColumn(index)}
                                        style={{ padding: '0.5rem', border: 'none', background: 'transparent', color: 'var(--color-error)', cursor: 'pointer' }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addColumn}
                                style={{ fontSize: '0.9rem', color: 'var(--color-primary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                                + Add Column
                            </button>
                        </div>
                    </div>
                </div>

                {/* Assign to Board */}
                <div style={{ padding: '1.5rem', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <h3>Assign to Board</h3>
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <select
                            value={selectedBoardId}
                            onChange={e => setSelectedBoardId(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '4px' }}
                        >
                            <option value="">Select Board</option>
                            {boards.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <select
                                    value={selectedUserId}
                                    onChange={e => { setSelectedUserId(e.target.value); setSelectedTeamId(''); }}
                                    style={{ padding: '0.5rem', borderRadius: '4px', width: '100%' }}
                                    disabled={!!selectedTeamId}
                                >
                                    <option value="">Select User (Individual)</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                    ))}
                                </select>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#888' }}>OR</span>
                            <div style={{ flex: 1 }}>
                                <select
                                    value={selectedTeamId}
                                    onChange={e => { setSelectedTeamId(e.target.value); setSelectedUserId(''); }}
                                    style={{ padding: '0.5rem', borderRadius: '4px', width: '100%' }}
                                    disabled={!!selectedUserId}
                                >
                                    <option value="">Select Team (Group)</option>
                                    {teams.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button className="btn btn-secondary" onClick={assignMember} disabled={!selectedBoardId || (!selectedUserId && !selectedTeamId)}>Assign</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
