import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Case } from '../../../../packages/shared/src/types';

export function ArchiveList() {
    const [archivedCases, setArchivedCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArchived = async () => {
            try {
                // We need to fetch archived cases. The current GET /cases endpoint filters filtering active=true by default.
                // We need to call GET /cases?active=false
                const res: any = await apiClient.get('/cases?active=false');
                setArchivedCases(res);
            } catch (err) {
                console.error('Failed to fetch archived cases', err);
            } finally {
                setLoading(false);
            }
        };
        fetchArchived();
    }, []);

    const handleRestore = async (caseId: string) => {
        if (!window.confirm('Restore this case? It will reappear on its board.')) return;
        try {
            await apiClient.put(`/cases/${caseId}`, { archivedAt: null });
            setArchivedCases(prev => prev.filter(c => c.id !== caseId));
        } catch (err) {
            console.error('Failed to restore case', err);
            alert('Failed to restore case');
        }
    };

    if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Loading archive...</div>;

    return (
        <div style={{ padding: '24px', maxWidth: '100%' }}>
            <div style={{ paddingBottom: '24px' }}>
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, margin: 0, color: 'var(--color-text-main)' }}>Archived Cases</h1>
                <p style={{ marginTop: '4px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>View and restore previously archived cases.</p>
            </div>

            {archivedCases.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    No archived cases found.
                </div>
            ) : (
                <div style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                        <thead style={{ background: 'var(--color-bg-app)', borderBottom: '1px solid var(--color-border)' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '12px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Title</th>
                                <th style={{ textAlign: 'left', padding: '12px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Type</th>
                                <th style={{ textAlign: 'left', padding: '12px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Archived Date</th>
                                <th style={{ textAlign: 'right', padding: '12px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {archivedCases.map(c => (
                                <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{c.title}</div>
                                        {c.quoteId && <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Ref: {c.quoteId}</div>}
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            background: c.type === 'QUOTE' ? 'var(--color-bg-app)' : 'var(--color-bg-column)',
                                            color: c.type === 'QUOTE' ? 'var(--color-primary)' : 'var(--color-primary)',
                                            fontSize: 'var(--text-xs)',
                                            fontWeight: 600
                                        }}>
                                            {c.type || 'ORDER'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>
                                        {c.archivedAt ? new Date(c.archivedAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleRestore(c.id)}
                                            style={{
                                                border: 'none',
                                                background: 'transparent',
                                                color: 'var(--color-primary)',
                                                cursor: 'pointer',
                                                fontWeight: 500,
                                                fontSize: 'var(--text-sm)'
                                            }}
                                        >
                                            Restore
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
