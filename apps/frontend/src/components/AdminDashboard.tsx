import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/variables.css';

export function AdminDashboard() {
    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>Admin Dashboard</h1>
            <p style={{ color: '#666', marginBottom: '2rem' }}>Manage users, teams, and boards.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* Users Card */}
                <Link to="/admin/users" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{
                        padding: '1.5rem',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        cursor: 'pointer'
                    }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
                    >
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                        <h3 style={{ margin: '0 0 0.5rem 0' }}>User Management</h3>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                            Manage users, roles, and access permissions.
                        </p>
                    </div>
                </Link>

                {/* Teams Card */}
                <Link to="/admin/teams" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{
                        padding: '1.5rem',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        cursor: 'pointer'
                    }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
                    >
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏢</div>
                        <h3 style={{ margin: '0 0 0.5rem 0' }}>Team Management</h3>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                            Create and manage teams, assign members.
                        </p>
                    </div>
                </Link>

                {/* Boards Card */}
                <Link to="/admin/boards" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{
                        padding: '1.5rem',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        cursor: 'pointer'
                    }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
                    >
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                        <h3 style={{ margin: '0 0 0.5rem 0' }}>Board Management</h3>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                            Create boards, configure columns, assign default boards.
                        </p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
