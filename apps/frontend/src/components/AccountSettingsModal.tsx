import React, { useEffect, useRef } from 'react';
import '../styles/kanban.css';

interface AccountSettingsModalProps {
    onClose: () => void;
}

export function AccountSettingsModal({ onClose }: AccountSettingsModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div className="modal-overlay">
            <div className="modal-content" ref={modalRef} style={{ width: '400px' }}>
                <button className="modal-close-btn" onClick={onClose}>×</button>

                <div className="modal-header">
                    <h2 className="modal-title">Account Settings</h2>
                </div>

                <div className="modal-body">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: '#e2e8f0',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem'
                        }}>
                            👤
                        </div>
                        <button className="btn" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>Change Picture</button>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                            Full Name
                        </label>
                        <input
                            type="text"
                            readOnly
                            value="John MacKenzie"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.875rem',
                                background: '#f8fafc',
                                color: 'var(--color-text-secondary)'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            readOnly
                            value="john.mackenzie@example.com"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.875rem',
                                background: '#f8fafc',
                                color: 'var(--color-text-secondary)'
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
