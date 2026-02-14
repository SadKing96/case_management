import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { DashboardBuilder, DashboardConfigType, defaultConfig } from './DashboardBuilder';
import { aeroTheme } from './Gartica/garticaGlobals';

interface Case {
    id: string;
    title: string;
    description: string;
    priority: string;
    column: { name: string; color: string; };
    updatedAt: string;
    caseType: string;
}

const DASHBOARD_KEY = 'customer_dashboard';

export function ClientDashboard() {
    const { currentRole } = useAuth();
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Config State
    const [config, setConfig] = useState<DashboardConfigType>(defaultConfig);
    const [isEditing, setIsEditing] = useState(false);
    const [draftConfig, setDraftConfig] = useState<DashboardConfigType>(defaultConfig);
    const [configLoading, setConfigLoading] = useState(true);

    const isAdmin = currentRole === 'SuperUser' || currentRole === 'Admin';

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Config
                const configRes: any = await apiClient.get(`/config/${DASHBOARD_KEY}`);
                if (configRes && configRes.published) {
                    try {
                        const parsed = JSON.parse(configRes.published);
                        if (Object.keys(parsed).length > 0) setConfig(parsed);
                    } catch (e) { console.error('Error parsing published config', e); }
                }

                // If Admin, pre-load draft too?
                if (configRes && configRes.draft) {
                    try {
                        const parsedDraft = JSON.parse(configRes.draft);
                        if (Object.keys(parsedDraft).length > 0) setDraftConfig(parsedDraft);
                        // If no published config exists, fall back to draft or default
                        if (!configRes.published) setConfig(parsedDraft);
                    } catch (e) { console.error('Error parsing draft config', e); }
                }

                // Fetch Cases
                const casesRes: any = await apiClient.get('/cases?active=true');
                setCases(casesRes);
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setLoading(false);
                setConfigLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSaveDraft = async () => {
        try {
            await apiClient.put(`/config/${DASHBOARD_KEY}`, { draft: draftConfig });
            alert('Draft saved successfully');
        } catch (e) {
            console.error(e);
            alert('Failed to save draft');
        }
    };

    const handlePublish = async () => {
        if (!confirm('Are you sure you want to publish these changes to all customers?')) return;
        try {
            await apiClient.post(`/config/${DASHBOARD_KEY}/publish`, {});
            setConfig(draftConfig); // Update live view
            setIsEditing(false);
            alert('Published successfully!');
        } catch (e) {
            console.error(e);
            alert('Failed to publish');
        }
    };

    const activeConfig = isEditing ? draftConfig : config;

    // Calculate Stats
    const totalActive = cases.length;
    const pendingAction = cases.filter(c => c.column?.name === 'To Do' || c.column?.name === 'In Progress').length;
    const critical = cases.filter(c => c.priority === 'Critical').length;

    if (loading || configLoading) return <div style={{ padding: '2rem', textAlign: 'center', color: aeroTheme.colors.textSecondary }}>Loading dashboard...</div>;

    return (
        <div style={aeroTheme.styles.container}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
            }}>

                {/* Admin Toolbar */}
                {isAdmin && (
                    <div style={{
                        marginBottom: '2rem',
                        padding: '1rem',
                        background: 'rgba(31, 41, 55, 0.9)',
                        backdropFilter: 'blur(10px)',
                        color: 'white',
                        borderRadius: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontWeight: 'bold' }}> Admin Controls:</span>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={isEditing}
                                    onChange={(e) => setIsEditing(e.target.checked)}
                                />
                                <span style={{ fontSize: '0.9rem' }}>Edit Mode</span>
                            </label>
                        </div>
                        {isEditing && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={handleSaveDraft}
                                    style={{ ...aeroTheme.styles.buttonPrimary, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                                >
                                    Save Draft
                                </button>
                                <button
                                    onClick={handlePublish}
                                    style={aeroTheme.styles.buttonPrimary}
                                >
                                    Publish Changes
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Editor */}
                {isEditing && (
                    <div style={{ marginBottom: '2rem' }}>
                        <DashboardBuilder
                            config={draftConfig}
                            onChange={setDraftConfig}
                        />
                    </div>
                )}

                {/* Stats Row */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem',
                    opacity: isEditing ? 0.7 : 1
                }}>
                    <StatCard title="Active Requests" value={totalActive} color={activeConfig.primaryColor} />
                    <StatCard title="Pending Action" value={pendingAction} color={aeroTheme.colors.warning} />
                    <StatCard title="Critical Items" value={critical} color={aeroTheme.colors.danger} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>

                    {/* Main Content Layout */}
                    <div style={{
                        ...aeroTheme.styles.glassPanel,
                        padding: '2.5rem',
                        opacity: isEditing ? 0.9 : 1,
                        border: isEditing ? '2px dashed var(--color-primary)' : aeroTheme.styles.glassPanel.border,
                        height: 'fit-content'
                    }}>

                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: `1px solid ${aeroTheme.colors.border}`, paddingBottom: '1.5rem' }}>
                            <div>
                                <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: activeConfig.primaryColor, letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>{activeConfig.title}</h1>
                                <p style={{ color: aeroTheme.colors.textMain, fontSize: '1.1rem', fontWeight: '500' }}>{activeConfig.subtitle}</p>
                            </div>
                            <button
                                onClick={() => navigate('/customer/request')}
                                style={{
                                    ...aeroTheme.styles.buttonPrimary,
                                    backgroundColor: activeConfig.primaryColor,
                                    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                }}
                            >
                                + Create New Request
                            </button>
                        </div>

                        {/* Welcome Banner */}
                        {activeConfig.showWelcome && (
                            <div style={{
                                background: 'rgba(255,255,255,0.5)',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                marginBottom: '2.5rem',
                                borderLeft: `6px solid ${activeConfig.primaryColor}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                boxShadow: 'inset 0 0 10px rgba(255,255,255,0.5)'
                            }}>
                                <span style={{ fontSize: '1.5rem' }}>👋</span>
                                <h3 style={{ margin: 0, color: aeroTheme.colors.textMain, fontWeight: 'bold', fontSize: '1.1rem' }}>{activeConfig.welcomeMessage}</h3>
                            </div>
                        )}

                        {/* List */}
                        {cases.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '4rem',
                                background: 'rgba(255,255,255,0.3)',
                                borderRadius: '12px',
                                border: `2px dashed ${aeroTheme.colors.border}`
                            }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🎫</div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: aeroTheme.colors.textMain }}>No active tickets</h3>
                                <p style={{ color: aeroTheme.colors.textSecondary, marginBottom: '1.5rem' }}>You don't have any open requests right now.</p>
                                <button onClick={() => navigate('/customer/request')} style={{ ...aeroTheme.styles.buttonPrimary, backgroundColor: activeConfig.primaryColor }}>Get Started</button>
                            </div>
                        ) : (
                            <div style={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${aeroTheme.colors.border}`, background: 'rgba(255,255,255,0.4)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: 'rgba(255,255,255,0.6)', borderBottom: `2px solid ${aeroTheme.colors.border}` }}>
                                        <tr>
                                            <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: aeroTheme.colors.textSecondary, fontWeight: 'bold' }}>Type</th>
                                            <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: aeroTheme.colors.textSecondary, fontWeight: 'bold' }}>Subject</th>
                                            <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: aeroTheme.colors.textSecondary, fontWeight: 'bold' }}>Status</th>
                                            <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: aeroTheme.colors.textSecondary, fontWeight: 'bold' }}>Priority</th>
                                            <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: aeroTheme.colors.textSecondary, fontWeight: 'bold' }}>Last Update</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cases.map((c, i) => (
                                            <tr key={c.id} style={{ borderBottom: `1px solid ${aeroTheme.colors.border}`, transition: 'background 0.2s', background: i % 2 === 0 ? 'rgba(255,255,255,0.2)' : 'transparent' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.6rem',
                                                        borderRadius: '6px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 'bold',
                                                        background: activeConfig.primaryColor + '20',
                                                        color: activeConfig.primaryColor,
                                                        border: `1px solid ${activeConfig.primaryColor}40`
                                                    }}>
                                                        {c.caseType || 'TICKET'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', fontWeight: 'bold', color: aeroTheme.colors.textMain }}>{c.title}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '999px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '600',
                                                        background: c.column?.color || '#e5e7eb',
                                                        color: '#fff',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                    }}>
                                                        {c.column?.name}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', fontWeight: '600', color: aeroTheme.colors.textMain }}>
                                                    {c.priority}
                                                </td>
                                                <td style={{ padding: '1rem', color: aeroTheme.colors.textSecondary, fontSize: '0.85rem', fontWeight: '500' }}>
                                                    {new Date(c.updatedAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Side Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Support Card */}
                        <div style={{ ...aeroTheme.styles.glassCard, padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: aeroTheme.colors.textMain, marginBottom: '1rem' }}>Your Care Team</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #e5e7eb, #ffffff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>👩‍💼</div>
                                <div>
                                    <div style={{ fontWeight: 'bold', color: aeroTheme.colors.textMain }}>Sarah Jenkins</div>
                                    <div style={{ fontSize: '0.8rem', color: aeroTheme.colors.textSecondary, fontWeight: '500' }}>Account Manager</div>
                                </div>
                            </div>
                            <button style={{ ...aeroTheme.styles.buttonPrimary, width: '100%', background: 'transparent', border: `2px solid ${aeroTheme.colors.primary}`, color: aeroTheme.colors.primary, boxShadow: 'none' }}>Contact Support</button>
                        </div>

                        {/* Recent Activity (Mock) */}
                        <div style={{ ...aeroTheme.styles.glassCard, padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: aeroTheme.colors.textMain, marginBottom: '1rem' }}>Recent Activity</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {[1, 2, 3].map(i => (
                                    <div key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.875rem' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: aeroTheme.colors.success, marginTop: '0.4rem', flexShrink: 0, boxShadow: '0 0 5px rgba(0,255,0,0.5)' }}></div>
                                        <div>
                                            <div style={{ color: aeroTheme.colors.textMain }}>Ticket #{1000 + i} updated</div>
                                            <div style={{ color: aeroTheme.colors.textSecondary, fontSize: '0.75rem' }}>2 hours ago</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div style={{ ...aeroTheme.styles.glassCard, padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: aeroTheme.colors.textMain, marginBottom: '1rem' }}>Quick Links</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {['📄 View Invoices', '📚 Knowledge Base', '⚙️ Account Settings'].map((link, i) => (
                                    <a key={i} href="#" style={{ color: activeConfig.primaryColor, fontWeight: '600', textDecoration: 'none', padding: '0.5rem', background: 'rgba(255,255,255,0.5)', borderRadius: '6px', fontSize: '0.9rem', border: `1px solid ${aeroTheme.colors.border}`, transition: 'all 0.2s' }}>{link}</a>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}

function StatCard({ title, value, color }: { title: string, value: number, color: string }) {
    return (
        <div style={{ ...aeroTheme.styles.glassCard, padding: '1.5rem', borderLeft: `4px solid ${color}` }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)', borderRadius: '16px 16px 0 0', pointerEvents: 'none' }} />
            <div style={{ fontSize: '0.875rem', color: aeroTheme.colors.textSecondary, fontWeight: 'bold', position: 'relative' }}>{title}</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: aeroTheme.colors.textMain, marginTop: '0.5rem', position: 'relative' }}>{value}</div>
        </div>
    );
}
