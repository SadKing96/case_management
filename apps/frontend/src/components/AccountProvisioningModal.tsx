
import React, { useState } from 'react';
import '../styles/kanban.css';

interface AccountProvisioningModalProps {
    onClose: () => void;
    onSuccess?: () => void;
}

export function AccountProvisioningModal({ onClose, onSuccess }: AccountProvisioningModalProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [baseRole, setBaseRole] = useState('User');
    const [modules, setModules] = useState({
        boards: true,
        gartica: false,
        customer: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Construct roles string
        const rolesList = [baseRole];
        if (modules.boards) rolesList.push('Module:Boards');
        if (modules.gartica) rolesList.push('Module:Gartica');
        if (modules.customer) rolesList.push('Module:Customer');

        // Join with commas for the backend
        const roles = rolesList.join(',');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    email,
                    password, // Send password even if backend mock might ignore it currently
                    role: roles
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to create user');
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Styles matching CreateBoardModal
    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.75rem 1rem',
        background: 'rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        color: '#fff',
        outline: 'none',
        fontSize: '0.95rem',
        marginTop: '0.5rem'
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.02em', display: 'block', marginBottom: '0.2rem', marginTop: '1rem'
    };

    const btnPrimaryStyle: React.CSSProperties = {
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        color: 'white',
        border: 'none',
        padding: '0.75rem 1.5rem',
        borderRadius: '8px',
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
        fontSize: '0.95rem'
    };

    const checkboxStyle: React.CSSProperties = {
        marginRight: '0.75rem',
        accentColor: '#3b82f6',
        width: '18px',
        height: '18px'
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{
                width: '500px',
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
                color: '#fff'
            }}>
                <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', margin: 0 }}>Provision New Account</h2>
                    <button
                        className="close-btn"
                        onClick={onClose}
                        style={{ color: '#94a3b8', fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        &times;
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ padding: '2rem' }}>
                        {error && <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{error}</div>}

                        <div style={{}}>
                            <label style={{ ...labelStyle, marginTop: 0 }}>FULL NAME</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. John Doe"
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>EMAIL ADDRESS</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="john@company.com"
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>INITIAL PASSWORD</label>
                            <input
                                type="text"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Set initial password..."
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>PRIMARY ROLE</label>
                            <select
                                value={baseRole}
                                onChange={e => setBaseRole(e.target.value)}
                                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                            >
                                <option value="User" style={{ color: '#000' }}>User</option>
                                <option value="Client" style={{ color: '#000' }}>Client</option>
                                <option value="Manager" style={{ color: '#000' }}>Manager</option>
                                <option value="Admin" style={{ color: '#000' }}>Admin</option>
                            </select>
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                            <label style={labelStyle}>MODULE ASSIGNMENT</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={modules.boards}
                                        onChange={e => setModules({ ...modules, boards: e.target.checked })}
                                        style={checkboxStyle}
                                    />
                                    <span>Boards Module</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={modules.gartica}
                                        onChange={e => setModules({ ...modules, gartica: e.target.checked })}
                                        style={checkboxStyle}
                                    />
                                    <span>Gartica Intelligence</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={modules.customer}
                                        onChange={e => setModules({ ...modules, customer: e.target.checked })}
                                        style={checkboxStyle}
                                    />
                                    <span>Customer Portal</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="modal-actions" style={{
                        padding: '1.5rem 2rem',
                        marginTop: 0,
                        background: 'rgba(0,0,0,0.2)',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '1rem'
                    }}>
                        <button type="button" onClick={onClose} style={{
                            background: 'transparent',
                            color: '#94a3b8',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontSize: '0.95rem'
                        }}>Cancel</button>
                        <button type="submit" style={btnPrimaryStyle} disabled={loading}>
                            {loading ? 'Creating...' : 'Provision Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
