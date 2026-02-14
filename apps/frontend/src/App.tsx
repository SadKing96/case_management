import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppShell } from './components/AppShell';
import { KanbanBoard } from './components/KanbanBoard';
import { TicketList } from './components/TicketList';
import { Login } from './components/Login';
import { CreateCardModal } from './components/CreateCardModal';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BoardsProvider } from './context/BoardsContext';
import { SuperUserDashboard } from './components/SuperUserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { BoardsLanding } from './components/BoardsLanding';
import { UsersList } from './components/UsersList';
import { TeamManagement } from './components/TeamManagement';
import { BoardManagement } from './components/BoardManagement';
import { ArchiveList } from './components/ArchiveList';
import { TrashList } from './components/TrashList';
import { IngressPage } from './components/IngressPage';
import { CardDetailModal } from './components/CardDetailModal';
import { Reports } from './components/Reports';
import { CustomerRequestPage } from './components/CustomerRequestPage';
import { EscalationsPage } from './components/EscalationsPage';
import { LeadershipDashboard } from './components/LeadershipDashboard';
import { CrmImportPage } from './components/CrmImportPage';
import { EmailDashboard } from './components/EmailDashboard';
import { ProjectList } from './components/ProjectList';
import { ProjectTimeline } from './components/ProjectTimeline';
import { GarticaDashboard } from './components/Gartica/GarticaDashboard';
import { GoldenThreadView } from './components/Gartica/GoldenThreadView';
import { OperationsView } from './components/Gartica/OperationsView';
import { AftermarketView } from './components/Gartica/AftermarketView';
import { ErpView } from './components/Gartica/ErpView';
import { EmployeePerformanceView } from './components/Gartica/EmployeePerformanceView';
import { DailyActivityView } from './components/Gartica/DailyActivityView';
import { CapacityView } from './components/Gartica/CapacityView';
import { ComplianceView } from './components/Gartica/ComplianceView';
import { KnowledgeNexusView } from './components/Gartica/KnowledgeNexusView';
import { ProcessMiningView } from './components/Gartica/ProcessMiningView';
import { CustomerHeatmapView } from './components/Gartica/CustomerHeatmapView';
import { ClientDashboard } from './components/ClientDashboard';
import { MockLoginScreen } from './components/MockLoginScreen';
import { Role } from '../../../packages/shared/src/types'; // Relative import

function RequireAuth({ children, allowedRoles }: { children: JSX.Element, allowedRoles?: Role[] }) {
    const { isAuthenticated, currentRole, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles) {
        const userRoles = (user?.roles || []) as string[];
        // Check if ANY of the user's roles (primary or module) match the allowed roles
        // We include currentRole explicitly just in case it's disjoint from user.roles in some edge case
        const hasAccess = allowedRoles.some(role =>
            role === currentRole || userRoles.includes(role)
        );

        if (!hasAccess) {
            // Redirect based on role if trying to access unauthorized area
            if (currentRole === 'SuperUser') return <Navigate to="/superuser" replace />;
            if (currentRole === 'Admin') return <Navigate to="/admin" replace />;

            // Smart redirect for users based on their specific module access
            // Shelved Boards/Customer, redirecting to Gartica
            if (userRoles.includes('Module:Gartica')) return <Navigate to="/gartica" replace />;
            // if (userRoles.includes('Module:Boards')) return <Navigate to="/boards/default" replace />;
            // if (userRoles.includes('Module:Customer')) return <Navigate to="/customer/dashboard" replace />;

            // Fallback - Default to Gartica for POC
            return <Navigate to="/gartica" replace />;
        }
    }

    return children;
}

