import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { aeroTheme } from './garticaGlobals';

// Updated interface to match Prisma schema return shape
interface Asset {
    id: string;
    serialNumber: string; // Changed from serial
    model: string;
    installDate: string;
    location: string;
    customerName: string; // Changed from customer
    lastServiceDate: string | null; // Changed from lastService
    aiPrediction: string | null; // Changed from prediction
    status: string; // 'Active', 'Maintenance Required', etc.
    healthScore: number;
    revenuePotential: number;
}

interface Summary {
    totalOpportunity: number;
    highPriorityTargets: number;
    winRateProjection: number;
    nextBestActions: Array<{
        id: string;
        customer: string;
        action: string;
        potential: number;
    }>;
}

export function AftermarketView() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);

    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        customer: '',
        status: '',
        minRevenue: '',
        serial: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [assetsRes, summaryRes] = await Promise.all([
                    apiClient.get('/gartica/aftermarket/assets'),
                    apiClient.get('/gartica/aftermarket/summary')
                ]);
                setAssets(assetsRes as any);
                setSummary(summaryRes as any);
            } catch (err) {
                console.error("Failed to fetch aftermarket data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Local filtering
    const filteredAssets = assets.filter(asset => {
        if (filters.customer && !asset.customerName.toLowerCase().includes(filters.customer.toLowerCase())) return false;
        if (filters.status && asset.status !== filters.status) return false;
        if (filters.minRevenue && asset.revenuePotential < Number(filters.minRevenue)) return false;
        if (filters.serial && !asset.serialNumber.toLowerCase().includes(filters.serial.toLowerCase())) return false;
        return true;
    });

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: aeroTheme.colors.textSecondary }}>Loading Aftermarket Intelligence...</div>;

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    const getStatusParams = (status: string) => {
        // Map DB status to display colors
        switch (status) {
            case 'Critical': return { color: aeroTheme.colors.danger, bg: '#fee2e2' };
            case 'Services Due':
            case 'Maintenance Required': return { color: '#9a3412', bg: '#ffedd5' };
            case 'Warning': return { color: aeroTheme.colors.warning, bg: '#fef3c7' };
            case 'Offline': return { color: aeroTheme.colors.textSecondary, bg: '#e5e7eb' };
            default: return { color: aeroTheme.colors.success, bg: '#dcfce7' }; // Active/Healthy
        }
    };

    return (
        <div style={aeroTheme.styles.container}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: aeroTheme.colors.primaryDark }}>Aftermarket Intelligence</h1>
                <p style={{ color: aeroTheme.colors.textSecondary }}>Installed Base Mining & AI Sales Opportunities</p>
            </div>

            {/* AI Sales Summary Dashboard */}
            <div style={{
                ...aeroTheme.styles.glassCard,
                padding: '2rem',
                marginBottom: '2rem',
            }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1.5rem',
                        background: `linear-gradient(135deg, ${aeroTheme.colors.primary}, #60a5fa)`,
                        borderRadius: '999px',
                        color: 'white',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        <span style={{ fontSize: '1.25rem' }}>✨</span>
                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>AI Opportunity Forecast</span>
                    </div>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                    <div>
                        <div style={{ fontSize: '1rem', color: aeroTheme.colors.textSecondary, marginBottom: '0.5rem', fontWeight: 'bold' }}>Pipeline Opportunity</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: aeroTheme.colors.success }}>{formatCurrency(summary?.totalOpportunity || 0)}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '1rem', color: aeroTheme.colors.textSecondary, marginBottom: '0.5rem', fontWeight: 'bold' }}>High Priority Targets</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: aeroTheme.colors.danger }}>{summary?.highPriorityTargets}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '1rem', color: aeroTheme.colors.textSecondary, marginBottom: '0.5rem', fontWeight: 'bold' }}>Projected Win Rate</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: aeroTheme.colors.info }}>{summary?.winRateProjection}%</div>
                    </div>
                </div>

                <div style={{ ...aeroTheme.styles.glassPanel, padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '1rem', textTransform: 'uppercase', color: aeroTheme.colors.primaryDark }}>Next Best Actions</div>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {summary?.nextBestActions.map(action => (
                            <div key={action.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1rem', padding: '0.5rem 0', borderBottom: `1px solid ${aeroTheme.colors.border}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ color: aeroTheme.colors.warning, fontSize: '1.2rem' }}>➜</span>
                                    <span><span style={{ fontWeight: 'bold', color: aeroTheme.colors.textMain }}>{action.customer}:</span> <span style={{ color: aeroTheme.colors.textSecondary }}>{action.action}</span></span>
                                </div>
                                <span style={{ color: aeroTheme.colors.success, fontWeight: 'bold', fontSize: '1.1rem' }}>+{formatCurrency(action.potential)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Advanced Filters */}
            <div style={{ marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                        ...aeroTheme.styles.glassCard,
                        width: '100%',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: aeroTheme.colors.textMain,
                        padding: '1rem 1.5rem',
                        cursor: 'pointer'
                    }}
                >
                    <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>🔍</span>
                        Advanced Search & Filters
                    </span>
                    <span>{showFilters ? '▲' : '▼'}</span>
                </button>

                {showFilters && (
                    <div style={{
                        ...aeroTheme.styles.glassPanel,
                        marginTop: '0.5rem',
                        borderRadius: '0 0 12px 12px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        padding: '1.5rem'
                    }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: aeroTheme.colors.textSecondary, fontWeight: 'bold' }}>Serial Number / Tag</label>
                            <input
                                type="text"
                                placeholder="Search by SN..."
                                value={filters.serial}
                                onChange={e => setFilters({ ...filters, serial: e.target.value })}
                                style={aeroTheme.styles.input}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: aeroTheme.colors.textSecondary, fontWeight: 'bold' }}>Customer</label>
                            <input
                                type="text"
                                placeholder="Filter by Customer..."
                                value={filters.customer}
                                onChange={e => setFilters({ ...filters, customer: e.target.value })}
                                style={aeroTheme.styles.input}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: aeroTheme.colors.textSecondary, fontWeight: 'bold' }}>Service Status</label>
                            <select
                                value={filters.status}
                                onChange={e => setFilters({ ...filters, status: e.target.value })}
                                style={aeroTheme.styles.select}
                            >
                                <option value="">All Statuses</option>
                                <option value="Maintenance Required">Maintenance Required</option>
                                <option value="Offline">Offline</option>
                                <option value="Active">Active</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: aeroTheme.colors.textSecondary, fontWeight: 'bold' }}>Min. Revenue Opportunity</label>
                            <input
                                type="number"
                                placeholder="$0"
                                value={filters.minRevenue}
                                onChange={e => setFilters({ ...filters, minRevenue: e.target.value })}
                                style={aeroTheme.styles.input}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Asset Data Grid */}
            <div style={{
                ...aeroTheme.styles.glassPanel,
                overflow: 'hidden',
                padding: 0
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.4)', textAlign: 'left', borderBottom: `2px solid ${aeroTheme.colors.border}` }}>
                            <th style={{ padding: '1rem', color: aeroTheme.colors.textSecondary }}>Serial / Model</th>
                            <th style={{ padding: '1rem', color: aeroTheme.colors.textSecondary }}>Customer / Location</th>
                            <th style={{ padding: '1rem', color: aeroTheme.colors.textSecondary }}>Install Date</th>
                            <th style={{ padding: '1rem', color: aeroTheme.colors.textSecondary }}>Status</th>
                            <th style={{ padding: '1rem', color: aeroTheme.colors.textSecondary }}>AI Prediction</th>
                            <th style={{ padding: '1rem', color: aeroTheme.colors.textSecondary }}>Revenue Potential</th>
                            <th style={{ padding: '1rem', color: aeroTheme.colors.textSecondary }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAssets.map((asset, i) => {
                            const statusStyle = getStatusParams(asset.status);
                            return (
                                <tr key={asset.id} style={{ borderBottom: `1px solid ${aeroTheme.colors.border}`, background: i % 2 === 0 ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 'bold', color: aeroTheme.colors.textMain }}>{asset.serialNumber}</div>
                                        <div style={{ fontSize: '0.8rem', color: aeroTheme.colors.textSecondary }}>{asset.model}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ color: aeroTheme.colors.textMain }}>{asset.customerName}</div>
                                        <div style={{ fontSize: '0.8rem', color: aeroTheme.colors.textSecondary }}>{asset.location}</div>
                                    </td>
                                    <td style={{ padding: '1rem', color: aeroTheme.colors.textMain }}>{new Date(asset.installDate).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            backgroundColor: statusStyle.bg,
                                            color: statusStyle.color,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}>
                                            {asset.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', maxWidth: '200px', color: aeroTheme.colors.textMain }}>
                                        <span style={{ fontSize: '0.85rem' }}>{asset.aiPrediction || '-'}</span>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold', color: aeroTheme.colors.success }}>
                                        {asset.revenuePotential > 0 ? formatCurrency(asset.revenuePotential) : '-'}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button style={{ ...aeroTheme.styles.buttonPrimary, fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                                            Create Quote
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredAssets.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: aeroTheme.colors.textSecondary }}>
                                    No assets found matching filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
