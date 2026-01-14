import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBoards } from '../context/BoardsContext';
import '../styles/layout.css';

interface SidebarProps {
}

export function Sidebar({ }: SidebarProps) {
    const location = useLocation();
    const { currentRole } = useAuth();
    const isActive = (path: string) => location.pathname === path;
    const { boards } = useBoards();

    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('sidebar_collapsed') === 'true';
    });
    // Default order
    const defaultOrder = ['dashboard', 'requests', 'boards', 'escalations', 'cards', 'reports', 'ingress', 'archive', 'trash'];
    const [order, setOrder] = useState<string[]>(() => {
        const saved = localStorage.getItem('sidebar_order');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (!parsed.includes('requests')) {
                return ['dashboard', 'requests', ...parsed.filter((p: string) => p !== 'dashboard')];
            }
            return parsed;
        }
        return defaultOrder;
    });

    useEffect(() => {
        const handleStorageChange = () => {
            const saved = localStorage.getItem('sidebar_order');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (!parsed.includes('requests')) {
                    parsed.splice(1, 0, 'requests'); // Insert after dashboard
                }
                setOrder(parsed);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        // Custom event for same-window updates from Settings
        window.addEventListener('sidebar_order_updated', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('sidebar_order_updated', handleStorageChange);
        };
    }, []);

    // Verify 'requests' is in the order, if not add it (Self-healing for existing users)
    useEffect(() => {
        if (!order.includes('requests')) {
            setOrder(prev => {
                const newOrder = [...prev];
                // Insert after dashboard if possible, else beginning
                const dashIndex = newOrder.indexOf('dashboard');
                if (dashIndex >= 0) {
                    newOrder.splice(dashIndex + 1, 0, 'requests');
                } else {
                    newOrder.unshift('requests');
                }
                return newOrder;
            });
        }
    }, [order]);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebar_collapsed', String(newState));
    };

    const renderItem = (id: string) => {
        switch (id) {
            case 'dashboard':
                if (currentRole === 'Admin') {
                    return (
                        <div key="dashboard" style={{ display: 'flex', flexDirection: 'column' }}>
                            <Link to="/admin" className={`nav-item ${isActive('/admin') ? 'active' : ''}`} title={isCollapsed ? "Admin Dashboard" : ""}>
                                <span className="nav-icon">⚡</span>
                                {!isCollapsed && "Admin Dashboard"}
                            </Link>
                            {!isCollapsed && (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <Link
                                        to="/admin/users"
                                        className={`nav-item ${isActive('/admin/users') ? 'active' : ''}`}
                                        style={{ paddingLeft: '2.5rem', fontSize: '0.9rem' }}
                                    >
                                        Users
                                    </Link>
                                    <Link
                                        to="/admin/teams"
                                        className={`nav-item ${isActive('/admin/teams') ? 'active' : ''}`}
                                        style={{ paddingLeft: '2.5rem', fontSize: '0.9rem' }}
                                    >
                                        Teams
                                    </Link>
                                    <Link
                                        to="/admin/boards"
                                        className={`nav-item ${isActive('/admin/boards') ? 'active' : ''}`}
                                        style={{ paddingLeft: '2.5rem', fontSize: '0.9rem' }}
                                    >
                                        Boards
                                    </Link>
                                </div>
                            )}
                            <div style={{ height: '2px', background: 'rgba(255, 255, 255, 0.1)', margin: '4px 0 8px 0', borderRadius: '1px' }} />
                        </div>
                    );
                }
                if (currentRole === 'SuperUser') {
                    return (
                        <div key="dashboard" style={{ display: 'flex', flexDirection: 'column' }}>
                            <Link to="/superuser" className={`nav-item ${isActive('/superuser') ? 'active' : ''}`} title={isCollapsed ? "Superuser Dashboard" : ""}>
                                <span className="nav-icon">🚀</span>
                                {!isCollapsed && "Superuser Dashboard"}
                            </Link>
                            {!isCollapsed && (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <Link
                                        to="/superuser/users"
                                        className={`nav-item ${isActive('/superuser/users') ? 'active' : ''}`}
                                        style={{ paddingLeft: '2.5rem', fontSize: '0.9rem' }}
                                    >
                                        Users
                                    </Link>
                                    <Link
                                        to="/superuser/teams"
                                        className={`nav-item ${isActive('/superuser/teams') ? 'active' : ''}`}
                                        style={{ paddingLeft: '2.5rem', fontSize: '0.9rem' }}
                                    >
                                        Teams
                                    </Link>
                                    <Link
                                        to="/superuser/boards"
                                        className={`nav-item ${isActive('/superuser/boards') ? 'active' : ''}`}
                                        style={{ paddingLeft: '2.5rem', fontSize: '0.9rem' }}
                                    >
                                        Boards
                                    </Link>
                                </div>
                            )}
                            <div style={{ height: '2px', background: 'rgba(255, 255, 255, 0.1)', margin: '4px 0 8px 0', borderRadius: '1px' }} />
                        </div>
                    );
                }
                return null;
            case 'boards':
                return (
                    <div className="nav-item-group" key="boards" style={{ display: 'flex', flexDirection: 'column' }}>
                        <Link to="/boards" className={`nav-item ${isActive('/boards') ? 'active' : ''}`} title={isCollapsed ? "Boards" : ""}>
                            <span className="nav-icon">📋</span>
                            {!isCollapsed && "Boards"}
                        </Link>
                        {!isCollapsed && boards.map(board => (
                            <Link
                                key={board.id}
                                to={`/boards/${board.id}`}
                                className={`nav-item ${location.pathname === `/boards/${board.id}` ? 'active' : ''}`}
                                style={{ paddingLeft: '2.5rem', fontSize: '0.9rem' }}
                            >
                                {board.name}
                            </Link>
                        ))}
                        {!isCollapsed && boards.length === 0 && (
                            <div style={{ paddingLeft: '2.5rem', fontSize: '0.8rem', color: 'var(--color-text-sidebar-muted)', paddingTop: '0.25rem', paddingBottom: '0.25rem' }}>
                                No boards found
                            </div>
                        )}
                        <div style={{ height: '2px', background: 'rgba(255, 255, 255, 0.1)', margin: '8px 0', borderRadius: '1px' }} />
                    </div>
                );
            case 'escalations':
                if (currentRole === 'Admin' || currentRole === 'SuperUser') {
                    return (
                        <Link key="escalations" to="/escalations" className={`nav-item ${isActive('/escalations') ? 'active' : ''}`} title={isCollapsed ? "Escalations" : ""}>
                            <span className="nav-icon" style={{ color: 'var(--color-danger)' }}>⚠️</span>
                            {!isCollapsed && "Escalations"}
                        </Link>
                    );
                }
                return null;
            case 'requests':
                return (
                    <Link key="requests" to="/customer-requests" className={`nav-item ${isActive('/customer-requests') ? 'active' : ''}`} title={isCollapsed ? "New Request" : ""}>
                        <span className="nav-icon" style={{ color: 'var(--color-primary)' }}>➕</span>
                        {!isCollapsed && "New Request"}
                    </Link>
                );
            case 'cards':
                return (
                    <Link key="cards" to="/tickets" className={`nav-item ${isActive('/tickets') ? 'active' : ''}`} title={isCollapsed ? "Cards" : ""}>
                        <span className="nav-icon">🎫</span>
                        {!isCollapsed && "Cards"}
                    </Link>
                );
            case 'reports':
                return (
                    <Link key="reports" to="/reports" className={`nav-item ${isActive('/reports') ? 'active' : ''}`} title={isCollapsed ? "Reports" : ""}>
                        <span className="nav-icon">📈</span>
                        {!isCollapsed && "Reports"}
                    </Link>
                );
            case 'archive':
                return (
                    <Link key="archive" to="/archive" className={`nav-item ${isActive('/archive') ? 'active' : ''}`} title={isCollapsed ? "Archive" : ""} style={{ marginTop: 'auto' }}>
                        <span className="nav-icon">📦</span>
                        {!isCollapsed && "Archive"}
                    </Link>
                );

            case 'ingress':
                if (currentRole === 'SuperUser') {
                    return (
                        <div key="ingress" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ height: '2px', background: 'rgba(255, 255, 255, 0.1)', margin: '8px 0', borderRadius: '1px' }} />
                            <Link to="/ingress" className={`nav-item ${isActive('/ingress') ? 'active' : ''}`} title={isCollapsed ? "Ingress" : ""}>
                                <span className="nav-icon">📥</span>
                                {!isCollapsed && "Ingress"}
                            </Link>
                        </div>
                    );
                }
                return null;
            case 'trash':
                return (
                    <Link key="trash" to="/trash" className={`nav-item ${isActive('/trash') ? 'active' : ''}`} title={isCollapsed ? "Trash" : ""}>
                        <span className="nav-icon">🗑️</span>
                        {!isCollapsed && "Trash"}
                    </Link>
                );
            default:
                return null;
        }
    };

    return (
        <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header" style={{ justifyContent: isCollapsed ? 'center' : 'space-between' }}>
                {!isCollapsed && <span>CaseManager</span>}
                <button
                    onClick={toggleCollapse}
                    style={{
                        background: 'var(--color-bg-surface)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-main)',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.8rem',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                    title={isCollapsed ? "Expand" : "Collapse"}
                >
                    {isCollapsed ? '➡' : '⬅'}
                </button>
            </div>

            <nav className="sidebar-nav">
                {order.map(id => renderItem(id))}
            </nav>


        </aside >
    );
}

