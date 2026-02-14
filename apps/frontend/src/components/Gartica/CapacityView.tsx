import { useState, useEffect } from 'react';
import { apiClient as api } from '../../api/client';
import { aeroTheme } from './garticaGlobals';

interface Employee {
    id: string;
    name: string;
    role: string;
    productivityScore: number;
    capacity: number;
}

interface PipelineDeal {
    id: string;
    name: string;
    probability: number;
    closeDate: number;
    volumeImpact: number;
}

interface ForecastData {
    employees: Employee[];
    pipelineDeals: PipelineDeal[];
    forecast: {
        dates: string[];
        projectedWorkload: number[];
        teamCapacity: number[];
    };
    aiInsight: {
        text: string;
        severity: 'low' | 'medium' | 'high';
    };
}

export function CapacityView() {
    const [horizon, setHorizon] = useState(30);
    const [data, setData] = useState<ForecastData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [horizon]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get<ForecastData>(`/gartica/capacity/forecast?horizon=${horizon}`);
            setData(res);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to load capacity data");
        } finally {
            setLoading(false);
        }
    };

    if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: aeroTheme.colors.danger }}>Error: {error}</div>;
    if (loading || !data) return <div style={{ padding: '2rem', textAlign: 'center', color: aeroTheme.colors.textSecondary }}>Loading predictive models...</div>;

    const maxVal = Math.max(...data.forecast.projectedWorkload, ...data.forecast.teamCapacity) * 1.1;

    return (
        <div style={aeroTheme.styles.container}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: aeroTheme.colors.textMain, textShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}>
                        Capacity Planning
                    </h1>
                    <p style={{ color: aeroTheme.colors.textMain, opacity: 0.8, fontWeight: '500' }}>
                        Employee Productivity & Pipeline Intelligence
                    </p>
                </div>
                <div style={aeroTheme.styles.glassCard} className="px-4 py-2 flex items-center gap-2">
                    <label style={{ color: aeroTheme.colors.textMain }}>Horizon:</label>
                    <select
                        value={horizon}
                        onChange={(e) => setHorizon(Number(e.target.value))}
                        style={{
                            padding: '0.5rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.5)',
                            background: 'rgba(255,255,255,0.2)',
                            color: aeroTheme.colors.textMain,
                            cursor: 'pointer'
                        }}
                    >
                        <option value={30}>30 Days</option>
                        <option value={60}>60 Days</option>
                        <option value={90}>90 Days</option>
                    </select>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* 1. Team Pulse */}
                <div style={{ ...aeroTheme.styles.glassPanel, padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: aeroTheme.colors.primaryDark, fontWeight: 'bold' }}>Team Pulse: Productivity & Capacity</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {data.employees.map(emp => {
                            const scoreColor = emp.productivityScore >= 90 ? aeroTheme.colors.success :
                                emp.productivityScore >= 75 ? '#facc15' : aeroTheme.colors.danger;

                            return (
                                <div key={emp.id} style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${aeroTheme.colors.border}`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center'
                                }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: '0.5rem', fontWeight: 'bold', color: 'white'
                                    }}>
                                        {emp.name.charAt(0)}
                                    </div>
                                    <div style={{ fontWeight: 'bold', color: aeroTheme.colors.textMain }}>{emp.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: aeroTheme.colors.textSecondary, marginBottom: '0.5rem' }}>{emp.role}</div>

                                    <div style={{ width: '100%', marginBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: aeroTheme.colors.textMain }}>
                                            <span>Prod. Score</span>
                                            <span style={{ color: scoreColor, fontWeight: 'bold' }}>{emp.productivityScore}%</span>
                                        </div>
                                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '2px' }}>
                                            <div style={{ width: `${emp.productivityScore}%`, height: '100%', background: scoreColor, borderRadius: '2px' }} />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: aeroTheme.colors.textMain }}>
                                        Cap: <strong>{emp.capacity}</strong> /day
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Forecast Chart */}
                <div style={{ ...aeroTheme.styles.glassPanel, padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '1rem' }}>
                        <h3 style={{ color: aeroTheme.colors.primaryDark, fontWeight: 'bold', margin: 0 }}>Pipeline Impact Analysis</h3>
                        <div style={{ fontSize: '0.9rem', color: aeroTheme.colors.textSecondary }}>
                            Comparing <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>Projected Workload</span> vs <span style={{ color: '#10b981', fontWeight: 'bold' }}>Effective Capacity</span>
                        </div>
                    </div>

                    <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '2px', paddingBottom: '20px', borderBottom: `1px solid ${aeroTheme.colors.border}`, position: 'relative' }}>
                        {data.forecast.dates.map((date, i) => {
                            const workload = data.forecast.projectedWorkload[i];
                            const capacity = data.forecast.teamCapacity[i];
                            const workloadHeight = (workload / maxVal) * 100;
                            const capacityHeight = (capacity / maxVal) * 100;

                            const isOverloaded = workload > capacity;

                            return (
                                <div key={i} style={{ flex: 1, height: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', group: 'params' } as any}>

                                    {/* Workload Bar */}
                                    <div
                                        className="hover-bar"
                                        title={`${date}: Load ${workload} vs Cap ${capacity}`}
                                        style={{
                                            width: '100%',
                                            height: `${workloadHeight}%`,
                                            background: isOverloaded ? `linear-gradient(to top, #ef4444, #f87171)` : `linear-gradient(to top, #8b5cf6, #c084fc)`,
                                            opacity: 0.8,
                                            borderRadius: '2px',
                                            transition: 'height 0.3s',
                                            cursor: 'pointer'
                                        }}
                                    />

                                    {/* Capacity Line Marker (Absolute) */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: `${capacityHeight}%`,
                                        left: 0,
                                        width: '100%',
                                        height: '2px',
                                        background: '#10b981',
                                        zIndex: 10,
                                        opacity: 0.8
                                    }} />

                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 3. AI Forecast Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                    {/* Insights */}
                    <div style={{ ...aeroTheme.styles.glassPanel, padding: '1.5rem', borderLeft: `4px solid ${data.aiInsight.severity === 'high' ? aeroTheme.colors.danger : data.aiInsight.severity === 'medium' ? '#facc15' : aeroTheme.colors.success}` }}>
                        <h3 style={{ marginBottom: '0.5rem', color: aeroTheme.colors.textMain, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>✨</span> AI Capacity Forecast
                        </h3>
                        <p style={{ fontSize: '1.1rem', color: aeroTheme.colors.textMain, lineHeight: '1.5' }}>
                            {data.aiInsight.text}
                        </p>
                    </div>

                    {/* Pipeline Deals List (Legend/Context) */}
                    <div style={{ ...aeroTheme.styles.glassPanel, padding: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem', color: aeroTheme.colors.textSecondary, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Incoming Pipeline</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {data.pipelineDeals.map(deal => (
                                <div key={deal.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: aeroTheme.colors.textMain }}>
                                    <span>{deal.name}</span>
                                    <span style={{
                                        padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem',
                                        background: 'rgba(255,255,255,0.1)',
                                        color: deal.probability > 0.7 ? aeroTheme.colors.success : '#facc15'
                                    }}>
                                        {Math.round(deal.probability * 100)}% Prob.
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
