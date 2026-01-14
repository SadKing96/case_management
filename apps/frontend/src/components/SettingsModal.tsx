import { useState, useEffect } from 'react';
import { useSettings, Theme, Font, TextSize } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

function SidebarOrderSettings() {
    const { currentRole } = useAuth();
    const defaultOrder = ['boards', 'cards', 'reports', 'archive', 'users', 'database', 'ingress', 'trash'];
    const [order, setOrder] = useState<string[]>(() => {
        const saved = localStorage.getItem('sidebar_order');
        return saved ? JSON.parse(saved) : defaultOrder;
    });

    if (currentRole !== 'Admin' && currentRole !== 'SuperUser') {
        return <div style={{ fontSize: '0.9em', color: '#888' }}>Only Admins can change sidebar order.</div>;
    }

    const moveUp = (index: number) => {
        if (index === 0) return;
        const newOrder = [...order];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        setOrder(newOrder);
        save(newOrder);
    };

    const moveDown = (index: number) => {
        if (index === order.length - 1) return;
        const newOrder = [...order];
        [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
        setOrder(newOrder);
        save(newOrder);
    };

    const save = (newOrder: string[]) => {
        localStorage.setItem('sidebar_order', JSON.stringify(newOrder));
        // Dispatch event for Sidebar to pick up
        window.dispatchEvent(new Event('sidebar_order_updated'));
    };

    const labels: Record<string, string> = {
        boards: 'Boards & Sub-boards',
        cards: 'Cards',
        reports: 'Reports',
        archive: 'Archive',
        users: 'Users',
        database: 'Database',
        ingress: 'Ingress (Import/Rules)',
        trash: 'Trash'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {order.map((id, index) => (
                <div key={id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem',
                    backgroundColor: 'var(--color-bg-app)',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)'
                }}>
                    <span>{labels[id] || id}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                            disabled={index === 0}
                            onClick={() => moveUp(index)}
                            style={{
                                padding: '2px 8px',
                                cursor: index === 0 ? 'default' : 'pointer',
                                opacity: index === 0 ? 0.3 : 1
                            }}
                        >
                            ↑
                        </button>
                        <button
                            disabled={index === order.length - 1}
                            onClick={() => moveDown(index)}
                            style={{
                                padding: '2px 8px',
                                cursor: index === order.length - 1 ? 'default' : 'pointer',
                                opacity: index === order.length - 1 ? 0.3 : 1
                            }}
                        >
                            ↓
                        </button>
                    </div>
                </div>
            ))}
            <button
                onClick={() => { setOrder(defaultOrder); save(defaultOrder); }}
                style={{ alignSelf: 'flex-start', fontSize: '0.8rem', marginTop: '0.5rem', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}
            >
                Reset to Default
            </button>
        </div>
    );
}

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { theme, setTheme, font, setFont, textSize, setTextSize, neonLightColor, setNeonLightColor, neonDarkColor, setNeonDarkColor } = useSettings();

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="modal-content" style={{
                backgroundColor: 'var(--color-bg-surface)',
                color: 'var(--color-text-main)',
                padding: 'var(--space-6)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                width: '100%',
                maxWidth: '500px',
                border: '1px solid var(--color-border)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                    <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: '600' }}>General Settings</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                        ✕
                    </button>
                </div>

                <div className="settings-group" style={{ marginBottom: 'var(--space-6)' }}>
                    <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>Theme</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)' }}>
                        {(['light', 'dark', 'high-contrast-light', 'high-contrast-dark', 'neon-light', 'neon-dark'] as Theme[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTheme(t)}
                                style={{
                                    padding: 'var(--space-2)',
                                    borderRadius: 'var(--radius-md)',
                                    border: `2px solid ${theme === t ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    backgroundColor: t.includes('dark') || t === 'high-contrast-dark' ? '#333' : '#fff',
                                    color: t.includes('dark') || t === 'high-contrast-dark' ? '#fff' : '#000',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {t.replace(/-/g, ' ')}
                            </button>
                        ))}
                    </div>

                    {/* Neon Color Customization */}
                    {(theme === 'neon-light' || theme === 'neon-dark') && (
                        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <label style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                                Custom Background:
                            </label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="color"
                                    value={theme === 'neon-light' ? neonLightColor : neonDarkColor}
                                    onChange={(e) => theme === 'neon-light' ? setNeonLightColor(e.target.value) : setNeonDarkColor(e.target.value)}
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        padding: '0',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        backgroundColor: 'transparent'
                                    }}
                                />
                                <span style={{ marginLeft: '8px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                                    {theme === 'neon-light' ? neonLightColor : neonDarkColor}
                                </span>
                            </div>
                            <button
                                onClick={() => theme === 'neon-light' ? setNeonLightColor('#fdf2f8') : setNeonDarkColor('#2a0a18')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-primary)',
                                    fontSize: 'var(--text-xs)',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                Reset Color
                            </button>
                        </div>
                    )}
                </div>

                <div className="settings-group" style={{ marginBottom: 'var(--space-6)' }}>
                    <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>Font</h3>
                    <select
                        value={font}
                        onChange={(e) => setFont(e.target.value as Font)}
                        style={{
                            width: '100%',
                            padding: 'var(--space-2)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-app)',
                            color: 'var(--color-text-main)',
                            fontSize: 'var(--text-base)'
                        }}
                    >
                        <option value="Inter">Inter</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Merriweather">Merriweather</option>
                        <option value="Space Mono">Space Mono</option>
                    </select>
                </div>

                <div className="settings-group" style={{ marginBottom: 'var(--space-6)' }}>
                    <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>Text Size</h3>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        {(['sm', 'base', 'lg', 'xl'] as TextSize[]).map((s) => (
                            <button
                                key={s}
                                onClick={() => setTextSize(s)}
                                style={{
                                    flex: 1,
                                    padding: 'var(--space-2)',
                                    borderRadius: 'var(--radius-md)',
                                    border: `2px solid ${textSize === s ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    backgroundColor: 'var(--color-bg-app)',
                                    color: 'var(--color-text-main)',
                                    cursor: 'pointer'
                                }}
                            >
                                {s === 'sm' && 'Small'}
                                {s === 'base' && 'Normal'}
                                {s === 'lg' && 'Large'}
                                {s === 'xl' && 'Extra Large'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="settings-group" style={{ marginBottom: 'var(--space-6)' }}>
                    <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>Sidebar Order (Admin)</h3>
                    <SidebarOrderSettings />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: 'var(--space-2) var(--space-4)',
                            backgroundColor: 'var(--color-primary)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: '500'
                        }}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
