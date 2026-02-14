import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { useNavigate } from 'react-router-dom';
import '../styles/layout.css';
import { SettingsModal } from './SettingsModal';
import { useAuth } from '../context/AuthContext';


interface AppShellProps {
    children: ReactNode;
    title?: string;
    actions?: ReactNode;
    onAccountClick?: () => void;
}

export function AppShell({ children, title = 'Dashboard', actions, onAccountClick }: AppShellProps) {
    const navigate = useNavigate();
    const { currentRole, user } = useAuth();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const isSuperUser = currentRole === 'SuperUser' || (user?.roles && user.roles.includes('SuperUser'));

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        setIsUserMenuOpen(false);
        navigate('/login');
    };

    return (
        <div className="app-shell" style={isSuperUser ? { paddingTop: '40px' } : undefined}>
            {isSuperUser && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '40px',
                    background: 'linear-gradient(90deg, #4c1d95 0%, #8b5cf6 100%)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                    color: 'white'
                }}>
                    <button
                        onClick={() => navigate('/superuser')}
                        style={{
                            background: 'rgba(255,255,255,0.15)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white',
                            padding: '4px 16px',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                    >
                        <span>🚀</span> Superuser Dashboard
                    </button>
                    {currentRole !== 'SuperUser' && (
                        <span style={{ fontSize: '0.75rem', marginLeft: '1rem', opacity: 0.8 }}>(Acting as {currentRole})</span>
                    )}
                </div>
            )}
            <Sidebar />
            <main className="main-content">
                <header className="app-header">
                    <h1 className="header-title">{title}</h1>
                    <div className="header-actions">
                        {actions}
                        {/* Admin Dashboard Link - only for regular admins since SU has top bar */}
                        {currentRole === 'Admin' && !isSuperUser && (
                            <button
                                className="btn"
                                onClick={() => navigate('/admin')}
                                style={{
                                    marginRight: '1rem',
                                    backgroundColor: 'var(--color-primary)',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                ⚡ Admin Dashboard
                            </button>
                        )}
                        <div className="user-menu-container" ref={menuRef}>
                            <div
                                className="user-menu-trigger"
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            >
                                <div className="btn" style={{ background: '#e5e7eb', color: '#374151', border: 'none' }}>
                                    👤 {user?.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                                </div>
                            </div>

                            {isUserMenuOpen && (
                                <div className="user-dropdown">
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            setIsUserMenuOpen(false);
                                            setIsSettingsOpen(true);
                                        }}
                                    >
                                        Settings
                                    </button>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            setIsUserMenuOpen(false);
                                            onAccountClick?.();
                                        }}
                                    >
                                        Account
                                    </button>
                                    <div className="dropdown-divider"></div>
                                    <button
                                        className="dropdown-item"
                                        style={{ color: 'var(--color-danger)' }}
                                        onClick={handleLogout}
                                    >
                                        Log out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="page-content">
                    {children}
                </div>
            </main>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
}