function AppContent() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const { user, currentRole } = useAuth();
    const location = useLocation();

    const getGreeting = () => {
        const hour = new Date().getHours();
        let greeting = 'Good morning';
        if (hour >= 12 && hour < 18) {
            greeting = 'Good afternoon';
        } else if (hour >= 18 || hour < 5) {
            greeting = 'Good evening';
        }
        return `${greeting}, ${user?.name || 'User'}`;
    };

    return (

        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/portal-login" element={<MockLoginScreen />} />

            {/* Customer / Client Routes */}
            <Route path="/customer" element={<Navigate to="/customer/dashboard" replace />} />
            <Route path="/customer/dashboard" element={
                <RequireAuth allowedRoles={['SuperUser', 'Admin', 'Manager', 'Client']}>
                    <AppShell title="Customer Dashboard">
                        <ClientDashboard />
                    </AppShell>
                </RequireAuth>
            } />
            <Route path="/customer/request" element={
                <RequireAuth allowedRoles={['SuperUser', 'Admin', 'Manager', 'Client']}>
                    <AppShell title="New Request">
                        <CustomerRequestPage />
                    </AppShell>
                </RequireAuth>
            } />

            {/* SuperUser Routes */}
            <Route path="/superuser" element={
                <RequireAuth allowedRoles={['SuperUser']}>
                    <AppShell title="SuperUser Admin" onAccountClick={() => setIsAccountModalOpen(true)}>
                        <SuperUserDashboard />
                    </AppShell>
                </RequireAuth>
            } />
            <Route path="/superuser/users" element={
                <RequireAuth allowedRoles={['SuperUser']}>
                    <AppShell title="User Management" onAccountClick={() => setIsAccountModalOpen(true)}>
                        <UsersList />
                    </AppShell>
                </RequireAuth>
            } />
            <Route path="/superuser/teams" element={
                <RequireAuth allowedRoles={['SuperUser']}>
                    <AppShell title="Team Management" onAccountClick={() => setIsAccountModalOpen(true)}>
                        <TeamManagement />
                    </AppShell>
                </RequireAuth>
            } />
            <Route path="/superuser/boards" element={
                <RequireAuth allowedRoles={['SuperUser']}>
                    <AppShell title="Board Management" onAccountClick={() => setIsAccountModalOpen(true)}>
                        <BoardManagement />
                    </AppShell>
                </RequireAuth>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
                <RequireAuth allowedRoles={['SuperUser', 'Admin']}>
                    <AppShell title="Admin Dashboard" onAccountClick={() => setIsAccountModalOpen(true)}>
                        <AdminDashboard />
                    </AppShell>
                </RequireAuth>
            } />
            <Route path="/admin/users" element={
                <RequireAuth allowedRoles={['SuperUser', 'Admin']}>
                    <AppShell title="User Management" onAccountClick={() => setIsAccountModalOpen(true)}>
                        <UsersList />
                    </AppShell>
                </RequireAuth>
            } />
            <Route path="/admin/teams" element={
                <RequireAuth allowedRoles={['SuperUser', 'Admin']}>
                    <AppShell title="Team Management" onAccountClick={() => setIsAccountModalOpen(true)}>
                        <TeamManagement />
                    </AppShell>
                </RequireAuth>
            } />
            <Route path="/admin/boards" element={
                <RequireAuth allowedRoles={['SuperUser', 'Admin']}>
                    <AppShell title="Board Management" onAccountClick={() => setIsAccountModalOpen(true)}>
                        <BoardManagement />
                    </AppShell>
                </RequireAuth>
            } />

            {/* Users Management Route */}
            <Route path="/users" element={
                <RequireAuth allowedRoles={['SuperUser', 'Admin']}>
                    <AppShell title={getGreeting()} onAccountClick={() => setIsAccountModalOpen(true)}>
                        <UsersList />
                    </AppShell>
                </RequireAuth>
            } />

            {/* Standard App Routes (User/PM) */}
            <Route path="*" element={
                <RequireAuth allowedRoles={['SuperUser', 'Admin', 'User']}>
                    <>
                        <AppShell
                            title={getGreeting()}
                            onAccountClick={() => setIsAccountModalOpen(true)}
                            actions={
                                location.pathname.startsWith('/boards') ? (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setIsCreateModalOpen(true)}
                                    >
                                        + New Card
                                    </button>
                                ) : null
                            }
                        >
                            <Routes>
                                <Route path="/" element={<Navigate to="/gartica" replace />} />
                                <Route path="/boards" element={<BoardsLanding />} />
                                <Route path="/boards/:boardId" element={<KanbanBoard />} />
                                <Route path="/tickets" element={<TicketList />} />
                                <Route path="/escalations" element={<EscalationsPage />} />
                                <Route path="/archive" element={<ArchiveList />} />
                                <Route path="/trash" element={<TrashList />} />
                                <Route path="/ingress" element={<IngressPage />} />
                                <Route path="/reports" element={<Reports />} />
                                <Route path="/trash" element={<TrashList />} />
                                <Route path="/ingress" element={<IngressPage />} />
                                <Route path="/reports" element={<Reports />} />
                                <Route path="/customer-requests" element={<CustomerRequestPage />} />
                                <Route path="/leadership" element={<LeadershipDashboard />} />
                                <Route path="/leadership/crm-import" element={<CrmImportPage />} />
                                <Route path="/leadership/email-dashboard" element={<EmailDashboard />} />

                                <Route path="/gartica" element={
                                    <RequireAuth allowedRoles={['SuperUser', 'Admin', 'Manager', 'User', 'Module:Gartica']}>
                                        <GarticaDashboard />
                                    </RequireAuth>
                                } />
                                <Route path="/gartica/golden-thread" element={
                                    <RequireAuth allowedRoles={['SuperUser', 'Admin', 'Manager', 'User', 'Module:Gartica']}>
                                        <GoldenThreadView />
                                    </RequireAuth>
                                } />
                                <Route path="/gartica/operations" element={
                                    <RequireAuth allowedRoles={['SuperUser', 'Admin', 'Manager', 'User', 'Module:Gartica']}>
                                        <OperationsView />
                                    </RequireAuth>
                                } />
                                <Route path="/gartica/aftermarket" element={
                                    <RequireAuth allowedRoles={['SuperUser', 'Admin', 'Manager', 'User', 'Module:Gartica']}>
                                        <AftermarketView />
                                    </RequireAuth>
                                } />
                                <Route path="/gartica/erp" element={
                                    <RequireAuth allowedRoles={['SuperUser', 'Admin', 'Manager', 'User', 'Module:Gartica']}>
                                        <ErpView />
                                    </RequireAuth>
                                } />
                                <Route path="/gartica/performance" element={
                                    <RequireAuth allowedRoles={['SuperUser', 'Admin', 'Manager', 'User', 'Module:Gartica']}>
                                        <EmployeePerformanceView />
                                    </RequireAuth>
                                } />
                                <Route path="/gartica/daily-activity" element={
                                    <RequireAuth allowedRoles={['SuperUser', 'Admin', 'Manager', 'User', 'Module:Gartica']}>
                                        <DailyActivityView />
                                    </RequireAuth>
                                } />

                                <Route path="/gartica/capacity" element={
                                    <RequireAuth allowedRoles={['SuperUser', 'Admin', 'Manager', 'User', 'Module:Gartica']}>
                                        <CapacityView />
                                    </RequireAuth>
                                } />
                                <Route path="/gartica/compliance" element={
                                    <RequireAuth allowedRoles={['SuperUser', 'Admin', 'Manager', 'User', 'Module:Gartica']}>
                                        <ComplianceView />
                                    </RequireAuth>
                                } />
                                <Route path="/gartica/knowledge" element={
                                    <RequireAuth allowedRoles={['SuperUser', 'Admin', 'Manager', 'User', 'Module:Gartica']}>
                                        <KnowledgeNexusView />
                                    </RequireAuth>
                                } />
                                <Route path="/gartica/process/mining" element={
                                    <RequireAuth allowedRoles={['SuperUser', 'Admin', 'Manager', 'User', 'Module:Gartica']}>
                                        <ProcessMiningView />
                                    </RequireAuth>
                                } />
                                <Route path="/gartica/customer-360" element={
                                    <RequireAuth allowedRoles={['SuperUser', 'Admin', 'Manager', 'User', 'Module:Gartica']}>
                                        <CustomerHeatmapView />
                                    </RequireAuth>
                                } />

                                {/* Client Portal Routes - DEPRECATED/REDIRECT */}
                                <Route path="/gartica/portal" element={<Navigate to="/customer/request" replace />} />
                                <Route path="/gartica/client-dashboard" element={<Navigate to="/customer/dashboard" replace />} />

                                {/* Projects */}
                                <Route path="/projects" element={<ProjectList />} />
                                <Route path="/projects/:id" element={<ProjectTimeline />} />

                                <Route path="*" element={
                                    <div style={{ textAlign: 'center', marginTop: '3rem', color: '#6b7280' }}>
                                        <h2>Page under construction</h2>
                                    </div>
                                } />
                            </Routes>
                        </AppShell>
                        {isCreateModalOpen && (
                            <CreateCardModal
                                onClose={() => setIsCreateModalOpen(false)}
                                // Pass boardId only if we are on a specific board route
                                initialBoardId={
                                    window.location.pathname.match(/\/boards\/([a-zA-Z0-9-]+)/)?.[1]
                                }
                                onSubmit={async (data) => {
                                    try {
                                        // data.boardId comes from CreateCardModal (either selected or initial)
                                        const res = await fetch('http://localhost:3001/api/v1/cases', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': 'Bearer mock-token'
                                            },
                                            body: JSON.stringify(data)
                                        });

                                        if (!res.ok) {
                                            const errData = await res.json().catch(() => ({}));
                                            throw new Error(errData.error?.message || 'Failed to create card');
                                        }

                                        // Refresh
                                        window.location.reload();
                                    } catch (e: any) {
                                        console.error(e);
                                        alert(e.message || 'Failed to create card');
                                    }
                                }}
                            />
                        )}
                        {isAccountModalOpen && (
                            <AccountSettingsModal
                                onClose={() => setIsAccountModalOpen(false)}
                            />
                        )}
                    </>
                </RequireAuth>
            } />
        </Routes>
    );
}

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <AuthProvider>
                    <BoardsProvider>
                        <AppContent />
                    </BoardsProvider>
                </AuthProvider>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;
