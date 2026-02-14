import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchUsers, UserWithDetails } from '../api/users';
import '../styles/variables.css';

export function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [isUserListOpen, setIsUserListOpen] = useState(false);
    const [users, setUsers] = useState<UserWithDetails[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const getRedirectPath = (role: string, user?: any) => {
        if (role === 'SuperUser') return '/superuser';
        if (role === 'Admin') return '/admin';

        // For standard Users, check module access
        const roles = user?.roles || [];
        // Handle both "Module:Boards" string array and object structure if present (backend sends strings)
        // Also check if roles is string[] or just string (legacy check)
        const roleList = Array.isArray(roles) ? roles : [roles];

        if (roleList.includes('Module:Boards')) return '/boards/default';
        if (roleList.some((r: string) => r.startsWith('Module:'))) return '/gartica'; // Any module access goes to Gartica
        if (roleList.includes('Module:Customer')) return '/customer/dashboard';

        // Fallback / default
        return '/gartica'; // Default to Gartica for POC instead of boards
    };

    const handleLogin = (role: 'SuperUser' | 'Admin' | 'User', specificUser?: any) => {
        login(role, specificUser);
        const redirectPath = getRedirectPath(role, specificUser);
        navigate(redirectPath);
    };

    const handleOpenUserList = async () => {
        setIsUserListOpen(true);
        setLoadingUsers(true);
        try {
            const data = await fetchUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleSelectUser = (user: UserWithDetails) => {
        // Determine primary role
        const primaryRole = (user.roles?.find((r: string) => !r.startsWith('Module:')) || 'User') as 'SuperUser' | 'Admin' | 'User';
        handleLogin(primaryRole, user);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-bg-app)',
            fontFamily: 'var(--font-family)'
        }}>
            <div style={{
                background: 'var(--color-bg-surface)',
                padding: '2.5rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                width: '100%',
                maxWidth: '400px',
                position: 'relative'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome Back</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Sign in to continue to CaseManager</p>
                </div>

                {/* SSO Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => navigate('/boards/default')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            padding: '0.625rem',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            background: '#fff',
                            color: 'var(--color-text-main)',
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#F25022" d="M8.1 8.1H1V1h7.1v7.1z" />
                            <path fill="#00A4EF" d="M17 8.1H9.9V1H17v7.1z" />
                            <path fill="#7FBA00" d="M8.1 17H1V9.9h7.1V17z" />
                            <path fill="#FFB900" d="M17 17H9.9V9.9H17V17z" />
                        </svg>
                        Sign in with Microsoft
                    </button>

                    <button
                        onClick={() => navigate('/boards/default')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            padding: '0.625rem',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            background: '#fff',
                            color: 'var(--color-text-main)',
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Sign in with Google
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}></div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}></div>
                </div>

                {/* Manual Login */}
                <form onSubmit={(e) => { e.preventDefault(); handleLogin('User'); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* ... keeping email input visual for now but disabling functionality ... */}
                    <div>
                        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                            (Dev Mode: Choose a Role to Login)
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <button type="button" onClick={() => handleLogin('SuperUser')} className="btn btn-primary" style={{ background: '#7c3aed' }}>Login as SuperUser</button>
                            <button type="button" onClick={() => handleLogin('Admin')} className="btn btn-primary" style={{ background: '#2563eb' }}>Login as Admin</button>
                            <button type="button" onClick={() => handleLogin('User')} className="btn btn-primary">Login as User (PM)</button>

                            <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.5rem 0' }}></div>

                            <button
                                type="button"
                                onClick={handleOpenUserList}
                                className="btn"
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--color-border)',
                                    color: 'var(--color-text-main)'
                                }}
                            >
                                Login as Existing User...
                            </button>
                        </div>
                    </div>
                </form>

                {/* User Selection Modal */}
                {isUserListOpen && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: 'var(--radius-lg)',
                        zIndex: 10,
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Select User</h3>
                            <button
                                onClick={() => setIsUserListOpen(false)}
                                style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {loadingUsers ? (
                                <div style={{ textAlign: 'center', padding: '1rem', color: '#6b7280' }}>Loading users...</div>
                            ) : users.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '1rem', color: '#6b7280' }}>No users found.</div>
                            ) : (
                                users.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleSelectUser(user)}
                                        style={{
                                            border: '1px solid var(--color-border)',
                                            background: '#fff',
                                            padding: '10px',
                                            borderRadius: '6px',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                        className="user-select-btn"
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{user.email}</div>
                                        </div>
                                        <div style={{
                                            fontSize: '0.7rem',
                                            background: '#f3f4f6',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            color: '#4b5563'
                                        }}>
                                            {user.roles?.includes('SuperUser') ? 'SuperUser' : user.roles?.includes('Admin') ? 'Admin' : 'User'}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                .user-select-btn:hover {
                    background-color: #f9fafb !important;
                    border-color: #d1d5db !important;
                }
            `}</style>
        </div>
    );
}
