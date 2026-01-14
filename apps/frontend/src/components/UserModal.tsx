import React, { useState, useEffect } from 'react';
import '../styles/kanban.css';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    user?: any; // If provided, we are in Edit mode
    users?: any[]; // List of potential managers
    currentUserRole?: string;
}

export function UserModal({ isOpen, onClose, onSubmit, user, users = [], currentUserRole }: UserModalProps) {
    const isEditMode = !!user;
    const [allTeams, setAllTeams] = useState<any[]>([]);
    const [userTeams, setUserTeams] = useState<any[]>([]);
    const [selectedTeamToAdd, setSelectedTeamToAdd] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'User',
        managerId: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            // Populate form for edit
            setFormData({
                name: user.name || '',
                email: user.email || '',
                password: '', // Don't prefill password
                role: user.roles && user.roles.length > 0 ? user.roles[0] : 'User',
                managerId: user.manager ? user.manager.id : ''
            });
            setUserTeams(user.teams?.map((tm: any) => tm.team) || []);
        } else {
            // Reset for create
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'User',
                managerId: ''
            });
            setUserTeams([]);
        }
    }, [user, isOpen]);

    useEffect(() => {
        if (isOpen) {
            fetch('http://localhost:3001/api/v1/teams', {
                headers: { 'Authorization': 'Bearer mock-token' }
            })
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setAllTeams(data);
                })
                .catch(console.error);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Operation failed');
        } finally {
            setLoading(false);
        }
    };

    // Filter out self from manager list if editing
    const potentialManagers = users.filter(u => !user || u.id !== user.id);

    const handleAddTeam = async () => {
        if (!selectedTeamToAdd || !user) return;
        try {
            console.log(`Adding user ${user.id} to team ${selectedTeamToAdd}`);
            const res = await fetch(`http://localhost:3001/api/v1/teams/${selectedTeamToAdd}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mock-token' },
                body: JSON.stringify({ userId: user.id })
            });
            if (res.ok) {
                const team = allTeams.find(t => t.id === selectedTeamToAdd);
                if (team) setUserTeams([...userTeams, team]);
                setSelectedTeamToAdd('');
            } else {
                const errorData = await res.json().catch(() => ({ error: res.statusText }));
                console.error('Failed response:', errorData);
                alert(`Failed to add team: ${errorData.error || 'Unknown error'}`);
            }
        } catch (e: any) {
            console.error(e);
            alert(`Error adding team: ${e.message}`);
        }
    };

    const handleRemoveTeam = async (teamId: string) => {
        if (!user) return;
        if (!confirm('Remove user from this team?')) return;
        try {
            console.log(`Removing user ${user.id} from team ${teamId}`);
            const res = await fetch(`http://localhost:3001/api/v1/teams/${teamId}/members/${user.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer mock-token' }
            });
            if (res.ok) {
                setUserTeams(userTeams.filter(t => t.id !== teamId));
            } else {
                const errorData = await res.json().catch(() => ({ error: res.statusText }));
                console.error('Failed response:', errorData);
                alert(`Failed to remove team: ${errorData.error || 'Unknown error'}`);
            }
        } catch (e: any) {
            console.error(e);
            alert(`Error removing team: ${e.message}`);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ width: '500px' }}>
                <button className="modal-close-btn" onClick={onClose}>×</button>
                <div className="modal-header">
                    <h2 className="modal-title">{isEditMode ? 'Edit User' : 'Create New User'}</h2>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="modal-form-group">
                        <label className="modal-label">Full Name</label>
                        <input
                            className="modal-input"
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Jesse Pinkman"
                        />
                    </div>

                    <div className="modal-form-group">
                        <label className="modal-label">Email Address</label>
                        <input
                            className="modal-input"
                            type="email"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="e.g. jesse@example.com"
                        />
                    </div>

                    <div className="modal-form-group">
                        <label className="modal-label">
                            {isEditMode ? 'New Password (leave blank to keep)' : 'Initial Password'}
                        </label>
                        <input
                            className="modal-input"
                            type="password"
                            required={!isEditMode}
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            placeholder={isEditMode ? "••••••••" : "Required"}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="modal-form-group">
                            <label className="modal-label">Role</label>
                            <select
                                className="modal-select"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="User">User</option>
                                <option value="Admin">Admin</option>
                                <option value="SuperUser">SuperUser</option>
                            </select>
                        </div>

                        <div className="modal-form-group">
                            <label className="modal-label">Manager</label>
                            <select
                                className="modal-select"
                                value={formData.managerId}
                                onChange={e => setFormData({ ...formData, managerId: e.target.value })}
                            >
                                <option value="">No Manager</option>
                                {potentialManagers.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {isEditMode && (
                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                            <label className="modal-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Team Assignments</label>

                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                <select
                                    className="modal-select"
                                    value={selectedTeamToAdd}
                                    onChange={e => setSelectedTeamToAdd(e.target.value)}
                                >
                                    <option value="">Select Team to Assign...</option>
                                    {allTeams
                                        .filter(t => !userTeams.find(ut => ut.id === t.id))
                                        .map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                </select>
                                <button type="button" className="btn btn-primary" onClick={handleAddTeam} disabled={!selectedTeamToAdd}>Assign</button>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {userTeams.map(team => (
                                    <div key={team.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '4px 8px',
                                        background: '#eff6ff',
                                        border: '1px solid #dbeafe',
                                        borderRadius: '4px',
                                        fontSize: '0.875rem',
                                        color: '#1e40af'
                                    }}>
                                        <span>{team.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTeam(team.id)}
                                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', padding: 0, fontWeight: 'bold' }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {userTeams.length === 0 && <span style={{ color: '#6b7280', fontSize: '0.875rem', fontStyle: 'italic' }}>No teams assigned.</span>}
                            </div>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn"
                            style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : (isEditMode ? 'Update User' : 'Create User')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
