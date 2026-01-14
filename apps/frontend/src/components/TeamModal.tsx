
import React, { useState, useEffect } from 'react';
import '../styles/variables.css';

interface User {
    id: string;
    name: string;
    email: string;
}

interface Team {
    id: string;
    name: string;
    description?: string;
    members?: { user: User }[];
}

interface TeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    team?: Team; // If provided, we are editing
    availableUsers: User[];
}

export function TeamModal({ isOpen, onClose, onSubmit, team, availableUsers }: TeamModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#3b82f6');

    // For managing members in Edit mode
    const [currentMembers, setCurrentMembers] = useState<User[]>([]);
    const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState('');

    useEffect(() => {
        if (team) {
            setName(team.name);
            setDescription(team.description || '');
            // @ts-ignore - team might not have color in type yet if frontend types outdated
            setColor(team.color || '#3b82f6');
            setCurrentMembers(team.members?.map(m => m.user) || []);
        } else {
            setName('');
            setDescription('');
            setColor('#3b82f6');
            setCurrentMembers([]);
        }
    }, [team, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // If creating (no team), pass selected members
        const payload = team ? { name, description, color } : { name, description, color, members: currentMembers.map(u => u.id) };
        await onSubmit(payload);
        if (!team) onClose(); // Only close on create, keep open on edit? or caller handles
    };

    const handleAddMember = async () => {
        if (!selectedUserIdToAdd) return;

        // If we are editing an existing team, sync with backend immediately
        if (team) {
            try {
                await fetch(`http://localhost:3001/api/v1/teams/${team.id}/members`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer mock-token'
                    },
                    body: JSON.stringify({ userId: selectedUserIdToAdd })
                });
                // Update local state
                const user = availableUsers.find(u => u.id === selectedUserIdToAdd);
                if (user) {
                    setCurrentMembers([...currentMembers, user]);
                    setSelectedUserIdToAdd('');
                }
            } catch (e) {
                alert('Failed to add member');
            }
        } else {
            // Just local state for new team
            const user = availableUsers.find(u => u.id === selectedUserIdToAdd);
            if (user) {
                setCurrentMembers([...currentMembers, user]);
                setSelectedUserIdToAdd('');
            }
        }
    };

    const handleRemoveMember = async (userId: string) => {
        // If editing, sync with backend
        if (team) {
            if (!confirm('Remove user from team?')) return;
            try {
                await fetch(`http://localhost:3001/api/v1/teams/${team.id}/members/${userId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer mock-token' }
                });
                // Update local state
                setCurrentMembers(currentMembers.filter(u => u.id !== userId));
            } catch (e) {
                alert('Failed to remove member');
            }
        } else {
            // Local state only
            setCurrentMembers(currentMembers.filter(u => u.id !== userId));
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(2px)'
        }}>
            <div style={{
                backgroundColor: 'var(--color-bg-surface)',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{team ? 'Edit Team' : 'Create New Team'}</h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                    >
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--color-text-main)' }}>Team Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                fontSize: 'var(--text-base)'
                            }}
                            placeholder="e.g. Design Team"
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--color-text-main)' }}>Team Color</label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                                type="color"
                                value={color}
                                onChange={e => setColor(e.target.value)}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    padding: '2px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer'
                                }}
                            />
                            <input
                                type="text"
                                value={color}
                                onChange={e => setColor(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    fontSize: 'var(--text-base)'
                                }}
                                placeholder="#3b82f6"
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--color-text-main)' }}>Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                fontFamily: 'inherit',
                                fontSize: 'var(--text-base)'
                            }}
                            placeholder="Brief description of this team..."
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'white',
                                color: 'var(--color-text-main)',
                                fontWeight: 500
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                background: 'var(--color-primary)',
                                color: 'white',
                                fontWeight: 500
                            }}
                        >
                            {team ? 'Save Changes' : 'Create Team'}
                        </button>
                    </div>
                </form>

                <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-main)' }}>Team Members</h3>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: 'var(--color-bg-app)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                        <select
                            value={selectedUserIdToAdd}
                            onChange={e => setSelectedUserIdToAdd(e.target.value)}
                            style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                        >
                            <option value="">Select User to Add...</option>
                            {availableUsers
                                .filter(u => !currentMembers.find(m => m.id === u.id))
                                .map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                ))}
                        </select>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleAddMember}
                            disabled={!selectedUserIdToAdd}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: 'var(--radius-sm)',
                                opacity: !selectedUserIdToAdd ? 0.7 : 1
                            }}
                        >
                            Add Member
                        </button>
                    </div>

                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                        {currentMembers.length > 0 ? (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {currentMembers.map(user => (
                                    <li key={user.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', alignItems: 'center', backgroundColor: 'white' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span>{user.name}</span>
                                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>({user.email})</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveMember(user.id)}
                                            style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
                                        >
                                            Remove
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                                No members assigned to this team yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
