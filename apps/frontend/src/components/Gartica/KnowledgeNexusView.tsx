import { useState, useEffect } from 'react';
import { apiClient as api } from '../../api/client';
import { aeroTheme } from './garticaGlobals';

interface Article {
    id: string;
    title: string;
    snippet: string;
    relevance: number;
    tags: string[];
    views: number;
}

export function KnowledgeNexusView() {
    const [query, setQuery] = useState('');
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(false);
    const [aiAnswer, setAiAnswer] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!query) return;
        setLoading(true);
        try {
            const res = await api.get<Article[]>(`/gartica/knowledge/search?q=${query}`);
            setArticles(res);

            // Mock AI generation
            if (res.length > 0) {
                setTimeout(() => {
                    setAiAnswer(`Based on the top documentation, the recommended solution for "${query}" involves checking the hydraulic pressure valve settings (Art. #402) and resetting the control unit.`);
                }, 800);
            } else {
                setAiAnswer(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={aeroTheme.styles.container}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', background: `linear-gradient(90deg, ${aeroTheme.colors.primary}, ${aeroTheme.colors.primaryDark})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>Knowledge Nexus</h1>
                <p style={{ color: aeroTheme.colors.textSecondary, fontSize: '1.2rem' }}>AI-Powered Semantic Search & Resolution Engine</p>
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto 3rem auto' }}>
                <div style={{ position: 'relative', display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Describe the issue... (e.g. 'Leak in main valve')"
                            style={{
                                ...aeroTheme.styles.input,
                                width: '100%',
                                fontSize: '1.2rem',
                                padding: '1rem 1.5rem',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1), inset 0 2px 4px rgba(0,0,0,0.05)',
                                borderRadius: '50px'
                            }}
                        />
                        <span style={{ position: 'absolute', right: '1.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.5rem', opacity: 0.5 }}>🔍</span>
                    </div>
                    <button
                        onClick={handleSearch}
                        style={{ ...aeroTheme.styles.buttonPrimary, fontSize: '1.2rem', padding: '0 2rem', borderRadius: '50px' }}
                    >
                        Search
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>

                {/* AI Resolver Panel */}
                <div style={{ ...aeroTheme.styles.glassPanel, padding: '2rem', height: 'fit-content' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{
                            width: '3rem', height: '3rem', borderRadius: '50%',
                            background: `linear-gradient(135deg, ${aeroTheme.colors.primary}, #60a5fa)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'white',
                            boxShadow: '0 4px 10px rgba(0, 136, 204, 0.3)'
                        }}>
                            ✨
                        </div>
                        <h3 style={{ fontWeight: 'bold', fontSize: '1.2rem', color: aeroTheme.colors.textMain }}>AI Quick Resolve</h3>
                    </div>

                    {loading ? (
                        <div style={{ color: aeroTheme.colors.textSecondary, fontStyle: 'italic' }}>Synthesizing solution...</div>
                    ) : aiAnswer ? (
                        <div>
                            <div style={{ lineHeight: '1.6', fontSize: '1rem', color: aeroTheme.colors.textMain, marginBottom: '1.5rem' }}>
                                {aiAnswer}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: `1px solid ${aeroTheme.colors.success}`, background: 'rgba(34, 197, 94, 0.1)', color: aeroTheme.colors.success, cursor: 'pointer', fontWeight: 'bold' }}>Correct ✅</button>
                                <button style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: `1px solid ${aeroTheme.colors.danger}`, background: 'rgba(239, 68, 68, 0.1)', color: aeroTheme.colors.danger, cursor: 'pointer', fontWeight: 'bold' }}>Incorrect ❌</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ color: aeroTheme.colors.textSecondary, fontSize: '0.9rem' }}>
                            Search for an issue to get an instant AI-generated resolution proposal based on internal docs.
                        </div>
                    )}
                </div>

                {/* Results List */}
                <div>
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: 'bold', color: aeroTheme.colors.textSecondary }}>
                        {loading ? 'Searching...' : articles.length > 0 ? `Found ${articles.length} Relevant Articles` : 'Suggested Topics'}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {articles.length > 0 ? articles.map(art => (
                            <div key={art.id} style={{ ...aeroTheme.styles.glassCard, padding: '1.5rem', transition: 'transform 0.2s', cursor: 'pointer' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: aeroTheme.colors.primaryDark, margin: 0 }}>{art.title}</h4>
                                    <span style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', color: aeroTheme.colors.textSecondary }}>{art.views} views</span>
                                </div>
                                <p style={{ color: aeroTheme.colors.textMain, marginBottom: '1rem', lineHeight: '1.5' }}>{art.snippet}...</p>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {art.tags.map(tag => (
                                        <span key={tag} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(0, 136, 204, 0.1)', color: aeroTheme.colors.primary }}>#{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )) : (
                            // Empty State / Suggestions
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {['Hydraulic Pump Maintenance', 'Safety Compliance 2025', 'Customer Escalation Protocol', 'ERP Sync Troubleshooting'].map((topic, i) => (
                                    <div key={i} style={{ ...aeroTheme.styles.glassPanel, padding: '1.5rem', textAlign: 'center', cursor: 'pointer', color: aeroTheme.colors.primary, fontWeight: 'bold' }}
                                        onClick={() => { setQuery(topic); handleSearch(); }}
                                    >
                                        {topic}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
