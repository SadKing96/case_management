import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import '../../styles/dashboard.css';
import { aeroTheme } from './garticaGlobals';
import { useGartica } from '../../context/GarticaContext';

interface Insight {
    id: string;
    type: 'anomaly' | 'sentiment' | 'performance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    timestamp: string;
}

interface Stats {
    activeAnomalies: number;
    monitoredEmails: number;
    resolutionRate: number;
    customerSentimentScore: number;
}

const MODULES = [
    { name: 'Golden Thread', icon: '🧵', path: '/gartica/golden-thread', desc: 'End-to-end case visualization' },
    { name: 'Operations', icon: '⚙️', path: '/gartica/operations', desc: 'Efficiency & workflow tracking' },
    { name: 'Aftermarket', icon: '🔄', path: '/gartica/aftermarket', desc: 'Returns & warranty support' },
    { name: 'ERP Connect', icon: '🏢', path: '/gartica/erp', desc: 'Syteline integration status' },
    { name: 'Performance', icon: '📊', path: '/gartica/performance', desc: 'Employee productivity metrics' },
    { name: 'Daily Activity', icon: '📅', path: '/gartica/daily-activity', desc: 'Day-to-day work logs' },
    { name: 'Capacity Plan', icon: '📉', path: '/gartica/capacity', desc: 'Resource forecasting' },
    { name: 'Compliance', icon: '🛡️', path: '/gartica/compliance', desc: 'Risk & Sentinel analysis' },
    { name: 'Knowledge Nexus', icon: '🔮', path: '/gartica/knowledge', desc: 'Semantic search engine' },
    { name: 'Process Mining', icon: '⛓️', path: '/gartica/process/mining', desc: 'Workflow bottleneck detection' },
    { name: 'Customer 360', icon: '🎯', path: '/gartica/customer-360', desc: 'Churn risk heatmap' },
    { name: 'Customer Portal', icon: '🌐', path: '/gartica/portal', desc: 'Client Request Submission' },
    { name: 'Client Dashboard', icon: '👤', path: '/gartica/client-dashboard', desc: 'My Tickets View' },
];

