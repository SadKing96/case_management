import React, { useState, useEffect, useMemo } from 'react';
import '../styles/variables.css';
import { TeamModal } from './TeamModal';

interface Team {
    id: string;
    name: string;
    description?: string;
    color: string;
    isActive: boolean;
    members: { user: { id: string; name: string; email: string } }[];
}

type SortDirection = 'asc' | 'desc' | null;
interface SortConfig {
    key: string;
    direction: SortDirection;
}

export function TeamManagement() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchTeams(), fetchUsers()]);
            setLoading(false);
        };
        loadData();

        const handleClickOutside = () => setOpenMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchUsers = () => {
        return fetch('http://localhost:3001/api/v1/users', {
            headers: { 'Authorization': 'Bearer mock-token' }
        })
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(err => console.error(err));
    };

    const fetchTeams = () => {
        return fetch('http://localhost:3001/api/v1/teams', {
            headers: { 'Authorization': 'Bearer mock-token' }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setTeams(data);
                } else {
                    console.error('Failed to fetch teams:', data);
                    setTeams([]);
                }
            })
            .catch(err => {
                console.error(err);
                setTeams([]);
            });
    };

    const handleCreateTeam = async (data: any) => {
        try {
            const res = await fetch('http://localhost:3001/api/v1/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mock-token' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                await fetchTeams();
                setIsTeamModalOpen(false);
            } else {
                alert('Failed to create team');
            }
        } catch (e) {
            console.error(e);
            alert('Error creating team');
        }
    };

    const handleUpdateTeam = async (data: any) => {
        if (!editingTeam) return;
        await fetch(`http://localhost:3001/api/v1/teams/${editingTeam.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mock-token' },
            body: JSON.stringify(data)
        });
        fetchTeams();
    };

    const handleDeleteTeam = async (id: string) => {
        if (!confirm('Delete this team?')) return;
        await fetch(`http://localhost:3001/api/v1/teams/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer mock-token' }
        });
        fetchTeams();
    };

    const toggleStatus = async (team: Team) => {
        try {
            await fetch(`http://localhost:3001/api/v1/teams/${team.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mock-token' },
                body: JSON.stringify({
                    name: team.name, // Required by validation currently, ideally PATCH
                    isActive: !team.isActive
                })
            });
            fetchTeams();
        } catch (e) {
            console.error(e);
            alert('Failed to update status');
        }
    };

    // Sorting Logic
    const sortedTeams = useMemo(() => {
        if (!sortConfig.key || !sortConfig.direction) return teams;

        return [...teams].sort((a, b) => {
            let aValue: any = '';
            let bValue: any = '';

            switch (sortConfig.key) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'members':
                    aValue = a.members?.length || 0;
                    bValue = b.members?.length || 0;
                    break;
                case 'color':
                    aValue = a.color;
                    bValue = b.color;
                    break;
                case 'description':
                    aValue = (a.description || '').toLowerCase();
                    bValue = (b.description || '').toLowerCase();
                    break;
                case 'isActive':
                    aValue = a.isActive === false ? 0 : 1; // Active (true/undefined) > Inactive (false)
                    bValue = b.isActive === false ? 0 : 1;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [teams, sortConfig]);

    const handleSort = (key: string) => {
        let direction: SortDirection = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const renderHeaderCell = (label: string, columnKey: string, width: string) => {
        const isSorted = sortConfig.key === columnKey;

        return (
            <th style={{ textAlign: 'left', padding: '12px 24px', fontWeight: 600, color: '#6b7280', width, position: 'relative' }}>
                <div
                    onClick={() => handleSort(columnKey)}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                >
                    {label}
                    {/* Sort Icon Match Users List */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        color: isSorted ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                        opacity: isSorted ? 1 : 0.5 // Increased visibility
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z" />
                        </svg>
                    </div>
                </div>
            </th>
        );
    };

    const toggleMenu = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === id ? null : id);
    };

    return (
        <div style={{ maxWidth: '100%' }}>
            <div style={{ paddingBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>Team Management</h1>
                    <p style={{ marginTop: '4px', color: '#6b7280', fontSize: '0.875rem' }}>Create and manage teams.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary" onClick={() => alert('Bulk assignment coming soon!')}>
                        Assign Team Members
                    </button>
                    <button className="btn btn-primary" onClick={() => { setEditingTeam(null); setIsTeamModalOpen(true); }}>
                        + Create Team
                    </button>
                </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'visible' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', tableLayout: 'fixed' }}>
                    <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <tr>
                            {renderHeaderCell('Team Name', 'name', '20%')}
                            {renderHeaderCell('Members', 'members', '25%')}
                            {renderHeaderCell('Team Color', 'color', '15%')}
                            {renderHeaderCell('Description', 'description', '25%')}
                            {renderHeaderCell('Status', 'isActive', '10%')}
                            <th style={{ textAlign: 'center', padding: '12px 24px', fontWeight: 600, color: '#6b7280', width: '5%' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center' }}>Loading...</td></tr>
                        ) : sortedTeams.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                                    No teams found.
                                </td>
                            </tr>
                        ) : (
                            sortedTeams.map(team => (
                                <tr key={team.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '16px 24px', fontWeight: 500, color: '#111827' }}>
                                        {team.name}
                                    </td>
                                    <td style={{ padding: '16px 24px', color: '#6b7280' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {team.members && team.members.length > 0 ? (
                                                team.members.map((m, idx) => (
                                                    <span key={idx} style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                                                        {m.user?.name || 'Unknown'}
                                                    </span>
                                                ))
                                            ) : (
                                                <span style={{ color: '#9ca3af' }}>No members</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: team.color || '#3b82f6' }}></div>
                                            <span style={{ color: '#4b5563', fontSize: '0.8rem' }}>{team.color || '#3b82f6'}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px', color: '#4b5563' }}>
                                        {team.description || '-'}
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{
                                            textTransform: 'uppercase',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: '99px',
                                            background: team.isActive !== false ? '#f0fdf4' : '#fef2f2',
                                            color: team.isActive !== false ? '#22c55e' : '#ef4444'
                                        }}>
                                            {team.isActive !== false ? 'Active' : 'Deactivated'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'center', position: 'relative' }}>
                                        <button
                                            onClick={(e) => toggleMenu(e, team.id)}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ color: '#6b7280' }}>
                                                <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
                                            </svg>
                                        </button>
                                        {openMenuId === team.id && (
                                            <div style={{
                                                position: 'absolute',
                                                right: '24px',
                                                top: '30px',
                                                background: 'white',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '6px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                zIndex: 50,
                                                minWidth: '140px',
                                                textAlign: 'left',
                                                overflow: 'hidden'
                                            }}>
                                                <button
                                                    onClick={() => { setEditingTeam(team); setIsTeamModalOpen(true); }}
                                                    style={{ display: 'block', width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem' }}
                                                    className="hover-bg-app"
                                                >
                                                    Edit Team
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(team)}
                                                    style={{ display: 'block', width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem' }}
                                                    className="hover-bg-app"
                                                >
                                                    {team.isActive !== false ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTeam(team.id)}
                                                    style={{ display: 'block', width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem', color: '#ef4444' }}
                                                    className="hover-bg-app"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <TeamModal
                isOpen={isTeamModalOpen}
                onClose={() => setIsTeamModalOpen(false)}
                onSubmit={editingTeam ? handleUpdateTeam : handleCreateTeam}
                team={editingTeam || undefined}
                availableUsers={users}
            />
            <style>{`
                .hover-bg-app:hover { background-color: #f3f4f6 !important; }
            `}</style>
        </div>
    );
}
