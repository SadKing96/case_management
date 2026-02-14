import React, { useState } from 'react';
import '../../styles/dashboard.css';
import { aeroTheme } from './garticaGlobals';

interface Order {
    id: string;
    customer: string;
    date: string;
    status: 'Clean' | 'Warning' | 'Critical';
    specs: Spec[];
    discrepancies: Discrepancy[];
}

interface Spec {
    parameter: string;
    extracted: string;
    standard: string;
    status: 'match' | 'warning';
    note?: string;
}

interface Discrepancy {
    item: string;
    poValue: string;
    quoteValue: string;
    impact: string;
}

export function GoldenThreadView() {
    const [selectedOrderId, setSelectedOrderId] = useState<string>('ord-1');
    const [searchTerm, setSearchTerm] = useState('');

    // Mock Data
    const orders: Order[] = [
        {
            id: 'ord-1',
            customer: 'Valero Refinery',
            date: '2025-10-12',
            status: 'Warning',
            specs: [
                { parameter: 'Fluid Media', extracted: 'Sour Gas (H2S)', standard: 'NACE MR0175', status: 'match' },
                { parameter: 'Pressure', extracted: '2500 psi', standard: 'ASME Class 1500', status: 'warning', note: 'Close to limit' },
            ],
            discrepancies: [
                { item: 'Line 3 - Actuator', poValue: 'Rotork IQ10', quoteValue: 'Rotork IQ20', impact: 'Critical - Sizing Mismatch' },
            ]
        },
        {
            id: 'ord-2',
            customer: 'Dow Chemical',
            date: '2025-10-14',
            status: 'Clean',
            specs: [
                { parameter: 'Fluid Media', extracted: 'Water', standard: 'N/A', status: 'match' },
                { parameter: 'Material', extracted: 'Carbon Steel', standard: 'ASTM A216 WCB', status: 'match' },
            ],
            discrepancies: []
        },
        {
            id: 'ord-3',
            customer: 'ExxonMobil',
            date: '2025-10-15',
            status: 'Critical',
            specs: [
                { parameter: 'Temperature', extracted: '850°F', standard: 'Trim Code 12', status: 'warning', note: 'Exceeds standard trim' },
            ],
            discrepancies: [
                { item: 'Payment Terms', poValue: 'Net 90', quoteValue: 'Net 30', impact: 'Financial' },
                { item: 'Delivery Date', poValue: '2 weeks', quoteValue: '8 weeks', impact: 'Schedule' },
            ]
        },
        {
            id: 'ord-4',
            customer: 'Chevron',
            date: '2025-10-11',
            status: 'Clean',
            specs: [
                { parameter: 'Flange Rating', extracted: '300#', standard: 'ASME B16.5', status: 'match' }
            ],
            discrepancies: []
        }
    ];

    const filteredOrders = orders.filter(o =>
        o.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.id.includes(searchTerm.toLowerCase())
    );

    const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

    return (
        <div style={aeroTheme.styles.container}>
            <div style={{ paddingBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: aeroTheme.colors.primaryDark }}>Golden Thread & Ingress</h1>
                <p style={{ color: aeroTheme.colors.textSecondary }}>Automatic Spec Extraction & PO Reconciliation</p>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', height: 'calc(100% - 100px)' }}>

                {/* Left Column: Order List */}
                <div style={{
                    ...aeroTheme.styles.glassPanel,
                    width: '300px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.5)' }}>
                        <input
                            type="text"
                            placeholder="Search Orders..."
                            className="form-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc' }}
                        />
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {filteredOrders.map(order => (
                            <div
                                key={order.id}
                                onClick={() => setSelectedOrderId(order.id)}
                                style={{
                                    padding: '1rem',
                                    borderBottom: '1px solid rgba(255,255,255,0.5)',
                                    cursor: 'pointer',
                                    background: selectedOrderId === order.id ? 'rgba(0, 136, 204, 0.1)' : 'transparent',
                                    borderLeft: selectedOrderId === order.id ? `4px solid ${aeroTheme.colors.primary}` : '4px solid transparent'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: aeroTheme.colors.textMain }}>{order.customer}</span>
                                    <span style={{ fontSize: '0.75rem', color: aeroTheme.colors.textSecondary }}>{order.date}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', color: aeroTheme.colors.textSecondary }}>{order.id}</span>
                                    <StatusBadge status={order.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Dynamic Details */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Header for Selected Order */}
                    <div style={{
                        ...aeroTheme.styles.glassPanel,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.5rem'
                    }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', margin: 0, color: aeroTheme.colors.textMain }}>{selectedOrder.customer} - {selectedOrder.id}</h2>
                            <div style={{ color: aeroTheme.colors.textSecondary, fontSize: '0.9rem', marginTop: '0.25rem' }}>Received on {selectedOrder.date} via Email Ingress</div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.8)' }}>View Original Email</button>
                            <button className="btn btn-primary" style={{ background: aeroTheme.colors.primary, color: 'white' }}>Process Order</button>
                        </div>
                    </div>

                    {/* Spec Extraction & Validation */}
                    <div style={{ ...aeroTheme.styles.glassPanel, padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: aeroTheme.colors.primaryDark }}>📄 RFQ Spec Analysis</h3>
                            <span style={{ fontSize: '0.8rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px' }}>AI Confidence: 94%</span>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', textAlign: 'left', color: aeroTheme.colors.textSecondary }}>
                                    <th style={{ padding: '8px' }}>Parameter</th>
                                    <th style={{ padding: '8px' }}>Extracted Value</th>
                                    <th style={{ padding: '8px' }}>Standard / Code</th>
                                    <th style={{ padding: '8px' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedOrder.specs.map((row, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                        <td style={{ padding: '8px', fontWeight: 'bold', color: aeroTheme.colors.textMain }}>{row.parameter}</td>
                                        <td style={{ padding: '8px' }}>{row.extracted}</td>
                                        <td style={{ padding: '8px', color: aeroTheme.colors.textSecondary }}>{row.standard}</td>
                                        <td style={{ padding: '8px' }}>
                                            {row.status === 'match' ? (
                                                <span style={{ color: aeroTheme.colors.success, fontWeight: 'bold' }}>✅ Match</span>
                                            ) : (
                                                <span style={{ color: '#f59e0b', display: 'flex', gap: '4px', fontWeight: 'bold' }}>
                                                    ⚠️ {row.note}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {selectedOrder.specs.length === 0 && (
                                    <tr><td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: aeroTheme.colors.textSecondary }}>No Critical Specs Extracted</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PO Discrepancy Checking */}
                    <div style={{ ...aeroTheme.styles.glassPanel, padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: aeroTheme.colors.primaryDark }}>🚨 PO vs Quote Reconciliation</h3>
                            {selectedOrder.discrepancies.length > 0 ? (
                                <span style={{ fontSize: '0.8rem', background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '12px' }}>{selectedOrder.discrepancies.length} Flagged Issues</span>
                            ) : (
                                <span style={{ fontSize: '0.8rem', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px' }}>All Clear</span>
                            )}
                        </div>
                        {selectedOrder.discrepancies.length > 0 ? selectedOrder.discrepancies.map((d, i) => (
                            <div key={i} style={{
                                background: 'rgba(254, 242, 242, 0.8)',
                                borderLeft: '4px solid #ef4444',
                                padding: '1rem',
                                marginBottom: '1rem',
                                borderRadius: '0 4px 4px 0'
                            }}>
                                <div style={{ fontWeight: 'bold', color: '#991b1b', marginBottom: '4px' }}>Mismatch Detected: {d.item}</div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#7f1d1d' }}>
                                    <div><span style={{ fontWeight: '600' }}>PO Says:</span> {d.poValue}</div>
                                    <div>→</div>
                                    <div><span style={{ fontWeight: '600' }}>Quote Was:</span> {d.quoteValue}</div>
                                </div>
                            </div>
                        )) : (
                            <div style={{ padding: '2rem', textAlign: 'center', color: aeroTheme.colors.textSecondary, background: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
                                <div>✅ No discrepancies found between PO and Quote.</div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: 'Clean' | 'Warning' | 'Critical' }) {
    let bg = '#dcfce7';
    let color = '#166534';
    if (status === 'Warning') { bg = '#fef3c7'; color = '#92400e'; }
    if (status === 'Critical') { bg = '#fee2e2'; color = '#991b1b'; }

    return (
        <span style={{
            fontSize: '0.7rem',
            padding: '2px 6px',
            borderRadius: '4px',
            background: bg,
            color: color,
            fontWeight: '600',
            textTransform: 'uppercase'
        }}>
            {status}
        </span>
    );
}
