import React, { useState } from 'react';
import '../styles/kanban.css';

interface CreateBoardModalProps {
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
}

export function CreateBoardModal({ onClose, onSubmit }: CreateBoardModalProps) {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#3b82f6');
    const [loading, setLoading] = useState(false);

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit({ name, color });
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to create board');
        } finally {
            setLoading(false);
        }
    };

    // Styles matching BoardManagement
    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.75rem 1rem',
        background: 'rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        color: '#fff',
        outline: 'none',
        fontSize: '0.95rem',
        marginTop: '0.5rem'
    };

    const btnPrimaryStyle: React.CSSProperties = {
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        color: 'white',
        border: 'none',
        padding: '0.75rem 1.5rem',
        borderRadius: '8px',
        fontWeight: 600,
        cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
        opacity: loading || !name.trim() ? 0.7 : 1,
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
        fontSize: '0.95rem'
    };

    const btnSecondaryStyle: React.CSSProperties = {
        background: 'transparent',
        color: '#94a3b8',
        border: 'none',
        padding: '0.75rem 1.5rem',
        fontWeight: 500,
        cursor: 'pointer',
        fontSize: '0.95rem'
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{
                width: '450px',
                background: '#1e293b', /* Slate 800 base */
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
                color: '#fff'
            }}>
                <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff' }}>Create New Board</h2>
                    <button
                        className="close-btn"
                        onClick={onClose}
                        style={{ color: '#94a3b8', fontSize: '1.5rem' }}
                    >
                        &times;
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ padding: '2rem' }}>
                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.02em' }}>BOARD NAME</label>
                            <input
                                type="text"
                                required
                                autoFocus
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Marketing Launch"
                                style={{
                                    ...inputStyle,
                                    borderLeft: `4px solid ${color}`
                                }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.02em' }}>THEME COLOR</label>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                {colors.map(c => (
                                    <div
                                        key={c}
                                        onClick={() => setColor(c)}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            backgroundColor: c,
                                            cursor: 'pointer',
                                            border: color === c ? '2px solid #fff' : '2px solid transparent',
                                            boxShadow: color === c ? `0 0 12px ${c}` : 'none',
                                            transition: 'all 0.2s',
                                            transform: color === c ? 'scale(1.1)' : 'scale(1)'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="modal-actions" style={{
                        padding: '1.5rem 2rem',
                        marginTop: 0,
                        background: 'rgba(0,0,0,0.2)',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '1rem'
                    }}>
                        <button type="button" style={btnSecondaryStyle} onClick={onClose}>Cancel</button>
                        <button type="submit" style={btnPrimaryStyle} disabled={loading || !name.trim()}>
                            {loading ? 'Creating...' : 'Create Board'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