export function GarticaDashboard() {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { order, moveModule } = useGartica();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Parallel data fetching
                const [insightsRes, statsRes] = await Promise.all([
                    apiClient.get('/gartica/insights').catch(() => []), // Fallback empty
                    apiClient.get('/gartica/stats').catch(() => null)
                ]);
                setInsights(insightsRes as any || []);
                setStats(statsRes as any);
            } catch (err) {
                console.error("Failed to fetch Gartica data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8" style={{ color: aeroTheme.colors.primary }}>Initializing Eco-System...</div>;

    return (
        <div style={aeroTheme.styles.container}>

            {/* Dramatic Solid Header */}
            <div style={{
                marginBottom: '3rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <div style={aeroTheme.styles.headerPill}>
                    <h1 style={{
                        fontSize: '3rem',
                        fontWeight: 'bold',
                        color: '#0077b6',
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '2px', // Open up the tracking
                        background: 'linear-gradient(180deg, #0088cc 0%, #005580 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 2px 0px rgba(255,255,255,0.5))'
                    }}>
                        Gartica Intelligence
                    </h1>
                </div>

                <p style={{
                    color: '#446688',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    letterSpacing: '1px'
                }}>
                    Seamless Intelligence for a <span style={{ color: '#008844' }}>Connected Leader</span>.
                </p>
            </div>

            {/* Module Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '1.5rem',
                marginBottom: '4rem'
            }}>
                {order.map((key, index) => {
                    const mod = MODULES.find(m => {
                        // Map internal keys to module paths/names if needed.
                        // Our keys in context are: 'golden-thread', 'operations', etc.
                        // Our module paths are: '/gartica/golden-thread', etc.
                        // Let's match by path suffix or create a map.
                        if (key === 'golden-thread') return m.path.includes('golden-thread');
                        if (key === 'operations') return m.path.includes('operations');
                        if (key === 'aftermarket') return m.path.includes('aftermarket');
                        if (key === 'erp') return m.path.includes('erp');
                        if (key === 'performance') return m.path.includes('performance');
                        if (key === 'daily-activity') return m.path.includes('daily-activity');
                        if (key === 'capacity') return m.path.includes('capacity');
                        if (key === 'compliance') return m.path.includes('compliance');
                        if (key === 'knowledge') return m.path.includes('knowledge');
                        if (key === 'process-mining') return m.path.includes('mining'); // path is /process/mining
                        if (key === 'customer-360') return m.path.includes('customer-360');
                        if (key === 'customer-portal') return m.path.includes('portal');
                        if (key === 'client-dashboard') return m.path.includes('client-dashboard');
                        return false;
                    });

                    if (!mod) return null;

                    return (
                        <div
                            key={key}
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData("text/plain", key);
                                // Optional: lighter drag image
                            }}
                            onDragOver={(e) => {
                                e.preventDefault(); // Verify drop allowed
                                e.dataTransfer.dropEffect = "move";
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                const draggedKey = e.dataTransfer.getData("text/plain");
                                if (draggedKey && draggedKey !== key) {
                                    moveModule(draggedKey, key);
                                }
                            }}
                            onClick={() => navigate(mod.path)}
                            style={{
                                ...aeroTheme.styles.glassCard,
                                padding: '1.5rem',
                                cursor: 'grab',
                                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 12px 24px rgba(50, 150, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 1)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.boxShadow = aeroTheme.styles.glassCard.boxShadow as string;
                            }}
                        >
                            <div style={aeroTheme.styles.glossOverlay} />

                            <div style={aeroTheme.styles.orb}>
                                <span style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))' }}>
                                    {mod.icon}
                                </span>
                            </div>

                            <div style={{
                                fontWeight: 'bold',
                                fontSize: '1.1rem',
                                color: aeroTheme.colors.textMain,
                                marginBottom: '0.5rem',
                                position: 'relative',
                                letterSpacing: '0.5px'
                            }}>
                                {mod.name}
                            </div>
                            <div style={{
                                fontSize: '0.85rem',
                                color: aeroTheme.colors.textSecondary,
                                fontWeight: '500',
                                lineHeight: '1.4',
                                position: 'relative'
                            }}>
                                {mod.desc}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Stats & Analytics */}
            <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: aeroTheme.colors.primaryDark, paddingLeft: '0.5rem', borderLeft: '4px solid #88dd88' }}>
                System Vitals
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <StatCard label="Active Anomalies" value={stats?.activeAnomalies} icon="🚨" color="#ff6b6b" />
                <StatCard label="Emails Monitored" value={stats?.monitoredEmails} icon="📧" color="#4dabf7" />
                <StatCard label="Resolution Rate" value={`${stats?.resolutionRate}%`} icon="✅" color="#51cf66" />
                <StatCard label="Sentiment Score" value={`${stats?.customerSentimentScore}/10`} icon="😊" color="#fcc419" />
            </div>

            {/* Live Insights */}
            <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: aeroTheme.colors.primaryDark, paddingLeft: '0.5rem', borderLeft: '4px solid #88dd88' }}>
                Live Stream
            </h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
                {insights.map(insight => (
                    <div key={insight.id} style={{
                        ...aeroTheme.styles.glassCard,
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        // Slight tint based on severity
                        backgroundColor: `rgba(255,255,255,0.7)`
                    }}>
                        <div style={aeroTheme.styles.glossOverlay} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{
                                    textTransform: 'uppercase',
                                    fontSize: '0.7rem',
                                    fontWeight: '800',
                                    color: 'white',
                                    background: `linear-gradient(135deg, ${getSeverityColor(insight.severity)}, ${adjustColor(getSeverityColor(insight.severity), -20)})`,
                                    padding: '0.25rem 0.6rem',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}>
                                    {insight.type}
                                </span>
                                <span style={{ fontWeight: '700', fontSize: '1.05rem', color: aeroTheme.colors.textMain }}>{insight.title}</span>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: aeroTheme.colors.textSecondary }}>
                                {new Date(insight.timestamp).toLocaleString()}
                            </span>
                        </div>
                        <p style={{ color: aeroTheme.colors.textSecondary, lineHeight: '1.5', margin: 0, position: 'relative' }}>{insight.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, color }: { label: string, value: any, icon: string, color: string }) {
    return (
        <div style={{
            ...aeroTheme.styles.glassCard,
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
        }}>
            <div style={aeroTheme.styles.glossOverlay} />
            <div style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '50%',
                background: `radial-gradient(circle at 30% 30%, ${color}20 0%, ${color}40 100%)`,
                border: `1px solid ${color}60`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                position: 'relative',
                boxShadow: `inset 0 0 10px ${color}20`
            }}>
                {icon}
            </div>
            <div style={{ position: 'relative' }}>
                <div style={{ fontSize: '0.9rem', color: aeroTheme.colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: aeroTheme.colors.textMain }}>{value}</div>
            </div>
        </div>
    );
}

function getSeverityColor(severity: string) {
    switch (severity) {
        case 'critical': return '#dc3545'; // bright red
        case 'high': return '#fd7e14'; // orange
        case 'medium': return '#ffc107'; // yellow
        case 'low': return '#28a745'; // green
        default: return '#6c757d';
    }
}

// Simple helper to darken hex color for gradients
function adjustColor(color: string, amount: number) {
    return color; // Placeholder, real implementation would handle hex parsing
}
