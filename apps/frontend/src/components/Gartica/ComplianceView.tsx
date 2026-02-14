import { useState, useEffect } from 'react';
import { apiClient as api } from '../../api/client';
import { aeroTheme } from './garticaGlobals';

interface ComplianceFlag {
    id: string;
    type: 'pii' | 'sentiment' | 'keyword';
    severity: 'high' | 'medium' | 'low';
    description: string;
    status: 'open' | 'resolved' | 'dismissed';
    sourceText: string;
    createdAt: string;
}

export function ComplianceView() {
    const [flags, setFlags] = useState<ComplianceFlag[]>([]);
    const [loading, setLoading] = useState(false);

    // Demo State
    const [demoText, setDemoText] = useState('');
    const [scanning, setScanning] = useState(false);

    useEffect(() => {
        fetchFlags();
    }, []);

    const fetchFlags = async () => {
        setLoading(true);
        try {
            const res = await api.get<ComplianceFlag[]>('/gartica/compliance/flags');
            setFlags(res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id: string, status: 'resolved' | 'dismissed') => {
        try {
            await api.post(`/gartica/compliance/flags/${id}/resolve`, { status });
            // Optimistic update
            setFlags(prev => prev.filter(f => f.id !== id));
        } catch (err) {
            console.error(err);
            alert('Failed to update flag');
        }
    };

    const runDemoScan = async () => {
        if (!demoText) return;
        setScanning(true);
        try {
            await api.post('/gartica/compliance/scan-mock', { text: demoText, type: 'note' });
            setDemoText('');
            await fetchFlags();
        } catch (err) {
            console.error(err);
        } finally {
            setScanning(false);
        }
    };

    const getSeverityColor = (sev: string) => {
        switch (sev) {
            case 'high': return aeroTheme.colors.danger; // e.g. #ef4444
            case 'medium': return aeroTheme.colors.warning; // e.g. #f59e0b
            case 'low': return aeroTheme.colors.info; // e.g. #3b82f6 -> info/primary
            default: return aeroTheme.colors.textSecondary;
        }
    };

    return (
        <div style={aeroTheme.styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: aeroTheme.colors.primaryDark }}>Compliance Sentinel</h1>
                    <p style={{ color: aeroTheme.colors.textSecondary }}>Risk detection & Policy enforcement</p>
                </div>
            </div>

            {/* Risk Matrix / Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ ...aeroTheme.styles.glassCard, padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: aeroTheme.colors.danger }}>
                        {flags.filter(f => f.severity === 'high').length}
                    </div>
                    <div style={{ color: aeroTheme.colors.textSecondary }}>Critical Risks</div>
                </div>
                <div style={{ ...aeroTheme.styles.glassCard, padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: aeroTheme.colors.warning }}>
                        {flags.filter(f => f.severity === 'medium').length}
                    </div>
                    <div style={{ color: aeroTheme.colors.textSecondary }}>Warnings</div>
                </div>
                <div style={{ ...aeroTheme.styles.glassCard, padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: aeroTheme.colors.info }}>
                        {flags.filter(f => f.severity === 'low').length}
                    </div>
                    <div style={{ color: aeroTheme.colors.textSecondary }}>Notices</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* Main List */}
                <div style={{ ...aeroTheme.styles.glassPanel, padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: aeroTheme.colors.primaryDark }}>Active Risk Flags</h3>
                    {loading ? (
                        <div style={{ color: aeroTheme.colors.textSecondary }}>Loading...</div>
                    ) : flags.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: aeroTheme.colors.textSecondary }}>
                            No active risks detected. System is clean.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {flags.map(flag => (
                                <div key={flag.id} style={{ padding: '1rem', border: `1px solid ${aeroTheme.colors.border}`, borderRadius: '8px', background: 'rgba(255,255,255,0.4)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <span style={{
                                                textTransform: 'uppercase',
                                                fontSize: '0.7rem',
                                                fontWeight: 'bold',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                background: getSeverityColor(flag.severity),
                                                color: 'white',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}>
                                                {flag.severity}
                                            </span>
                                            <span style={{ fontWeight: 'bold', color: aeroTheme.colors.textMain }}>{flag.description}</span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: aeroTheme.colors.textSecondary }}>
                                            {new Date(flag.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '0.75rem',
                                        background: 'rgba(0,0,0,0.05)',
                                        borderRadius: '6px',
                                        fontFamily: 'monospace',
                                        fontSize: '0.9rem',
                                        marginBottom: '1rem',
                                        color: aeroTheme.colors.textMain,
                                        border: '1px outset rgba(255,255,255,0.5)'
                                    }}>
                                        "{flag.sourceText}"
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => handleResolve(flag.id, 'dismissed')}
                                            style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: `1px solid ${aeroTheme.colors.border}`, cursor: 'pointer', background: 'rgba(255,255,255,0.5)', color: aeroTheme.colors.textSecondary }}
                                        >
                                            Dismiss
                                        </button>
                                        <button
                                            onClick={() => handleResolve(flag.id, 'resolved')}
                                            style={{ ...aeroTheme.styles.buttonPrimary, fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                                        >
                                            Resolve Issue
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Demo Trigger */}
                <div style={{ ...aeroTheme.styles.glassCard, padding: '1.5rem', height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '1rem', color: aeroTheme.colors.textMain }}>Trigger Manual Scan</h3>
                    <p style={{ fontSize: '0.9rem', color: aeroTheme.colors.textSecondary, marginBottom: '1rem' }}>
                        Simulate an incoming email or note to test the compliance engine.
                    </p>
                    <textarea
                        value={demoText}
                        onChange={(e) => setDemoText(e.target.value)}
                        placeholder="Type something risky... e.g. 'I will sue you' or 'My SSN is 123-45-6789'"
                        style={{
                            ...aeroTheme.styles.input,
                            width: '100%',
                            height: '120px',
                            marginBottom: '1rem',
                            resize: 'none'
                        }}
                    />
                    <button
                        onClick={runDemoScan}
                        disabled={scanning || !demoText}
                        style={{
                            ...aeroTheme.styles.buttonPrimary,
                            width: '100%',
                            justifyContent: 'center',
                            opacity: scanning || !demoText ? 0.6 : 1
                        }}
                    >
                        {scanning ? 'Scanning...' : 'Scan Content'}
                    </button>
                </div>
            </div>
        </div>
    );
}
