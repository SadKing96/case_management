import { useState, useEffect } from 'react';
import { apiClient as api } from '../../api/client';
import { aeroTheme } from './garticaGlobals';

interface DailyStats {
    id: string;
    name: string;
    role: string;
    stats: {
        emailsSent: number;
        notesAdded: number;
        casesClosed: number;
        casesCreated: number;
    }
}

export function DailyActivityView() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [stats, setStats] = useState<DailyStats[]>([]);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        fetchStats();
    }, [date]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await api.get<DailyStats[]>(`/gartica/daily-activity?date=${date}`);
            setStats(res);
            setAnalysis(null);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const runAnalysis = async () => {
        setAnalyzing(true);
        try {
            const res = await api.post<{ analysis: string }>('/gartica/analyze-day', { date, stats });
            setAnalysis(res.analysis);
        } catch (err) {
            console.error(err);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div style={{ ...aeroTheme.styles.container, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div className="header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: aeroTheme.colors.primaryDark }}>Daily Activity</h1>
                    <p style={{ color: aeroTheme.colors.textSecondary }}>Employee performance summary</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        style={aeroTheme.styles.input}
                    />
                    <button
                        onClick={runAnalysis}
                        disabled={analyzing || stats.length === 0}
                        style={{
                            ...aeroTheme.styles.buttonPrimary,
                            opacity: analyzing || stats.length === 0 ? 0.5 : 1
                        }}
                    >
                        {analyzing ? 'Analyzing...' : '🤖 AI Analyze'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flex: 1, overflow: 'hidden' }}>
                <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', alignContent: 'start', paddingRight: '0.5rem' }}>
                    {loading ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: aeroTheme.colors.textSecondary }}>Loading activity data...</div>
                    ) : stats.map(user => (
                        <div key={user.id} style={{ ...aeroTheme.styles.glassCard, padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: aeroTheme.colors.textMain }}>{user.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: aeroTheme.colors.textSecondary }}>{user.role}</div>
                                </div>
                                <div style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>👤</div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <StatItem label="Emails Sent" value={user.stats.emailsSent} icon="📧" />
                                <StatItem label="Notes Added" value={user.stats.notesAdded} icon="📝" />
                                <StatItem label="Cases Closed" value={user.stats.casesClosed} icon="✅" />
                                <StatItem label="Cases Created" value={user.stats.casesCreated} icon="🆕" />
                            </div>
                        </div>
                    ))}
                </div>

                {analysis && (
                    <div style={{ ...aeroTheme.styles.glassPanel, width: '400px', padding: '1.5rem', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: aeroTheme.colors.primaryDark }}>
                            <span>🤖</span> AI Analysis
                        </h3>
                        <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6', fontSize: '0.95rem', color: aeroTheme.colors.textMain }}>
                            {analysis}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatItem({ label, value, icon }: { label: string, value: number, icon: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: aeroTheme.colors.textSecondary }}>{label}</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', color: aeroTheme.colors.textMain }}>
                <span style={{ fontSize: '1rem' }}>{icon}</span> {value}
            </div>
        </div>
    );
}
