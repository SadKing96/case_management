import { useState, useEffect } from 'react';
import { apiClient as api } from '../../api/client';
import { aeroTheme } from './garticaGlobals';

interface Employee {
    id: string;
    name: string;
    role: string;
    avatar: string;
    performanceScore: number;
    csat: number;
    avgResolutionTime: string;
    casesHandled: number;
    status: 'Online' | 'Offline' | 'Busy';
}

export function EmployeePerformanceView() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await api.get<Employee[]>('/gartica/employee-performance');
                setEmployees(res);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Online': return aeroTheme.colors.success;
            case 'Busy': return aeroTheme.colors.danger;
            default: return aeroTheme.colors.textSecondary;
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: aeroTheme.colors.textSecondary }}>Loading team metrics...</div>;

    const topPerformer = employees.reduce((prev, current) => (prev.performanceScore > current.performanceScore) ? prev : current, employees[0]);
    const avgCsat = (employees.reduce((acc, curr) => acc + curr.csat, 0) / (employees.length || 1)).toFixed(1);

    return (
        <div style={aeroTheme.styles.container}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: aeroTheme.colors.primaryDark }}>Team Performance</h1>
                <p style={{ color: aeroTheme.colors.textSecondary }}>Real-time agent metrics & KPI tracking</p>
            </div>

            {/* Top Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <MetricCard title="Active Agents" value={employees.filter(e => e.status !== 'Offline').length.toString()} subtext="Online or Busy" color={aeroTheme.colors.success} icon="🟢" />
                <MetricCard title="Team Avg CSAT" value={avgCsat} subtext="Target: 4.8" color={aeroTheme.colors.primary} icon="⭐" />
                <MetricCard title="Top Performer" value={topPerformer?.name || '-'} subtext={`${topPerformer?.performanceScore || 0}% Efficiency`} color={aeroTheme.colors.warning} icon="🏆" />
                <MetricCard title="Total Cases Today" value={employees.reduce((acc, c) => acc + c.casesHandled, 0).toString()} subtext="Across all agents" color={aeroTheme.colors.info} icon="📊" />
            </div>

            {/* Team List Table */}
            <div style={{ ...aeroTheme.styles.glassPanel, padding: '1.5rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginBottom: '1rem', fontWeight: 'bold', color: aeroTheme.colors.textMain }}>Agent Roster</h3>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: aeroTheme.colors.textMain }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)', fontWeight: 'bold', color: aeroTheme.colors.textSecondary, textAlign: 'left' }}>
                            <tr>
                                <th style={{ padding: '1rem', borderBottom: `1px solid ${aeroTheme.colors.border}` }}>Agent</th>
                                <th style={{ padding: '1rem', borderBottom: `1px solid ${aeroTheme.colors.border}` }}>Role</th>
                                <th style={{ padding: '1rem', borderBottom: `1px solid ${aeroTheme.colors.border}` }}>Status</th>
                                <th style={{ padding: '1rem', borderBottom: `1px solid ${aeroTheme.colors.border}` }}>Efficiency</th>
                                <th style={{ padding: '1rem', borderBottom: `1px solid ${aeroTheme.colors.border}` }}>CSAT</th>
                                <th style={{ padding: '1rem', borderBottom: `1px solid ${aeroTheme.colors.border}` }}>Avg Res Time</th>
                                <th style={{ padding: '1rem', borderBottom: `1px solid ${aeroTheme.colors.border}` }}>Cases</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => (
                                <tr key={emp.id} style={{ borderBottom: `1px solid ${aeroTheme.colors.border}`, transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '50%', background: '#e2e8f0',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                                            border: `2px solid white`, boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}>
                                            {emp.avatar}
                                        </div>
                                        <span style={{ fontWeight: 'bold' }}>{emp.name}</span>
                                    </td>
                                    <td style={{ padding: '1rem', color: aeroTheme.colors.textSecondary }}>{emp.role}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(emp.status) }} />
                                            {emp.status}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', width: '80px' }}>
                                                <div style={{ height: '100%', borderRadius: '3px', background: emp.performanceScore > 90 ? aeroTheme.colors.success : emp.performanceScore > 75 ? aeroTheme.colors.warning : aeroTheme.colors.danger, width: `${emp.performanceScore}%` }} />
                                            </div>
                                            <span style={{ fontSize: '0.9rem' }}>{emp.performanceScore}%</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{emp.csat}</td>
                                    <td style={{ padding: '1rem' }}>{emp.avgResolutionTime}</td>
                                    <td style={{ padding: '1rem' }}>{emp.casesHandled}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, subtext, color, icon }: { title: string, value: string, subtext: string, color: string, icon: string }) {
    return (
        <div style={{ ...aeroTheme.styles.glassCard, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
                width: '3rem', height: '3rem', borderRadius: '50%', background: 'rgba(255,255,255,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                boxShadow: 'inset 0 0 10px rgba(255,255,255,0.8), 0 4px 6px rgba(0,0,0,0.1)'
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: '0.9rem', color: aeroTheme.colors.textSecondary }}>{title}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: color }}>{value}</div>
                <div style={{ fontSize: '0.8rem', color: aeroTheme.colors.textSecondary, opacity: 0.8 }}>{subtext}</div>
            </div>
        </div>
    );
}
