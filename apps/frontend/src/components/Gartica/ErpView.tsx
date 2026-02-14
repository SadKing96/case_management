import { useState, useEffect } from 'react';
import { apiClient as api } from '../../api/client';
import { aeroTheme } from './garticaGlobals';

interface ErpData {
    productionCapacity: {
        currentLoad: number;
        projectedLoad: number;
        bottlenecks: string[];
    };
    customerCredit: {
        customerId: string;
        creditLimit: number;
        currentBalance: number;
        status: 'Good' | 'Warning' | 'Hold';
    };
}

export function ErpView() {
    const [data, setData] = useState<ErpData | null>(null);
    const [loading, setLoading] = useState(false);
    const [lookupId, setLookupId] = useState('');

    useEffect(() => {
        // Mock initial load
        fetchErpData();
    }, []);

    const fetchErpData = async () => {
        setLoading(true);
        try {
            const res = await api.get<ErpData>('/gartica/erp-sync');
            setData(res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const checkCredit = async () => {
        if (!lookupId) return;
        setLoading(true);
        try {
            // Mock call for specific customer
            const res = await api.get<ErpData>(`/gartica/erp-check?customerId=${lookupId}`);
            setData(prev => prev ? { ...prev, customerCredit: res.customerCredit } : res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) return <div style={{ padding: '2rem', textAlign: 'center', color: aeroTheme.colors.textSecondary }}>Syncing with ERP Core...</div>;

    return (
        <div style={aeroTheme.styles.container}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: aeroTheme.colors.primaryDark }}>ERP Live Sync</h1>
                <p style={{ color: aeroTheme.colors.textSecondary }}>Production & Financial Real-time Data</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Production Capacity Module */}
                <div style={{ ...aeroTheme.styles.glassCard, padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '2rem' }}>🏭</div>
                        <div>
                            <h3 style={{ fontWeight: 'bold', fontSize: '1.2rem', color: aeroTheme.colors.textMain }}>Production Load</h3>
                            <div style={{ fontSize: '0.9rem', color: aeroTheme.colors.textSecondary }}>Factory Floor Capacity</div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: aeroTheme.colors.textMain }}>
                            <span>Current Load</span>
                            <span style={{ fontWeight: 'bold' }}>{data?.productionCapacity.currentLoad}%</span>
                        </div>
                        <div style={{ height: '12px', background: 'rgba(255,255,255,0.5)', borderRadius: '6px', overflow: 'hidden', border: `1px solid ${aeroTheme.colors.border}` }}>
                            <div style={{
                                height: '100%',
                                width: `${data?.productionCapacity.currentLoad}%`,
                                background: `linear-gradient(90deg, ${aeroTheme.colors.primary}, ${aeroTheme.colors.info})`,
                                borderRadius: '6px'
                            }} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: aeroTheme.colors.textMain }}>
                            <span>Projected Load (Next 7 days)</span>
                            <span style={{ fontWeight: 'bold' }}>{data?.productionCapacity.projectedLoad}%</span>
                        </div>
                        <div style={{ height: '12px', background: 'rgba(255,255,255,0.5)', borderRadius: '6px', overflow: 'hidden', border: `1px solid ${aeroTheme.colors.border}` }}>
                            <div style={{
                                height: '100%',
                                width: `${data?.productionCapacity.projectedLoad}%`,
                                background: `linear-gradient(90deg, ${aeroTheme.colors.warning}, #f97316)`,
                                borderRadius: '6px'
                            }} />
                        </div>
                    </div>

                    {data?.productionCapacity.bottlenecks && data.productionCapacity.bottlenecks.length > 0 && (
                        <div style={{ background: 'rgba(220, 53, 69, 0.1)', border: `1px solid ${aeroTheme.colors.danger}`, borderRadius: '8px', padding: '1rem', marginTop: '2rem' }}>
                            <div style={{ fontWeight: 'bold', color: aeroTheme.colors.danger, marginBottom: '0.5rem' }}>⚠ Detected Bottlenecks</div>
                            <ul style={{ paddingLeft: '1.2rem', color: aeroTheme.colors.textMain }}>
                                {data.productionCapacity.bottlenecks.map((b, i) => <li key={i}>{b}</li>)}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Credit Check Module */}
                <div style={{ ...aeroTheme.styles.glassPanel, padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '2rem' }}>💳</div>
                        <div>
                            <h3 style={{ fontWeight: 'bold', fontSize: '1.2rem', color: aeroTheme.colors.textMain }}>Financial Status Check</h3>
                            <div style={{ fontSize: '0.9rem', color: aeroTheme.colors.textSecondary }}>Real-time Credit Verification</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                        <input
                            type="text"
                            placeholder="Customer ID..."
                            value={lookupId}
                            onChange={(e) => setLookupId(e.target.value)}
                            style={{ ...aeroTheme.styles.input, flex: 1 }}
                        />
                        <button onClick={checkCredit} style={aeroTheme.styles.buttonPrimary}>Check</button>
                    </div>

                    {data?.customerCredit && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                display: 'inline-block',
                                padding: '1rem 2rem',
                                borderRadius: '50px',
                                background: data.customerCredit.status === 'Good' ? aeroTheme.colors.success : data.customerCredit.status === 'Warning' ? aeroTheme.colors.warning : aeroTheme.colors.danger,
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '1.5rem',
                                marginBottom: '2rem',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                            }}>
                                STATUS: {data.customerCredit.status.toUpperCase()}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'left' }}>
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px', border: `1px solid ${aeroTheme.colors.border}` }}>
                                    <div style={{ fontSize: '0.8rem', color: aeroTheme.colors.textSecondary }}>Credit Limit</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: aeroTheme.colors.textMain }}>${data.customerCredit.creditLimit.toLocaleString()}</div>
                                </div>
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px', border: `1px solid ${aeroTheme.colors.border}` }}>
                                    <div style={{ fontSize: '0.8rem', color: aeroTheme.colors.textSecondary }}>Current Balance</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: aeroTheme.colors.textMain }}>${data.customerCredit.currentBalance.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
