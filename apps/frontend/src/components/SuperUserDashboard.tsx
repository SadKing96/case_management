import { Link } from 'react-router-dom';

export function SuperUserDashboard() {
    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    color: 'var(--color-text-main)',
                    marginBottom: '0.5rem',
                    letterSpacing: '-0.02em'
                }}>Superuser Dashboard</h1>
                <p style={{
                    fontSize: '1.1rem',
                    color: 'var(--color-text-secondary)',
                    maxWidth: '600px'
                }}>
                    Central administration for users, teams, and workspace settings.
                </p>
            </div>

            <div style={{ marginBottom: '3rem' }}>
                {/* UsersList moved to /superuser/users to clean up dashboard */}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '2rem'
            }}>
                <DashboardCard
                    to="/superuser/users"
                    icon="👥"
                    title="User Management"
                    description="Manage system users, assigning roles and permissions across the platform."
                    color="var(--color-primary)"
                />
                <DashboardCard
                    to="/superuser/teams"
                    icon="🏢"
                    title="Team Management"
                    description="Organize users into teams for better collaboration and assignment workflows."
                    color="#10b981"
                />
                <DashboardCard
                    to="/superuser/boards"
                    icon="📋"
                    title="Board Management"
                    description="Configure board columns, default settings, and workflow rules."
                    color="#f59e0b"
                />
            </div>
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
        <Link to={to} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
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
        </Link>
    );
}
