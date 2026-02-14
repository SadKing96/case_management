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

    // Copied from Sidebar.tsx for consistency
    const garticaModules: Record<string, { icon: string; label: string }> = {
        'golden-thread': { icon: '🧵', label: 'Golden Thread' },
        'operations': { icon: '⚙️', label: 'Operations' },
        'aftermarket': { icon: '🔄', label: 'Aftermarket' },
        'erp': { icon: '🏢', label: 'ERP Connect' },
        'performance': { icon: '📊', label: 'Performance Monitor' },
        'daily-activity': { icon: '📅', label: 'Daily Activity' },
        'capacity': { icon: '📉', label: 'Capacity Planning' },
        'compliance': { icon: '🛡️', label: 'Compliance Sentinel' },
        'knowledge': { icon: '🔮', label: 'Knowledge Nexus' },
        'process-mining': { icon: '⛓️', label: 'Process Mining' },
        'customer-360': { icon: '🎯', label: 'Customer 360' }
    };

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'User',
        managerId: '',
        modules: {
            boards: false, // Legacy
            gartica: false, // Legacy
            customer: false, // Legacy
            // Dynamic keys will be added here
        } as Record<string, boolean>
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            // Populate form for edit
            const currentRoles = user.roles || [];
            // Determine base role (exclude Module:*)
            const baseRole = currentRoles.find((r: string) => !r.startsWith('Module:')) || 'User';

            // Build modules state
            const modulesState: Record<string, boolean> = {
                boards: currentRoles.includes('Module:Boards'),
                gartica: currentRoles.includes('Module:Gartica'),
                customer: currentRoles.includes('Module:Customer'),
            };

            // Populate granular Gartica modules
            Object.keys(garticaModules).forEach(key => {
                const pascalKey = key.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
                modulesState[key] = currentRoles.includes(`Module:${pascalKey}`);
            });

            setFormData({
                name: user.name || '',
                email: user.email || '',
                password: '', // Don't prefill password
                role: baseRole,
                managerId: user.manager ? user.manager.id : '',
                modules: modulesState
            });
            setUserTeams(user.teams?.map((tm: any) => tm.team) || []);
        } else {
            // Reset for create
            // Default only Golden Thread? Or nothing.
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'User',
                managerId: '',
                modules: {
                    boards: false,
                    gartica: false,
                    customer: false,
                    'golden-thread': true // Default helpful
                }
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
            // Construct roles array
            const roles = [formData.role];

            // Legacy modules
            if (formData.modules.boards) roles.push('Module:Boards');
            if (formData.modules.gartica) roles.push('Module:Gartica');
            if (formData.modules.customer) roles.push('Module:Customer');

            // Granular Gartica modules
            Object.keys(garticaModules).forEach(key => {
                if (formData.modules[key]) {
                    const pascalKey = key.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
                    roles.push(`Module:${pascalKey}`);
                }
            });

            // Send combined data. property name depends on backend expectation. 
            // In UsersList.tsx handleSaveUser calls createUser/updateUser.
            // AccountProvisioningModal sends `role: roles.join(',')`. matches that.

            const submitData = {
                ...formData,
                role: roles.join(',')
            };

            await onSubmit(submitData);
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
        <div className="modal-overlay" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="modal-content" style={{ width: '800px', maxWidth: '95vw', padding: '0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                <div className="modal-header" style={{
                    padding: '24px 32px',
                    borderBottom: '1px solid #e5e7eb',
                    background: '#f9fafb'
                }}>
                    <div>
                        <h2 className="modal-title" style={{ fontSize: '1.5rem', color: '#111827', marginBottom: '4px' }}>
                            {isEditMode ? 'Edit User' : 'Create New User'}
                        </h2>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                            {isEditMode ? 'Manage user details, role assignment, and granular permissions.' : 'Add a new user to the system and configure their access.'}
                        </p>
                    </div>
                    <button className="modal-close-btn" onClick={onClose} style={{ fontSize: '2rem', color: '#9ca3af', fontWeight: 300 }}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body" style={{ padding: '32px', maxHeight: '70vh', overflowY: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                        <div className="modal-form-group">
                            <label className="modal-label" style={{ marginBottom: '8px', display: 'block', color: '#374151', fontWeight: 600 }}>Full Name</label>
                            <input
                                className="modal-input"
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Jesse Pinkman"
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '0.95rem'
                                }}
                            />
                        </div>

                        <div className="modal-form-group">
                            <label className="modal-label" style={{ marginBottom: '8px', display: 'block', color: '#374151', fontWeight: 600 }}>Email Address</label>
                            <input
                                className="modal-input"
                                type="email"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="e.g. jesse@example.com"
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '0.95rem'
                                }}
                            />
                        </div>

                        <div className="modal-form-group">
                            <label className="modal-label" style={{ marginBottom: '8px', display: 'block', color: '#374151', fontWeight: 600 }}>Role</label>
                            <select
                                className="modal-select"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '0.95rem',
                                    backgroundColor: '#fff'
                                }}
                            >
                                <option value="User">User</option>
                                <option value="Manager">Manager</option>
                                <option value="Admin">Admin</option>
                                <option value="SuperUser">SuperUser</option>
                            </select>
                        </div>

                        <div className="modal-form-group">
                            <label className="modal-label" style={{ marginBottom: '8px', display: 'block', color: '#374151', fontWeight: 600 }}>
                                {isEditMode ? 'New Password' : 'Initial Password'}
                                <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: '4px' }}>
                                    {isEditMode ? '(leave blank to keep)' : ''}
                                </span>
                            </label>
                            <input
                                className="modal-input"
                                type="password"
                                required={!isEditMode}
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                placeholder={isEditMode ? "••••••••" : "Required"}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '0.95rem'
                                }}
                            />
                        </div>
                    </div>

                    <div className="modal-form-group" style={{ marginBottom: '24px' }}>
                        <label className="modal-label" style={{ marginBottom: '8px', display: 'block', color: '#374151', fontWeight: 600 }}>Manager</label>
                        <select
                            className="modal-select"
                            value={formData.managerId}
                            onChange={e => setFormData({ ...formData, managerId: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: '1px solid #d1d5db',
                                fontSize: '0.95rem',
                                backgroundColor: '#fff'
                            }}
                        >
                            <option value="">No Manager</option>
                            {potentialManagers.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="modal-form-group" style={{ marginTop: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <label className="modal-label" style={{ fontSize: '1.1rem', color: '#111827', fontWeight: 700 }}>Gartica Modules Access</label>
                            {(formData.role === 'SuperUser' || formData.role === 'Admin') && (
                                <span style={{ fontSize: '0.85rem', color: '#059669', background: '#d1fae5', padding: '4px 12px', borderRadius: '99px', fontWeight: 500 }}>
                                    ✓ Full Access Granted via Role
                                </span>
                            )}
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                            gap: '12px',
                            padding: '4px'
                        }}>
                            {Object.entries(garticaModules).map(([key, module]) => {
                                const pascalKey = key.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
                                const isChecked = formData.role === 'SuperUser' || formData.role === 'Admin'
                                    ? true
                                    : (formData.modules as any)[key] === true;

                                const isDisabled = formData.role === 'SuperUser' || formData.role === 'Admin';

                                return (
                                    <label key={key} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: isDisabled ? 'default' : 'pointer',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        border: isChecked ? '2px solid #6366f1' : '1px solid #e5e7eb',
                                        background: isChecked ? '#eef2ff' : '#fff',
                                        opacity: isDisabled ? 0.8 : 1,
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: isChecked ? '0 4px 6px -1px rgba(79, 70, 229, 0.1)' : 'none',
                                    }}
                                        onMouseEnter={e => !isDisabled && (e.currentTarget.style.transform = 'translateY(-2px)')}
                                        onMouseLeave={e => !isDisabled && (e.currentTarget.style.transform = 'translateY(0)')}
                                    >
                                        <input
                                            type="checkbox"
                                            disabled={isDisabled}
                                            checked={isChecked}
                                            onChange={e => setFormData({
                                                ...formData,
                                                modules: { ...formData.modules, [key]: e.target.checked }
                                            })}
                                            style={{ accentColor: '#4f46e5', width: '18px', height: '18px' }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{module.icon}</span>
                                        </div>
                                        <span style={{ fontSize: '0.95rem', fontWeight: isChecked ? 600 : 500, color: isChecked ? '#312e81' : '#374151' }}>
                                            {module.label}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {isEditMode && (
                        <div style={{ marginTop: '32px', borderTop: '1px solid #f3f4f6', paddingTop: '24px' }}>
                            <label className="modal-label" style={{ marginBottom: '16px', display: 'block', fontWeight: 600, color: '#374151' }}>Team Assignments</label>

                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                <select
                                    className="modal-select"
                                    value={selectedTeamToAdd}
                                    onChange={e => setSelectedTeamToAdd(e.target.value)}
                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                                >
                                    <option value="">Select Team to Assign...</option>
                                    {allTeams
                                        .filter(t => !userTeams.find(ut => ut.id === t.id))
                                        .map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                </select>
                                <button type="button" className="btn btn-primary" onClick={handleAddTeam} disabled={!selectedTeamToAdd} style={{ borderRadius: '8px', padding: '0 24px' }}>
                                    Assign
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {userTeams.map(team => (
                                    <div key={team.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '6px 12px',
                                        background: '#f0f9ff',
                                        border: '1px solid #bae6fd',
                                        borderRadius: '99px',
                                        fontSize: '0.9rem',
                                        color: '#0284c7',
                                        fontWeight: 500
                                    }}>
                                        <span>{team.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTeam(team.id)}
                                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#0ea5e9', padding: 0, fontSize: '1.2rem', lineHeight: 0.5, marginLeft: '4px' }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {userTeams.length === 0 && <span style={{ color: '#9ca3af', fontSize: '0.9rem', fontStyle: 'italic' }}>No teams assigned.</span>}
                            </div>
                        </div>
                    )}
                </form>

                <div className="modal-footer" style={{ padding: '24px 32px', background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                    <button
                        type="button"
                        className="btn"
                        style={{
                            background: '#fff',
                            border: '1px solid #d1d5db',
                            color: '#374151',
                            padding: '10px 24px',
                            borderRadius: '8px',
                            fontWeight: 500
                        }}
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="btn btn-primary"
                        disabled={loading}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '8px',
                            fontWeight: 600,
                            boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
                        }}
                    >
                        {loading ? 'Saving...' : (isEditMode ? 'Update User' : 'Create User')}
                    </button>
                </div>
            </div>
        </div>
    );
}
