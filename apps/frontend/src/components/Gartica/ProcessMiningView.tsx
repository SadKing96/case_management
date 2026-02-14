import { useState, useEffect } from 'react';
import { apiClient as api } from '../../api/client';
import { aeroTheme } from './garticaGlobals';

interface ProcessNode {
    id: string;
    label: string;
    type: 'start' | 'process' | 'decision' | 'end';
    x: number;
    y: number;
}

interface ProcessEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
}

interface ProcessData {
    nodes: ProcessNode[];
    edges: ProcessEdge[];
    efficiency: number;
    bottlenecks: number;
}

export function ProcessMiningView() {
    const [data, setData] = useState<ProcessData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchProcess = async () => {
            setLoading(true);
            try {
                const res = await api.get<ProcessData>('/gartica/process-mining');
                setData(res);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProcess();
    }, []);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: aeroTheme.colors.textSecondary }}>Analyzing workflows...</div>;

    const getNodeStyle = (type: string) => {
        const base = {
            padding: '1rem',
            borderRadius: '8px',
            background: 'white',
            border: `2px solid ${aeroTheme.colors.primary}`,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            minWidth: '120px',
            textAlign: 'center' as const,
            position: 'absolute' as const,
            fontWeight: 'bold' as const,
            color: aeroTheme.colors.textMain
        };

        switch (type) {
            case 'start': return { ...base, borderRadius: '50px', background: aeroTheme.colors.success, color: 'white', border: 'none' };
            case 'end': return { ...base, borderRadius: '50px', background: aeroTheme.colors.textMain, color: 'white', border: 'none' };
            case 'decision': return { ...base, transform: 'rotate(45deg)', borderRadius: '4px', background: aeroTheme.colors.warning, color: 'white', border: 'none', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
            default: return base;
        }
    };

    return (
        <div style={aeroTheme.styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: aeroTheme.colors.primaryDark }}>Process Mining</h1>
                    <p style={{ color: aeroTheme.colors.textSecondary }}>Visualizing Order-to-Cash Workflow</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ ...aeroTheme.styles.glassCard, padding: '1rem', textAlign: 'center', minWidth: '120px' }}>
                        <div style={{ fontSize: '0.8rem', color: aeroTheme.colors.textSecondary }}>Efficiency</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: aeroTheme.colors.success }}>{data?.efficiency || 0}%</div>
                    </div>
                    <div style={{ ...aeroTheme.styles.glassCard, padding: '1rem', textAlign: 'center', minWidth: '120px' }}>
                        <div style={{ fontSize: '0.8rem', color: aeroTheme.colors.textSecondary }}>Bottlenecks</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: aeroTheme.colors.danger }}>{data?.bottlenecks || 0}</div>
                    </div>
                </div>
            </div>

            {/* Minimap Area */}
            <div style={{ ...aeroTheme.styles.glassPanel, height: '500px', position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.4)' }}>
                {/* Grid Background */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: 'radial-gradient(rgba(0, 136, 204, 0.2) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }} />

                {data?.edges.map(edge => {
                    // Simple logic to draw lines between nodes (mock coordinates)
                    // In a real app, we'd use Xarrows or similar library
                    const source = data.nodes.find(n => n.id === edge.source);
                    const target = data.nodes.find(n => n.id === edge.target);
                    if (!source || !target) return null;

                    return (
                        <svg key={edge.id} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                            <line
                                x1={source.x} y1={source.y + 20}
                                x2={target.x} y2={target.y + 20}
                                stroke={aeroTheme.colors.textSecondary}
                                strokeWidth="2"
                                markerEnd="url(#arrowhead)"
                            />
                            {edge.label && (
                                <text x={(source.x + target.x) / 2} y={(source.y + target.y) / 2} fill={aeroTheme.colors.textSecondary} fontSize="12" textAnchor="middle" dy="-5">
                                    {edge.label}
                                </text>
                            )}
                        </svg>
                    );
                })}

                {/* Arrow Marker Definition */}
                <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill={aeroTheme.colors.textSecondary} />
                        </marker>
                    </defs>
                </svg>

                {data?.nodes.map(node => (
                    <div key={node.id} style={{ ...getNodeStyle(node.type), top: node.y, left: node.x }}>
                        <div style={node.type === 'decision' ? { transform: 'rotate(-45deg)' } : {}}>
                            {node.label}
                        </div>
                    </div>
                ))}

                {!data && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: aeroTheme.colors.textSecondary }}>
                        Graph Visualization Area
                    </div>
                )}
            </div>
        </div>
    );
}
