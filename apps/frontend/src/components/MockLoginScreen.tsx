import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../../../../packages/shared/src/types';


export function MockLoginScreen() {
    const { login } = useAuth();

    const handleLogin = (name: string, company: string) => {
        const mockClient: User = {
            id: `client-${company.toLowerCase()}`,
            name: name,
            email: `${name.toLowerCase().replace(' ', '.')}@${company.toLowerCase()}.com`,
            roles: ['Client'],
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
        };
        login('Client', mockClient);
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: 'var(--color-bg-main)',
            color: 'var(--color-text-main)'
        }}>
            <div style={{
                background: 'var(--color-bg-surface)',
                padding: '3rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                maxWidth: '400px',
                width: '100%',
                textAlign: 'center',
                border: '1px solid var(--color-border)'
            }}>
                <h1 style={{ marginBottom: '0.5rem' }}>Industrial Portal</h1>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                    Sign in to access your dashboard
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button
                        className="btn btn-outline"
                        onClick={() => handleLogin('John Doe', 'Acme Corp')}
                        style={{ padding: '1rem', justifyContent: 'flex-start', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem' }}
                    >
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0D8ABC', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>AC</div>
                        <div>
                            <div style={{ fontWeight: 'bold' }}>Acme Corp</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>John Doe</div>
                        </div>
                    </button>

                    <button
                        className="btn btn-outline"
                        onClick={() => handleLogin('Jane Smith', 'Globex')}
                        style={{ padding: '1rem', justifyContent: 'flex-start', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem' }}
                    >
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#D64545', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>GL</div>
                        <div>
                            <div style={{ fontWeight: 'bold' }}>Globex Inc.</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Jane Smith</div>
                        </div>
                    </button>

                    <div style={{ borderTop: '1px solid var(--color-border)', margin: '1rem 0' }}></div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                        (Mock Login for Demo)
                    </div>
                </div>
            </div>
        </div>
    );
}
