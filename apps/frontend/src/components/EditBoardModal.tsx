import React, { useState, useEffect } from 'react';
import '../styles/kanban.css';

interface EditBoardModalProps {
    board: any;
    onClose: () => void;
    onUpdate: (data: any) => Promise<void>;
}

export function EditBoardModal({ board, onClose, onUpdate }: EditBoardModalProps) {
    const [formData, setFormData] = useState({
        name: board.name,
        description: board.description || '',
        color: board.color || '#3b82f6'
    });

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<any[]>([]); // Current members
    const [allUsers, setAllUsers] = useState<any[]>([]); // For adding new members
    const [selectedUserId, setSelectedUserId] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    const handleDeleteBoard = async () => {
        if (deleteConfirmation !== board.name) return;

        try {
            const res = await fetch(`http://localhost:3001/api/v1/boards/${board.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer mock-token' }
            });

            if (res.ok) {
                // Redirect to main boards list
                window.location.href = '/boards';
            } else {
                alert('Failed to delete board');
            }
        } catch (e) {
            console.error(e);
            alert('Error deleting board');
        }
    };

    useEffect(() => {
        // Fetch board members? Or assume managing members is a separate heavy lift?
        // Ideally we fetch current members of this board.
        // For now, let's just allow editing the META details as per main request.
        // Adding members logic:
        fetchUsers();
        fetchMembers();
    }, [board.id]);

    const fetchUsers = () => {
        fetch('http://localhost:3001/api/v1/users', {
            headers: { 'Authorization': 'Bearer mock-token' }
        })
            .then(res => res.json())
            .then(setAllUsers)
            .catch(console.error);
    };

    const fetchMembers = () => {
        fetch(`http://localhost:3001/api/v1/boards/${board.id}/members`, {
            headers: { 'Authorization': 'Bearer mock-token' }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setMembers(data);
            })
            .catch(console.error);
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            await fetch(`http://localhost:3001/api/v1/boards/${board.id}/members/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer mock-token' }
            });
            fetchMembers(); // Refresh list
        } catch (e) {
            console.error(e);
            alert('Failed to remove member');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onUpdate(formData);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to update board');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async () => {
        if (!selectedUserId) return;
        try {
            await fetch(`http://localhost:3001/api/v1/boards/${board.id}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-token'
                },
                body: JSON.stringify({ userId: selectedUserId, role: 'Member' })
            });
            alert('Member added!');
            setSelectedUserId('');
            fetchMembers(); // refresh members
        } catch (e) {
            console.error(e);
            alert('Failed to add member');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ width: '500px', position: 'relative' }}>
                <button className="modal-close-btn" onClick={onClose}>×</button>
                <div className="modal-header">
                    <h2 className="modal-title">Edit Team / Board</h2>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                            Board Name
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.875rem',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.875rem',
                                outline: 'none',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                            Color
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {colors.map(c => (
                                <div
                                    key={c}
                                    onClick={() => setFormData({ ...formData, color: c })}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        backgroundColor: c,
                                        cursor: 'pointer',
                                        border: formData.color === c ? '2px solid var(--color-text-main)' : '2px solid transparent',
                                        boxShadow: formData.color === c ? '0 0 0 2px var(--color-bg-surface)' : 'none'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', marginBottom: '2rem' }}>
                        <button
                            type="button"
                            className="btn"
                            onClick={onClose}
                            style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>

                <hr style={{ margin: '1.5rem 0', opacity: 0.1, borderBottom: '1px solid var(--color-border)' }} />

                <div style={{
                    backgroundColor: 'var(--color-bg-app)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    border: '1px solid var(--color-border)'
                }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', marginTop: 0 }}>Manage Members</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <select
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.875rem',
                                outline: 'none',
                                backgroundColor: '#fff'
                            }}
                            value={selectedUserId}
                            onChange={e => setSelectedUserId(e.target.value)}
                        >
                            <option value="">Select User to Add...</option>
                            {allUsers.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleAddMember}
                            style={{
                                height: 'auto',
                                padding: '0 1rem'
                            }}
                        >
                            Add
                        </button>
                    </div>

                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {members.length === 0 ? (
                            <p style={{ opacity: 0.6, fontSize: '0.9rem', fontStyle: 'italic', margin: 0 }}>No members yet.</p>
                        ) : (
                            members.map(m => (
                                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                                    <div>
                                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{m.user?.name || 'Unknown User'}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{m.user?.email}</div>
                                    </div>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                        onClick={() => handleRemoveMember(m.userId)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                    <button
                        type="button"
                        className="btn"
                        onClick={() => setDeleteConfirm(true)}
                        style={{
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            width: '100%',
                            padding: '0.75rem',
                            fontWeight: 600
                        }}
                    >
                        Delete Board
                    </button>
                </div>

                {deleteConfirm && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: 'var(--radius-md)',
                        zIndex: 10,
                        padding: '2rem'
                    }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#b91c1c' }}>Danger Zone</h3>
                        <p style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '1.5rem', textAlign: 'center' }}>
                            Type <strong>{board.name}</strong> to delete this board.<br />This action cannot be undone.
                        </p>
                        <input
                            type="text"
                            placeholder={board.name}
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.875rem',
                                marginBottom: '1rem'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                            <button
                                onClick={() => setDeleteConfirm(false)}
                                className="btn"
                                style={{ flex: 1, backgroundColor: '#e5e7eb', color: '#374151', border: 'none' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteBoard}
                                disabled={deleteConfirmation !== board.name}
                                className="btn"
                                style={{
                                    flex: 1,
                                    backgroundColor: deleteConfirmation === board.name ? '#ef4444' : '#fee2e2',
                                    color: deleteConfirmation === board.name ? '#fff' : '#ef4444',
                                    border: 'none',
                                    cursor: deleteConfirmation === board.name ? 'pointer' : 'not-allowed'
                                }}
                            >
                                Delete Board
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
