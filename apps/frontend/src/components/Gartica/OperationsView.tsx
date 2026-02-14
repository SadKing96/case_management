import { useState, useEffect } from 'react';
import { apiClient as api } from '../../api/client';
import { aeroTheme } from './garticaGlobals';

interface OperationMetric {
    id: string;
    label: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
    status: 'good' | 'warning' | 'critical';
}

interface ExpediteItem {
    id: string;
    orderId: string;
    customer: string;
    delayReason: string;
    daysDelayed: number;
    priority: number;
}

interface AiStatus {
    status: string;
    summary: string;
}

export function OperationsView() {
    const [metrics, setMetrics] = useState<OperationMetric[]>([]);
    const [expediteList, setExpediteList] = useState<ExpediteItem[]>([]);
    const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [metricsRes, expediteRes, aiRes] = await Promise.all([
                api.get<OperationMetric[]>('/gartica/operations/metrics'),
                api.get<ExpediteItem[]>('/gartica/operations/expedite'),
                api.get<AiStatus>('/gartica/operations/ai-status')
            ]);
            setMetrics(metricsRes);
            setExpediteList(expediteRes);
            setAiStatus(aiRes);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'good': return aeroTheme.colors.success;
            case 'warning': return aeroTheme.colors.warning;
            case 'critical': return aeroTheme.colors.danger;
            default: return aeroTheme.colors.textSecondary;
        }
    };

    return (
        <div style={aeroTheme.styles.container}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: aeroTheme.colors.primaryDark }}>Operations Control Tower</h1>
                    <p style={{ color: aeroTheme.colors.textSecondary }}>Supply Chain & Logistics Oversight</p>
                </div>
                {/* AI Status Badge */}
                {aiStatus && (
                    <div style={{
                        ...aeroTheme.styles.glassCard,
                        padding: '0.8rem 1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.8rem',
                        borderLeft: '4px solid #8b5cf6', // Purple accent
                        animation: 'pulse 2s infinite'
                    }}>
                        <div style={{ fontSize: '1.5rem' }}>✨</div>
                        <div>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#8b5cf6', fontWeight: 'bold' }}>AI System Status: {aiStatus.status}</div>
                            <div style={{ fontSize: '0.9rem', color: aeroTheme.colors.textMain, maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {aiStatus.summary}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                {loading ? (
                    <div style={{ color: aeroTheme.colors.textSecondary, gridColumn: '1/-1', textAlign: 'center' }}>Loading operations data...</div>
                ) : metrics.map(m => (
                    <div key={m.id} style={{ ...aeroTheme.styles.glassCard, padding: '1.5rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', color: aeroTheme.colors.textSecondary, marginBottom: '0.5rem' }}>{m.label}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: getStatusColor(m.status), marginBottom: '0.5rem' }}>{m.value}</div>
                        <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: m.trend === 'up' ? aeroTheme.colors.success : m.trend === 'down' ? aeroTheme.colors.danger : aeroTheme.colors.textSecondary }}>
                            {m.trend === 'up' ? '▲' : m.trend === 'down' ? '▼' : '▬'} Trend
                        </div>
                    </div>
                ))}
            </div>

            {/* Expediting Watchlist */}
            <div style={{ ...aeroTheme.styles.glassPanel, padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontWeight: 'bold', color: aeroTheme.colors.textMain, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🚨 Expedite Watchlist
                        <span style={{ fontSize: '0.9rem', background: aeroTheme.colors.danger, color: 'white', padding: '2px 8px', borderRadius: '12px' }}>{expediteList.length}</span>
                    </h3>
                    <button style={{ ...aeroTheme.styles.buttonPrimary, fontSize: '0.9rem' }}>Generate Report</button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: aeroTheme.colors.textMain }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: `2px solid ${aeroTheme.colors.border}`, color: aeroTheme.colors.textSecondary }}>
                                <th style={{ padding: '1rem' }}>Order ID</th>
                                <th style={{ padding: '1rem' }}>Customer</th>
                                <th style={{ padding: '1rem' }}>Delay Reason</th>
                                <th style={{ padding: '1rem' }}>Days Late</th>
                                <th style={{ padding: '1rem' }}>Priority</th>
                                <th style={{ padding: '1rem' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expediteList.map(item => (
                                <tr key={item.id} style={{ borderBottom: `1px solid ${aeroTheme.colors.border}` }}>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.orderId}</td>
                                    <td style={{ padding: '1rem' }}>{item.customer}</td>
                                    <td style={{ padding: '1rem' }}>{item.delayReason}</td>
                                    <td style={{ padding: '1rem', color: aeroTheme.colors.danger, fontWeight: 'bold' }}>+{item.daysDelayed} Days</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{
                                            width: '100px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden'
                                        }}>
                                            <div style={{ width: `${item.priority}%`, height: '100%', background: `linear-gradient(90deg, ${aeroTheme.colors.warning}, ${aeroTheme.colors.danger})` }} />
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button style={{
                                            padding: '0.4rem 0.8rem', borderRadius: '6px', border: `1px solid ${aeroTheme.colors.secondary}`,
                                            background: 'transparent', color: aeroTheme.colors.secondary, cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = aeroTheme.colors.secondary; e.currentTarget.style.color = 'white'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = aeroTheme.colors.secondary; }}
                                        >
                                            Escalate
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
