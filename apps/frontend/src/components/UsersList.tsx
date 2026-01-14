import { useEffect, useState, useRef, useMemo } from 'react';
import { UserWithDetails, fetchUsers, deactivateUser, activateUser, createUser, updateUser, deleteUser } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { UserModal } from './UserModal';
import '../styles/kanban.css'; // Ensure we have styles for buttons

type SortDirection = 'asc' | 'desc' | null;
interface SortConfig {
    key: string;
    direction: SortDirection;
}

export function UsersList() {
    const { currentRole } = useAuth();
    const [users, setUsers] = useState<UserWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Defensive check: ensure users is always an array
    const safeUsers = Array.isArray(users) ? users : [];

    // Filter & Sort State
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null });
    const [filters, setFilters] = useState<Record<string, string[]>>({});
    const [openFilterColumn, setOpenFilterColumn] = useState<string | null>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserWithDetails | undefined>(undefined);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const isSuperUser = currentRole === 'SuperUser';
    const isAdmin = currentRole === 'Admin' || isSuperUser;

    useEffect(() => {
        loadUsers();
        // Close menu when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (openMenuId) {
                setOpenMenuId(null);
            }
            if (openFilterColumn && filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setOpenFilterColumn(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId, openFilterColumn]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await fetchUsers();
            setUsers(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = () => {
        setSelectedUser(undefined);
        setIsModalOpen(true);
    };

    const handleEditUser = (user: UserWithDetails) => {
        setSelectedUser(user);
        setIsModalOpen(true);
        setOpenMenuId(null);
    };

    const handleDeleteUser = async (user: UserWithDetails) => {
        if (!window.confirm(`Are you sure you want to delete ${user.name}?`)) return;
        try {
            await deleteUser(user.id);
            setUsers(users.filter(u => u.id !== user.id));
        } catch (err: any) {
            alert('Failed to delete user: ' + err.message);
        }
        setOpenMenuId(null);
    };

    const handleToggleStatus = async (user: UserWithDetails) => {
        setOpenMenuId(null);
        try {
            if (user.isActive) {
                await deactivateUser(user.id);
            } else {
                await activateUser(user.id);
            }
            // Update local state
            setUsers(users.map(u => u.id === user.id ? { ...u, isActive: !user.isActive } : u));
        } catch (err: any) {
            alert('Failed to update status');
        }
    };

    const handleSaveUser = async (data: any) => {
        if (selectedUser) {
            // Update
            const updated = await updateUser(selectedUser.id, data);
            setUsers(users.map(u => u.id === selectedUser.id ? updated : u));
        } else {
            // Create
            const created = await createUser(data);
            setUsers([...users, created]);
        }
    };

    const toggleMenu = (e: React.MouseEvent, userId: string) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === userId ? null : userId);
    };

    const formatUsername = (fullName: string) => {
        if (!fullName) return '';
        const parts = fullName.trim().split(' ');
        if (parts.length < 2) return fullName;
        const last = parts.pop();
        const first = parts.join(' ');
        return `${last}, ${first}`;
    };

    // --- Filtering & Sorting Logic ---

    const getColumnValue = (user: UserWithDetails, columnKey: string): string => {
        switch (columnKey) {
            case 'name': return formatUsername(user.name || '');
            case 'email': return user.email || '';
            case 'role': return Array.isArray(user.roles) ? user.roles.join(', ') : '';
            case 'manager': return user.manager?.name || '-';
            case 'status': return user.isActive ? 'Active' : 'Deactivated';
            default: return '';
        }
    };

    const getUniqueValues = (columnKey: string) => {
        const values = new Set(safeUsers.map(u => getColumnValue(u, columnKey)));
        return Array.from(values).sort();
    };

    const handleSort = (key: string, direction: SortDirection) => {
        setSortConfig({ key, direction });
        setOpenFilterColumn(null); // Close dropdown after sort
    };

    const handleFilterChange = (columnKey: string, value: string) => {
        setFilters(prev => {
            const current = prev[columnKey] || [];
            if (current.includes(value)) {
                return { ...prev, [columnKey]: current.filter(v => v !== value) };
            } else {
                return { ...prev, [columnKey]: [...current, value] };
            }
        });
    };

    const handleSelectAll = (columnKey: string, values: string[]) => {
        setFilters(prev => {
            const current = prev[columnKey] || [];
            if (current.length === values.length) {
                return { ...prev, [columnKey]: [] }; // Deselect all
            } else {
                return { ...prev, [columnKey]: values }; // Select all
            }
        });
    };

    const clearFilter = (columnKey: string) => {
        setFilters(prev => {
            const next = { ...prev };
            delete next[columnKey];
            return next;
        });
    };

    const filteredUsers = useMemo(() => {
        let result = [...safeUsers];

        // Apply Filters
        Object.entries(filters).forEach(([key, selectedValues]) => {
            if (selectedValues.length > 0) {
                result = result.filter(user => selectedValues.includes(getColumnValue(user, key)));
            }
        });

        // Apply Sort
        if (sortConfig.key && sortConfig.direction) {
            result.sort((a, b) => {
                const valA = getColumnValue(a, sortConfig.key).toLowerCase();
                const valB = getColumnValue(b, sortConfig.key).toLowerCase();
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [safeUsers, filters, sortConfig]);

    const renderFilterDropdown = (columnKey: string) => {
        if (openFilterColumn !== columnKey) return null;

        const uniqueValues = getUniqueValues(columnKey);
        const selectedValues = filters[columnKey] || [];
        const isAllSelected = selectedValues.length === uniqueValues.length;

        return (
            <div ref={filterRef} style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-lg)',
                width: '240px',
                zIndex: 100,
                color: 'var(--color-text-main)',
                fontSize: 'var(--text-sm)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ padding: '8px', borderBottom: '1px solid var(--color-border)' }}>
                    <button
                        onClick={() => handleSort(columnKey, 'asc')}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-main)' }}
                        className="hover-bg-app"
                    >
                        Sort A to Z
                    </button>
                    <button
                        onClick={() => handleSort(columnKey, 'desc')}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-main)' }}
                        className="hover-bg-app"
                    >
                        Sort Z to A
                    </button>
                </div>
                <div style={{ padding: '8px', overflowY: 'auto', maxHeight: '200px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', cursor: 'pointer', fontWeight: 600 }}>
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={() => handleSelectAll(columnKey, uniqueValues)}
                        />
                        (Select All)
                    </label>
                    {uniqueValues.map(val => (
                        <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={selectedValues.includes(val)}
                                onChange={() => handleFilterChange(columnKey, val)}
                            />
                            {val}
                        </label>
                    ))}
                </div>
                <div style={{ padding: '8px', borderTop: '1px solid var(--color-border)', textAlign: 'right' }}>
                    <button
                        onClick={() => clearFilter(columnKey)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}
                    >
                        Clear Filter
                    </button>
                </div>
            </div>
        );
    };

    const renderHeaderCell = (label: string, columnKey: string, width: string) => {
        const isFiltered = filters[columnKey]?.length > 0;
        const isSorted = sortConfig.key === columnKey;

        return (
            <th style={{ textAlign: 'left', padding: '12px 24px', fontWeight: 600, color: '#6b7280', width, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {label}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenFilterColumn(openFilterColumn === columnKey ? null : columnKey);
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: isFiltered || isSorted ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z" />
                        </svg>
                    </button>
                </div>
                {renderFilterDropdown(columnKey)}
            </th>
        );
    };

    if (loading) return <div className="p-4">Loading users...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

    return (
        <div style={{ maxWidth: '100%' }}>
            <div style={{ paddingBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>User Management</h1>
                    <p style={{ marginTop: '4px', color: '#6b7280', fontSize: '0.875rem' }}>Manage system access and roles.</p>
                </div>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={handleAddUser}>
                        + Add User
                    </button>
                )}
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'visible' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', tableLayout: 'fixed' }}>
                    <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <tr>
                            {renderHeaderCell('Name', 'name', '20%')}
                            {renderHeaderCell('Email', 'email', '25%')}
                            {renderHeaderCell('Role', 'role', '15%')}
                            {renderHeaderCell('Manager', 'manager', '20%')}
                            {renderHeaderCell('Status', 'status', '10%')}
                            {isSuperUser && (
                                <th style={{ textAlign: 'right', padding: '12px 24px', fontWeight: 600, color: '#6b7280', width: '10%' }}>Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={isSuperUser ? 6 : 5} style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                                    No users match the current filters.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => {
                                if (!user) return null; // Defensive check
                                return (
                                    <tr key={user.id || Math.random()} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: '#e0e7ff',
                                                    color: '#4f46e5',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '12px',
                                                    fontWeight: 700
                                                }}>
                                                    {(user.name || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ fontWeight: 500, color: '#111827' }}>{formatUsername(user.name || 'Unknown')}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', color: '#6b7280' }}>
                                            {user.email || 'No Email'}
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                background: '#eff6ff',
                                                color: '#1d4ed8',
                                                fontSize: '11px',
                                                fontWeight: 600
                                            }}>
                                                {Array.isArray(user.roles) ? user.roles.join(', ') : 'No Roles'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            {user.manager ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        borderRadius: '50%',
                                                        background: '#f1f5f9',
                                                        color: '#64748b',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '10px',
                                                        fontWeight: 700
                                                    }}>
                                                        {user.manager.name.charAt(0)}
                                                    </div>
                                                    <span style={{ color: '#4b5563' }}>{user.manager.name}</span>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#9ca3af' }}>-</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{
                                                textTransform: 'uppercase',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                padding: '2px 8px',
                                                borderRadius: '99px',
                                                background: user.isActive ? '#f0fdf4' : '#fef2f2',
                                                color: user.isActive ? '#22c55e' : '#ef4444'
                                            }}>
                                                {user.isActive ? 'Active' : 'Deactivated'}
                                            </span>
                                        </td>
                                        {isAdmin && (
                                            <td style={{ padding: '16px 24px', textAlign: 'right', position: 'relative' }}>
                                                <button
                                                    onClick={(e) => toggleMenu(e, user.id)}
                                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                        <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                                                    </svg>
                                                </button>
                                                {openMenuId === user.id && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        right: '24px',
                                                        top: '40px',
                                                        background: 'white',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '6px',
                                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                        zIndex: 9999,
                                                        minWidth: '150px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <button
                                                            onClick={() => handleEditUser(user)}
                                                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px', border: 'none', background: 'white', cursor: 'pointer', fontSize: '0.875rem' }}
                                                            className="hover-bg-app"
                                                        >
                                                            Edit User
                                                        </button>
                                                        {isSuperUser && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleToggleStatus(user)}
                                                                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px', border: 'none', background: 'white', cursor: 'pointer', fontSize: '0.875rem', color: user.isActive ? '#ef4444' : '#22c55e' }}
                                                                    className="hover-bg-app"
                                                                >
                                                                    {user.isActive ? 'Deactivate' : 'Activate'}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteUser(user)}
                                                                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px', border: 'none', background: 'white', cursor: 'pointer', fontSize: '0.875rem', color: '#ef4444' }}
                                                                    className="hover-bg-app"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>


            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSaveUser}
                user={selectedUser}
                users={safeUsers}
            />

            <style>{`
                .hover-bg-app:hover { background-color: #f3f4f6 !important; }
            `}</style>
        </div>
    );
}
