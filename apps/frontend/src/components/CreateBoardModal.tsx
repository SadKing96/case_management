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

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ width: '400px' }}>
                <div className="modal-header">
                    <h2>Create New Board</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Board Name</label>
                            <input
                                type="text"
                                required
                                autoFocus
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Marketing Team"
                            />
                        </div>
                        <div className="form-group">
                            <label>Color</label>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {colors.map(c => (
                                    <div
                                        key={c}
                                        onClick={() => setColor(c)}
                                        style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            backgroundColor: c,
                                            cursor: 'pointer',
                                            border: color === c ? '2px solid var(--color-text-main)' : '2px solid transparent',
                                            boxShadow: color === c ? '0 0 0 2px var(--color-bg-surface)' : 'none'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="modal-actions" style={{ padding: '0 1.5rem 1.5rem', marginTop: 0 }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading || !name.trim()}>
                            {loading ? 'Creating...' : 'Create Board'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
