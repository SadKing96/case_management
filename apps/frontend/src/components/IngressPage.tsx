import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface IngressRule {
    id: string;
    name: string;
    keyword: string;
    targetBoardId: string;
    targetBoard?: { name: string };
    targetColumnId: string;
    targetColumn?: { name: string };
}

interface Column {
    id: string;
    name: string;
}

export function IngressPage() {
    const [activeTab, setActiveTab] = useState<'import' | 'rules'>('import');
    const [boards, setBoards] = useState<any[]>([]);

    // --- Import State ---
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState({ title: '', description: '', priority: '' });

    const [targetBoardId, setTargetBoardId] = useState('');
    const [targetColumnId, setTargetColumnId] = useState('');
    const [columns, setColumns] = useState<Column[]>([]);

    const [importStatus, setImportStatus] = useState('');

    // --- Rules State ---
    const [rules, setRules] = useState<IngressRule[]>([]);
    const [newRule, setNewRule] = useState({ name: '', keyword: '', targetBoardId: '', targetColumnId: '' });
    // Separate columns for the rule creator to avoid conflict with import selection
    const [ruleColumns, setRuleColumns] = useState<Column[]>([]);

    const { currentRole } = useAuth();

    // Initial Load & Tab restriction
    useEffect(() => {
        fetchBoards();
        if (activeTab === 'rules') {
            if (currentRole === 'SuperUser') {
                fetchRules();
            } else {
                // If not superuser, force back to import
                setActiveTab('import');
            }
        }
    }, [activeTab, currentRole]);

    // ... (rest of the state and effects remain the same) ...

    // Fetch Columns for Import when Board changes
    useEffect(() => {
        if (targetBoardId) {
            fetchColumns(targetBoardId).then(cols => {
                setColumns(cols);
                if (cols.length > 0) setTargetColumnId(cols[0].id);
                else setTargetColumnId('');
            });
        } else {
            setColumns([]);
            setTargetColumnId('');
        }
    }, [targetBoardId]);

    // Fetch Columns for Rule Creator when Board changes
    useEffect(() => {
        if (newRule.targetBoardId) {
            fetchColumns(newRule.targetBoardId).then(cols => {
                setRuleColumns(cols);
                if (cols.length > 0) setNewRule(prev => ({ ...prev, targetColumnId: cols[0].id }));
                else setNewRule(prev => ({ ...prev, targetColumnId: '' }));
            });
        } else {
            setRuleColumns([]);
            setNewRule(prev => ({ ...prev, targetColumnId: '' }));
        }
    }, [newRule.targetBoardId]);


    const fetchBoards = async () => {
        try {
            const res = await apiClient.get('/boards/mine') as any;
            const data = (res.data as any[] | { data: any[] });
            const boardsData = Array.isArray(data) ? data : (data.data || []);
            setBoards(boardsData);

            // Default selection for Import if available
            if (boardsData.length > 0 && !targetBoardId) {
                setTargetBoardId(boardsData[0].id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchColumns = async (boardId: string): Promise<Column[]> => {
        try {
            const res = await apiClient.get(`/boards/${boardId}`) as any;
            return res.columns || [];
        } catch (err) {
            console.error(err);
            return [];
        }
    };

    const fetchRules = async () => {
        try {
            const res = await apiClient.get('/ingress/rules') as any;
            setRules((res.data as IngressRule[]));
        } catch (err) {
            console.error(err);
        }
    };

    // --- Import Actions ---

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);

            const formData = new FormData();
            formData.append('file', selectedFile);

            try {
                const res = await apiClient.postFormData('/ingress/upload', formData) as any;
                const data = res.data as { headers: string[], preview: any[] };
                setHeaders(data.headers);
                setPreview(data.preview);
                // Auto-guess mapping
                const guess = { title: '', description: '', priority: '' };
                data.headers.forEach((h: string) => {
                    const lower = h.toLowerCase();
                    if (lower.includes('title') || lower.includes('subject')) guess.title = h;
                    if (lower.includes('desc') || lower.includes('body')) guess.description = h;
                    if (lower.includes('prio')) guess.priority = h;
                });
                setMapping(prev => ({ ...prev, ...guess }));
            } catch (err) {
                console.error(err);
                setImportStatus('Failed to upload file');
            }
        }
    };

    const handleImport = async () => {
        if (!file || !targetBoardId || !targetColumnId) return;
        setImportStatus('Importing...');
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('mapping', JSON.stringify(mapping));
            formData.append('targetBoardId', targetBoardId);
            formData.append('targetColumnId', targetColumnId);

            const res = await apiClient.postFormData('/ingress/import-file', formData) as any;
            const data = res.data as { count: number };
            setImportStatus(`Import successful! Created ${data.count} cards.`);
            setFile(null);
            setPreview([]);
            setHeaders([]);
        } catch (err) {
            console.error(err);
            setImportStatus('Error importing data');
        }
    };

    // --- Rule Actions ---

    const createRule = async () => {
        try {
            await apiClient.post('/ingress/rules', newRule);
            // Reset but keep board maybe? or full reset
            setNewRule({ name: '', keyword: '', targetBoardId: '', targetColumnId: '' });
            fetchRules();
        } catch (err) {
            console.error(err);
        }
    };

    // ... existing actions ...

    if (!currentRole || (currentRole !== 'SuperUser' && currentRole !== 'Admin')) {
        return (
            <div className="ingress-container" style={{ padding: '2rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ padding: '2rem', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                    <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: '1rem', color: 'var(--color-danger)' }}>Access Denied</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>You do not have permission to access the Ingress section.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="ingress-container" style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', marginBottom: '2rem', color: 'var(--color-text-main)' }}>Ingress & Data Rules</h1>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)' }}>
                <button
                    onClick={() => setActiveTab('import')}
                    style={{
                        padding: '1rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'import' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        color: activeTab === 'import' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: 'var(--text-base)'
                    }}
                >
                    Data Import
                </button>
                {currentRole === 'SuperUser' && (
                    <button
                        onClick={() => setActiveTab('rules')}
                        style={{
                            padding: '1rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'rules' ? '2px solid var(--color-primary)' : '2px solid transparent',
                            color: activeTab === 'rules' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: 'var(--text-base)'
                        }}
                    >
                        Email Rules
                    </button>
                )}
            </div>

            {/* Content Actions */}
            <div style={{ backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--color-border)' }}>
                {activeTab === 'import' ? (
                    <div>
                        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: '1rem', color: 'var(--color-text-main)' }}>Import from Sheet</h2>
                        <input type="file" onChange={handleFileChange} accept=".csv,.xlsx,.xls" style={{ marginBottom: '2rem' }} />

                        {headers.length > 0 && (
                            <div style={{ marginTop: '2rem' }}>
                                <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: '1rem' }}>Map Columns</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '600px', marginBottom: '2rem' }}>
                                    {[
                                        { key: 'title', label: 'Card Title' },
                                        { key: 'description', label: 'Description' },
                                        { key: 'priority', label: 'Priority' }
                                    ].map(field => (
                                        <React.Fragment key={field.key}>
                                            <label style={{ color: 'var(--color-text-secondary)' }}>{field.label}</label>
                                            <select
                                                value={mapping[field.key as keyof typeof mapping]}
                                                onChange={e => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-app)', color: 'var(--color-text-main)' }}
                                            >
                                                <option value="">Select Column...</option>
                                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        </React.Fragment>
                                    ))}

                                    <label style={{ color: 'var(--color-text-secondary)' }}>Target Board</label>
                                    <select
                                        value={targetBoardId}
                                        onChange={e => setTargetBoardId(e.target.value)}
                                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-app)', color: 'var(--color-text-main)' }}
                                    >
                                        <option value="">Select Board...</option>
                                        {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>

                                    <label style={{ color: 'var(--color-text-secondary)' }}>Target Column</label>
                                    <select
                                        value={targetColumnId}
                                        onChange={e => setTargetColumnId(e.target.value)}
                                        disabled={!targetBoardId}
                                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-app)', color: 'var(--color-text-main)' }}
                                    >
                                        <option value="">Select Column...</option>
                                        {columns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <button
                                    onClick={handleImport}
                                    style={{ padding: '0.75rem 2rem', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                >
                                    Import Cards
                                </button>
                                {importStatus && <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>{importStatus}</p>}
                            </div>
                        )}
                        {preview.length > 0 && (
                            <div style={{ marginTop: '2rem', overflowX: 'auto' }}>
                                <h4 style={{ marginBottom: '1rem' }}>Preview (First 5 Rows)</h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                                    <thead><tr style={{ background: 'var(--color-bg-app)' }}>{headers.map(h => <th key={h} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', textAlign: 'left' }}>{h}</th>)}</tr></thead>
                                    <tbody>
                                        {preview.map((row, i) => (
                                            <tr key={i}>{headers.map(h => <td key={h} style={{ padding: '0.5rem', border: '1px solid var(--color-border)' }}>{row[h]}</td>)}</tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text-main)' }}>Email Ingestion Rules</h2>
                        </div>

                        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--color-bg-app)', borderRadius: 'var(--radius-md)' }}>
                            <input
                                placeholder="Rule Name"
                                value={newRule.name}
                                onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                            />
                            <input
                                placeholder="Subject Keyword (e.g. Urgent)"
                                value={newRule.keyword}
                                onChange={e => setNewRule({ ...newRule, keyword: e.target.value })}
                                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                            />

                            <select
                                value={newRule.targetBoardId}
                                onChange={e => setNewRule({ ...newRule, targetBoardId: e.target.value })}
                                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                            >
                                <option value="">Select Board...</option>
                                {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>

                            <select
                                value={newRule.targetColumnId}
                                onChange={e => setNewRule({ ...newRule, targetColumnId: e.target.value })}
                                disabled={!newRule.targetBoardId}
                                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                            >
                                <option value="">Select Column...</option>
                                {ruleColumns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            <button
                                onClick={createRule}
                                style={{ backgroundColor: 'var(--color-success)', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Add Rule
                            </button>
                        </div>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {rules.map(rule => (
                                <div key={rule.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'var(--color-bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{rule.name}</div>
                                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                                            If subject contains <span style={{ fontFamily: 'monospace', backgroundColor: 'var(--color-bg-surface)', padding: '0 2px' }}>{rule.keyword}</span> → Board: {rule.targetBoard?.name || 'Unknown'} / Col: {rule.targetColumn?.name || 'Unknown'}
                                        </div>
                                    </div>
                                    <button onClick={async () => { await apiClient.delete(`/ingress/rules/${rule.id}`); fetchRules(); }} style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                                </div>
                            ))}
                            {rules.length === 0 && <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>No rules found.</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
