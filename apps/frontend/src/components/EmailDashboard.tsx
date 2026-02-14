import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import '../styles/layout.css';

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

export function EmailDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'filters' | 'alerts'>('overview');

    // Rules State
    const [rules, setRules] = useState<IngressRule[]>([]);
    const [newRule, setNewRule] = useState({ name: '', keyword: '', targetBoardId: '', targetColumnId: '' });
    const [boards, setBoards] = useState<any[]>([]);
    const [ruleColumns, setRuleColumns] = useState<Column[]>([]);
    const [loadingRules, setLoadingRules] = useState(false);

    useEffect(() => {
        if (activeTab === 'rules') {
            fetchRules();
            fetchBoards();
        }
    }, [activeTab]);

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
        setLoadingRules(true);
        try {
            const res = await apiClient.get('/ingress/rules') as any;
            setRules((res.data as IngressRule[]) || res as IngressRule[]); // handle variety of responses
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingRules(false);
        }
    };

    const createRule = async () => {
        if (!newRule.name || !newRule.targetBoardId) return;
        try {
            await apiClient.post('/ingress/rules', newRule);
            setNewRule({ name: '', keyword: '', targetBoardId: '', targetColumnId: '' });
            fetchRules();
        } catch (err) {
            console.error(err);
            alert('Failed to create rule');
        }
    };

    const deleteRule = async (id: string) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;
        try {
            await apiClient.delete(`/ingress/rules/${id}`);
            fetchRules();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: 'var(--color-text-main)' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>Email Dashboard</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Manage email ingestion rules, spam filters, and notification alerts.</p>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)' }}>
                {['overview', 'rules', 'filters', 'alerts'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        style={{
                            padding: '1rem 1.5rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab ? '3px solid var(--color-primary)' : '3px solid transparent',
                            color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                            fontWeight: activeTab === tab ? '700' : '500',
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            fontSize: '1rem'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div style={{ minHeight: '400px' }}>

                {activeTab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        <div style={{ padding: '2rem', background: 'var(--color-bg-surface)', borderRadius: '1rem', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>📧 Inbound Volume</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>1,248</div>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Emails processed this week</div>
                        </div>
                        <div style={{ padding: '2rem', background: 'var(--color-bg-surface)', borderRadius: '1rem', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>⚡ Auto-Routed</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-success)' }}>86%</div>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Successfully matched by rules</div>
                        </div>
                        <div style={{ padding: '2rem', background: 'var(--color-bg-surface)', borderRadius: '1rem', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>🛡️ Spam Blocked</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-danger)' }}>42</div>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Threats prevented</div>
                        </div>
                    </div>
                )}

                {activeTab === 'rules' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Ingestion Rules</h2>
                        </div>

                        {/* Add Rule Form */}
                        <div style={{
                            background: 'var(--color-bg-surface)',
                            padding: '1.5rem',
                            borderRadius: '1rem',
                            marginBottom: '2rem',
                            border: '1px solid var(--color-border)',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '1rem',
                            alignItems: 'end'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Rule Name</label>
                                <input
                                    placeholder="e.g. Urgent Orders"
                                    value={newRule.name}
                                    onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                                    style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-app)', color: 'var(--color-text-main)' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Subject Keyword</label>
                                <input
                                    placeholder="e.g. URGENT"
                                    value={newRule.keyword}
                                    onChange={e => setNewRule({ ...newRule, keyword: e.target.value })}
                                    style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-app)', color: 'var(--color-text-main)' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Route to Board</label>
                                <select
                                    value={newRule.targetBoardId}
                                    onChange={e => setNewRule({ ...newRule, targetBoardId: e.target.value })}
                                    style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-app)', color: 'var(--color-text-main)' }}
                                >
                                    <option value="">Select Board...</option>
                                    {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Column</label>
                                <select
                                    value={newRule.targetColumnId}
                                    onChange={e => setNewRule({ ...newRule, targetColumnId: e.target.value })}
                                    disabled={!newRule.targetBoardId}
                                    style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-app)', color: 'var(--color-text-main)' }}
                                >
                                    <option value="">Select Column...</option>
                                    {ruleColumns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <button
                                onClick={createRule}
                                style={{
                                    padding: '0.75rem',
                                    background: 'var(--color-primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                + Add Rule
                            </button>
                        </div>

                        {/* Rules List */}
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {loadingRules ? (
                                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading rules...</div>
                            ) : rules.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)', background: 'var(--color-bg-surface)', borderRadius: '1rem', border: '1px dashed var(--color-border)' }}>
                                    No rules configured yet. Add one above.
                                </div>
                            ) : (
                                rules.map(rule => (
                                    <div key={rule.id} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '1.25rem',
                                        background: 'var(--color-bg-surface)',
                                        borderRadius: '0.75rem',
                                        border: '1px solid var(--color-border)',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '0.25rem' }}>{rule.name}</div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                                If subject contains <span style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.1)', padding: '0.1rem 0.3rem', borderRadius: '0.25rem' }}>{rule.keyword}</span>
                                                {' '} → Route to <strong>{rule.targetBoard?.name || 'Unknown Board'}</strong> ({rule.targetColumn?.name || 'Unknown Column'})
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteRule(rule.id)}
                                            style={{
                                                color: 'var(--color-danger)',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: 'none',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '0.5rem',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'filters' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Spam Filters & Blocklists</h2>
                        </div>
                        <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--color-bg-surface)', borderRadius: '1rem', border: '1px dashed var(--color-border)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
                            <h3 style={{ marginBottom: '0.5rem' }}>Advanced Filtering</h3>
                            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
                                Configure domain blocklists, keyword filtering, and attachment policies here.
                                (Coming Soon)
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'alerts' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Notifications & Alerts</h2>
                        </div>
                        <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--color-bg-surface)', borderRadius: '1rem', border: '1px dashed var(--color-border)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
                            <h3 style={{ marginBottom: '0.5rem' }}>Alert Configuration</h3>
                            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
                                Set up Slack or Email notifications for high-priority inbound emails or rule matches.
                                (Coming Soon)
                            </p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
