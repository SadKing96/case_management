import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { useNavigate } from 'react-router-dom';
import '../styles/layout.css';
import { SettingsModal } from './SettingsModal';
import { BoardTabs } from './BoardTabs';

interface AppShellProps {
    children: ReactNode;
    title?: string;
    actions?: ReactNode;
    onAccountClick?: () => void;
}

export function AppShell({ children, title = 'Dashboard', actions, onAccountClick }: AppShellProps) {
    const navigate = useNavigate();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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
        <div className="app-shell">
            <Sidebar />
            <main className="main-content">
                <header className="app-header">
                    <h1 className="header-title">{title}</h1>
                    <div className="header-actions">
                        {/* Actions removed from here, moved to BoardTabs */}
                        <div className="user-menu-container" ref={menuRef}>
                            <div
                                className="user-menu-trigger"
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            >
                                <div className="btn" style={{ background: '#e5e7eb', color: '#374151', border: 'none' }}>
                                    👤 JM
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
                <BoardTabs actions={actions} />
                <div className="page-content">
                    {children}
                </div>
            </main>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
}
