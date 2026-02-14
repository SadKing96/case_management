import { useState, useEffect } from 'react';
import { apiClient as api } from '../../api/client';
import { aeroTheme } from './garticaGlobals';

interface Customer360 {
    id: string;
    name: string;
    revenue: string;
    healthScore: number;
    churnRisk: 'Low' | 'Medium' | 'High' | 'Critical';
    openCases: number;
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    insights: string[];
}

export function CustomerHeatmapView() {
    const [customers, setCustomers] = useState<Customer360[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer360 | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get<Customer360[]>('/gartica/customer-360');
                setCustomers(res);
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Failed to load customer data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getHealthColor = (score: number) => {
        if (score >= 90) return aeroTheme.colors.success; // Green
        if (score >= 70) return '#84cc16'; // Lime
        if (score >= 50) return aeroTheme.colors.warning; // Yellow
        if (score >= 30) return '#f97316'; // Orange
        return aeroTheme.colors.danger; // Red
    };

    if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: aeroTheme.colors.danger }}>Error: {error}</div>;
    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: aeroTheme.colors.textSecondary }}>Analyzing account health...</div>;

    return (
        <div style={aeroTheme.styles.container}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem', color: aeroTheme.colors.textMain, textShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}>Customer 360 Heatmap</h1>
            <p style={{ color: aeroTheme.colors.textMain, opacity: 0.8, marginBottom: '2rem', fontWeight: '500' }}>Predictive Churn Analysis & Account Health</p>

            {/* Heatmap Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {customers.map(c => (
                    <div
                        key={c.id}
                        onClick={() => setSelectedCustomer(c)}
                        style={{
                            ...aeroTheme.styles.glassCard,
                            // Override background for heatmap effect but keep glass properties
                            background: `linear-gradient(135deg, ${getHealthColor(c.healthScore)}cc 0%, ${getHealthColor(c.healthScore)}99 100%)`,
                            color: '#0f172a', // Dark text (Slate 900) for contrast
                            padding: '1.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            height: '180px',
                            transition: 'transform 0.2s',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.3)',
                            border: '1px solid rgba(255,255,255,0.4)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <div style={aeroTheme.styles.glossOverlay} />
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ fontWeight: '800', fontSize: '1.3rem', textShadow: '0 1px 0 rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>{c.name}</div>
                            <div style={{ fontSize: '1rem', opacity: 0.9, fontWeight: '700', marginTop: '4px' }}>{c.revenue} ARR</div>
                        </div>

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ fontSize: '3.5rem', fontWeight: 'bold', opacity: 0.15, position: 'absolute', bottom: '-15px', right: '5px', color: '#000' }}>
                                {c.healthScore}
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '800', marginTop: '1rem', background: 'rgba(255,255,255,0.5)', padding: '6px 10px', borderRadius: '6px', width: 'fit-content', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.4)', color: '#0f172a', textShadow: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                {c.churnRisk.toUpperCase()} RISK
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detail Modal */}
            {selectedCustomer && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setSelectedCustomer(null)}>
                    <div style={{ ...aeroTheme.styles.glassPanel, width: '600px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: aeroTheme.colors.primaryDark }}>{selectedCustomer.name}</h2>
                            <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: aeroTheme.colors.textSecondary, lineHeight: 1 }}>&times;</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <StatCard label="Health Score" value={selectedCustomer.healthScore.toString()} color={getHealthColor(selectedCustomer.healthScore)} />
                            <StatCard label="Open Cases" value={selectedCustomer.openCases.toString()} />
                            <StatCard label="Revenue" value={selectedCustomer.revenue} />
                            <StatCard label="Sentiment" value={selectedCustomer.sentiment} />
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.5)', padding: '1rem', borderRadius: '8px', border: `1px solid ${aeroTheme.colors.border}` }}>
                            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: aeroTheme.colors.textSecondary, marginBottom: '0.5rem', fontWeight: 'bold' }}>AI Insights & Risk Factors</h3>
                            <ul style={{ paddingLeft: '1.2rem', lineHeight: '1.6', color: aeroTheme.colors.textMain }}>
                                {selectedCustomer.insights.map((insight, i) => (
                                    <li key={i}>{insight}</li>
                                ))}
                            </ul>
                        </div>

                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', border: `1px solid ${aeroTheme.colors.border}`, background: 'rgba(255,255,255,0.5)', cursor: 'pointer', color: aeroTheme.colors.textMain }} onClick={() => setSelectedCustomer(null)}>Close</button>
                            <button style={aeroTheme.styles.buttonPrimary}>View Account Profile</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, color }: { label: string, value: string, color?: string }) {
    return (
        <div style={{ padding: '1rem', border: `1px solid ${aeroTheme.colors.border}`, borderRadius: '8px', textAlign: 'center', background: 'rgba(255,255,255,0.4)' }}>
            <div style={{ fontSize: '0.8rem', color: aeroTheme.colors.textSecondary }}>{label}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: color || aeroTheme.colors.textMain }}>{value}</div>
        </div>
    );
}
