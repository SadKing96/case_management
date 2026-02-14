import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Case } from '../../../../packages/shared/src/types';
import '../styles/layout.css';

interface CaseWithDetails extends Case {
    board: { id: string; name: string; slug: string; color: string };
    column: { id: string; name: string; color: string };
    assignee?: { id: string; name: string; email: string };
}

export function LeadershipDashboard() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<CaseWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTickets = async () => {
        try {
            const data = await apiClient.get<CaseWithDetails[]>('/cases?active=true');
            // Sort by most recent updates
            const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setTickets(sorted);
        } catch (err) {
            console.error(err);
            setError('Failed to load cases');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading leadership metrics...</div>;
    if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-danger)' }}>{error}</div>;

    const MetricCard = ({ title, value, subtext, trend, color = 'var(--color-primary)' }: any) => (
        <div style={{
            background: 'var(--color-bg-surface)',
            padding: '1.25rem',
            borderRadius: '0.75rem',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
        }}>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                {title}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-text-main)' }}>{value}</div>
                {trend && <div style={{ fontSize: '0.8rem', fontWeight: '600', color: trend.startsWith('+') ? 'var(--color-success)' : 'var(--color-danger)' }}>{trend}</div>}
            </div>
            {subtext && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>{subtext}</div>}
            <div style={{ height: '4px', background: color, borderRadius: '2px', marginTop: '1rem', opacity: 0.5 }}></div>
        </div>
    );

    return (
        <div style={{ padding: '2rem', width: '100%', boxSizing: 'border-box', color: 'var(--color-text-main)' }}>

            {/* HERODER */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem' }}>Executive Command Center</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Real-time operational & financial intelligence.</p>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* TOP METRICS ROW (Financial & Operational) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <MetricCard title="Pipeline Value" value="$4.2M" trend="+12%" subtext="Active Quotes" color="#10b981" />
                <MetricCard title="Closed Revenue (Q1)" value="$1.8M" trend="+5%" subtext="vs Target $1.5M" color="#10b981" />
                <MetricCard title="Avg Resolution Time" value="3.2 Days" trend="-8%" subtext="Improving" color="#3b82f6" />
                <MetricCard title="Active Escalations" value="5" trend="+1" subtext="Requires Attention" color="#d946ef" />
                <MetricCard title="Order Accuracy" value="98.5%" trend="-0.2%" subtext="Below 99% Goal" color="#f59e0b" />
            </div>

            {/* AI INTELLIGENCE GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>

                {/* COLUMN 1: SENTIMENT & COMMUNICATION RISKS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Search/Ask AI Title */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>🧠</span> Sentiment & Engagement
                        </h2>
                    </div>

                    {/* Risk Radar */}
                    <div style={{
                        background: 'var(--color-bg-surface)',
                        padding: '1.5rem',
                        borderRadius: '1rem',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--color-danger)', textTransform: 'uppercase' }}>
                            📡 Risk Radar
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', borderLeft: '3px solid var(--color-danger)' }}>
                                <div style={{ fontWeight: '700', color: '#b91c1c', marginBottom: '0.25rem', fontSize: '0.9rem' }}>High Frustration Detected</div>
                                <div style={{ fontSize: '0.85rem', color: '#7f1d1d' }}>
                                    Customer <strong>TechGlobal</strong> used aggressive language in <em>Ticket #442</em> ("unacceptable", "cancel").
                                </div>
                            </div>
                            <div style={{ padding: '0.75rem', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '0.5rem', borderLeft: '3px solid #f97316' }}>
                                <div style={{ fontWeight: '700', color: '#c2410c', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Unanswered Inquiries</div>
                                <div style={{ fontSize: '0.85rem', color: '#7c2d12' }}>
                                    <strong>Acme Corp</strong> has followed up 3 times on <em>Order #9921</em> with no reply &gt; 48hrs.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Team Sentiment Graph */}
                    <div style={{
                        background: 'var(--color-bg-surface)',
                        padding: '1.5rem',
                        borderRadius: '1rem',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                            📊 Team Morale & Load
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[
                                { name: 'Sarah', sentiment: 85, load: 'Heavy', color: '#10b981' },
                                { name: 'Mike', sentiment: 45, load: 'Overloaded', color: '#f59e0b' },
                                { name: 'Jessica', sentiment: 92, load: 'Optimal', color: '#10b981' },
                                { name: 'David', sentiment: 30, load: 'Burnout', color: '#ef4444' },
                            ].map((member, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '60px', fontWeight: '600', fontSize: '0.85rem' }}>{member.name}</div>
                                    <div style={{ flex: 1, background: 'var(--color-bg-app)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${member.sentiment}%`, background: member.color, height: '100%' }} />
                                    </div>
                                    <div style={{ width: '80px', fontSize: '0.75rem', color: member.color, fontWeight: '700', textAlign: 'right' }}>
                                        {member.load}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* COLUMN 2: EXECUTION & QUALITY RISKS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>🔮</span> Predictive Execution
                        </h2>
                        {/* Enhanced Ask AI Input */}
                        <div style={{ position: 'relative', width: '300px' }}>
                            <input
                                type="text"
                                placeholder="Ask AI about risks..."
                                style={{
                                    width: '100%',
                                    padding: '0.5rem 1rem 0.5rem 2.25rem',
                                    borderRadius: '99px',
                                    border: '1px solid var(--color-primary)',
                                    background: 'var(--color-bg-surface)',
                                    color: 'var(--color-text-main)',
                                    fontSize: '0.9rem'
                                }}
                            />
                            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }}>✨</span>
                        </div>
                    </div>

                    {/* Quality Assurance / Anomalies */}
                    <div style={{
                        background: 'var(--color-bg-surface)',
                        padding: '1.5rem',
                        borderRadius: '1rem',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: '#d946ef', textTransform: 'uppercase' }}>
                            🛡️ Quality Assurance Alert
                        </h3>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.5rem' }}>
                                <div style={{ fontSize: '1.25rem' }}>⚠️</div>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#c026d3' }}>Mismatch Detected: Order vs Spec</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                        Order <strong>#10293</strong> specifies "Type A" connector, but attached Datasheet is for "Type B".
                                    </div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#c026d3', cursor: 'pointer' }}>Review Discrepancy →</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.5rem' }}>
                                <div style={{ fontSize: '1.25rem' }}>🔢</div>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#c026d3' }}>Entry Error Probability: 95%</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                        Quote <strong>#Q-442</strong> has a margin of -400%. Possible typo in unit cost.
                                    </div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#c026d3', cursor: 'pointer' }}>Fix Entry →</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Projected Delays */}
                    <div style={{
                        background: 'var(--color-bg-surface)',
                        padding: '1.5rem',
                        borderRadius: '1rem',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: '#f59e0b', textTransform: 'uppercase' }}>
                            ⏱️ Projected Delays
                        </h3>
                        <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <th style={{ textAlign: 'left', paddingBottom: '0.5rem', color: 'var(--color-text-tertiary)' }}>Order</th>
                                    <th style={{ textAlign: 'left', paddingBottom: '0.5rem', color: 'var(--color-text-tertiary)' }}>Due</th>
                                    <th style={{ textAlign: 'right', paddingBottom: '0.5rem', color: 'var(--color-text-tertiary)' }}>Predicted Delay</th>
                                    <th style={{ textAlign: 'right', paddingBottom: '0.5rem', color: 'var(--color-text-tertiary)' }}>Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '0.75rem 0', fontWeight: '600' }}>Order #551</td>
                                    <td style={{ padding: '0.75rem 0' }}>Oct 12</td>
                                    <td style={{ padding: '0.75rem 0', textAlign: 'right', color: '#b45309', fontWeight: '700' }}>+4 Days</td>
                                    <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>Missing Parts</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '0.75rem 0', fontWeight: '600' }}>Project Alpha</td>
                                    <td style={{ padding: '0.75rem 0' }}>Oct 15</td>
                                    <td style={{ padding: '0.75rem 0', textAlign: 'right', color: '#b45309', fontWeight: '700' }}>+1 Week</td>
                                    <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>Approval Stall</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Email Tracking Section (Full Width Bottom) */}
            <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>📨</span> Recent Communications
                </h2>

                <div style={{ background: 'var(--color-bg-surface)', borderRadius: '1rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'var(--color-bg-app)' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: '600', fontSize: '0.9rem' }}>Case</th>
                                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: '600', fontSize: '0.9rem' }}>Status</th>
                                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: '600', fontSize: '0.9rem' }}>Owner</th>
                                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: '600', fontSize: '0.9rem' }}>Projected</th>
                                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: '600', fontSize: '0.9rem' }}>Activity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.slice(0, 10).map(ticket => (
                                <tr key={ticket.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: '600' }}>{ticket.title}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>ID: {ticket.quoteId || 'N/A'}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            background: ticket.column.color,
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '0.25rem',
                                            fontSize: '0.8rem',
                                            fontWeight: '600',
                                            color: '#fff'
                                        }}>
                                            {ticket.column.name}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                {ticket.assignee?.name?.[0] || '?'}
                                            </div>
                                            <span style={{ fontSize: '0.9rem' }}>{ticket.assignee?.name || 'Unassigned'}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                        {ticket.opdsl ? new Date(ticket.opdsl).toLocaleDateString() : '-'}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {/* Mocking simplified activity status */}
                                        <span style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--color-success)',
                                            background: 'rgba(16, 185, 129, 0.1)',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '99px'
                                        }}>
                                            Active Today
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {tickets.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No active communications found.</div>
                    )}
                </div>
            </section>
        </div>
    );
}
