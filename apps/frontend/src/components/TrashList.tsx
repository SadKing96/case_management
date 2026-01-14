import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBoards } from '../context/BoardsContext';

interface DeletedCase {
    id: string;
    title: string;
    board: { id: string; name: string; slug: string; color: string };
    column: { id: string; name: string; color: string };
    assignee: { id: string; name: string; email: string } | null;
    deletedAt: string;
}

export function TrashList() {
    const [cases, setCases] = useState<DeletedCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const fetchTrash = async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:3001/api/v1/cases/trash/all', {
                headers: { 'Authorization': 'Bearer mock-token' }
            });
            if (!res.ok) throw new Error('Failed to fetch trash');
            const data = await res.json();
            setCases(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrash();
    }, []);

    const handleRestore = async (caseId: string) => {
        try {
            const res = await fetch(`http://localhost:3001/api/v1/cases/${caseId}/restore`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer mock-token' }
            });
            if (!res.ok) throw new Error('Failed to restore');
            // Remove from list
            setCases(prev => prev.filter(c => c.id !== caseId));
        } catch (err: any) {
            alert('Error restoring case: ' + err.message);
        }
    };

    const handleDeleteForever = async (caseId: string) => {
        if (!confirm('Are you sure you want to delete this forever? This cannot be undone.')) return;
        try {
            const res = await fetch(`http://localhost:3001/api/v1/cases/${caseId}?permanent=true`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer mock-token' }
            });
            if (!res.ok) throw new Error('Failed to delete');
            setCases(prev => prev.filter(c => c.id !== caseId));
        } catch (err: any) {
            alert('Error deleting case: ' + err.message);
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading trash...</div>;
    if (error) return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;

    return (
        <div style={{ padding: '24px' }}>
            <h1 style={{ marginBottom: '2rem', fontSize: 'var(--text-2xl)', color: 'var(--color-text-main)' }}>Trash</h1>
            {cases.length === 0 ? (
                <div style={{ color: 'var(--color-text-secondary)' }}>Trash is empty.</div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {cases.map(c => (
                        <div key={c.id} style={{
                            backgroundColor: 'var(--color-bg-surface)',
                            padding: '1rem',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontWeight: 'bold', color: 'var(--color-text-main)' }}>{c.title}</div>
                                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                                    Board: <span style={{ color: c.board?.color || 'inherit' }}>{c.board?.name}</span> •
                                    Column: {c.column?.name} •
                                    Deleted: {new Date(c.deletedAt).toLocaleDateString()}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleRestore(c.id)}
                                    className="btn"
                                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-main)', background: 'transparent' }}
                                >
                                    Restore
                                </button>
                                <button
                                    onClick={() => handleDeleteForever(c.id)}
                                    className="btn"
                                    style={{ border: '1px solid var(--color-danger)', color: 'var(--color-danger)', background: 'transparent' }}
                                >
                                    Delete Forever
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
