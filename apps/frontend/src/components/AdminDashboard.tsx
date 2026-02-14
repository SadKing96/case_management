
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AccountProvisioningModal } from './AccountProvisioningModal';
import '../styles/variables.css';

export function AdminDashboard() {
    const { currentRole, user } = useAuth();
    const [showProvisioningModal, setShowProvisioningModal] = useState(false);

    const isSuperUser = currentRole === 'SuperUser' || (user?.roles && user.roles.includes('SuperUser'));

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    color: 'var(--color-text-main)',
                    marginBottom: '0.5rem',
                    letterSpacing: '-0.02em'
                }}>Admin Dashboard</h1>
                <p style={{
                    fontSize: '1.1rem',
                    color: 'var(--color-text-secondary)',
                    maxWidth: '600px'
                }}>
                    Manage users, teams, and boards.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '2rem'
            }}>
                {/* Account Provisioning Card - SuperUser Only */}
                {isSuperUser && (
                    <div
                        onClick={() => setShowProvisioningModal(true)}
                        style={{ cursor: 'pointer' }}
                    >
                        <DashboardCardContent
                            icon="🔐"
                            title="Account Provisioning"
                            description="Create new accounts and assign module access."
                            color="#8b5cf6"
                        />
                    </div>
                )}

                <DashboardCard
                    to="/admin/users"
                    icon="👥"
                    title="User Management"
                    description="Manage users, roles, and access permissions."
                    color="var(--color-primary)"
                />
                <DashboardCard
                    to="/admin/teams"
                    icon="🏢"
                    title="Team Management"
                    description="Create and manage teams, assign members."
                    color="#10b981"
                />
                {/* <DashboardCard
                    to="/admin/boards"
                    icon="📋"
                    title="Board Management"
                    description="Create boards, configure columns, assign default boards."
                    color="#f59e0b"
                /> */}
            </div>

            {showProvisioningModal && (
                <AccountProvisioningModal
                    onClose={() => setShowProvisioningModal(false)}
                    onSuccess={() => {
                        // Optional: Show toast or refresh something?
                        alert('Account created successfully!');
                    }}
                />
            )}
        </div>
    );
}

interface DashboardCardProps {
    to: string;
    icon: string;
    title: string;
    description: string;
    color: string;
}

function DashboardCard({ to, icon, title, description, color }: DashboardCardProps) {
    return (
        <Link to={to} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
            <DashboardCardContent icon={icon} title={title} description={description} color={color} />
        </Link>
    );
}

function DashboardCardContent({ icon, title, description, color }: { icon: string, title: string, description: string, color: string }) {
    return (
        <div
            className="dashboard-card"
            style={{
                padding: '2rem',
                background: 'var(--color-bg-surface)',
                borderRadius: '16px',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-md)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
                e.currentTarget.style.borderColor = color;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.borderColor = 'var(--color-border)';
            }}
        >
            {/* Decorative background accent */}
            <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100px',
                height: '100px',
                background: `linear-gradient(135deg, transparent 50%, ${color}15 50%)`,
                borderTopRightRadius: '16px',
                pointerEvents: 'none'
            }} />

            <div style={{
                marginBottom: '1.5rem',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                backgroundColor: `${color}15`,
                fontSize: '1.5rem',
                color: color
            }}>
                {icon}
            </div>

            <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
                color: 'var(--color-text-main)'
            }}>
                {title}
            </h3>

            <p style={{
                margin: 0,
                color: 'var(--color-text-secondary)',
                lineHeight: '1.6',
                fontSize: '0.95rem'
            }}>
                {description}
            </p>

            <div style={{
                marginTop: 'auto',
                paddingTop: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                color: color,
                fontWeight: 600,
                fontSize: '0.9rem'
            }}>
                Access Module <span style={{ marginLeft: '4px' }}>→</span>
            </div>
        </div>
    );
}
