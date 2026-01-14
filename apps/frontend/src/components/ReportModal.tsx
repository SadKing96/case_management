import React, { useState } from 'react';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (startDate: string, endDate: string) => void;
    reportTitle: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onGenerate, reportTitle }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate(startDate, endDate);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'var(--color-bg-surface)',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                width: '400px',
                border: '1px solid var(--color-border)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
                <h3 style={{ marginTop: 0, color: 'var(--color-text-main)' }}>Generate {reportTitle}</h3>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Start Date</label>
                        <input
                            type="date"
                            required
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-bg-app)',
                                color: 'var(--color-text-main)'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>End Date</label>
                        <input
                            type="date"
                            required
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={{
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-bg-app)',
                                color: 'var(--color-text-main)'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'transparent',
                                color: 'var(--color-text-main)',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                backgroundColor: 'var(--color-primary)',
                                color: '#fff',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            Generate
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
