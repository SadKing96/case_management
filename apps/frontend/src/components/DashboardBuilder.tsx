import React, { useState } from 'react';

export interface DashboardConfigType {
    title: string;
    subtitle: string;
    showWelcome: boolean;
    welcomeMessage: string;
    primaryColor: string;
}

export const defaultConfig: DashboardConfigType = {
    title: 'My Tickets',
    subtitle: 'Track your open requests and orders',
    showWelcome: true,
    welcomeMessage: 'Welcome to your portal',
    primaryColor: '#4f46e5'
};

interface DashboardBuilderProps {
    config: DashboardConfigType;
    onChange: (newConfig: DashboardConfigType) => void;
}

export function DashboardBuilder({ config, onChange }: DashboardBuilderProps) {
    const handleChange = (field: keyof DashboardConfigType, value: any) => {
        onChange({ ...config, [field]: value });
    };

    return (
        <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            marginBottom: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                Dashboard Configuration
            </h3>

            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                <div>
                    <label style={labelStyle}>Page Title</label>
                    <input
                        style={inputStyle}
                        value={config.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                    />
                </div>
                <div>
                    <label style={labelStyle}>Subtitle</label>
                    <input
                        style={inputStyle}
                        value={config.subtitle}
                        onChange={(e) => handleChange('subtitle', e.target.value)}
                    />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={config.showWelcome}
                            onChange={(e) => handleChange('showWelcome', e.target.checked)}
                        />
                        <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Show Welcome Banner</span>
                    </label>
                </div>

                {config.showWelcome && (
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Welcome Message</label>
                        <input
                            style={inputStyle}
                            value={config.welcomeMessage}
                            onChange={(e) => handleChange('welcomeMessage', e.target.value)}
                        />
                    </div>
                )}
                <div>
                    <label style={labelStyle}>Primary Color (Hex)</label>
                    <input
                        type="color"
                        style={{ ...inputStyle, padding: '0px', height: '40px' }}
                        value={config.primaryColor}
                        onChange={(e) => handleChange('primaryColor', e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}

const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.25rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#374151'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '0.9rem'
};
