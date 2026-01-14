import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { Role } from '../../../packages/shared/src/types'; // Relative import

function RequireAuth({ children, allowedRoles }: { children: JSX.Element, allowedRoles?: Role[] }) {
    const { isAuthenticated, currentRole } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && currentRole && !allowedRoles.includes(currentRole)) {
        // Redirect based on role if trying to access unauthorized area
        if (currentRole === 'SuperUser') return <Navigate to="/superuser" replace />;
        if (currentRole === 'Admin') return <Navigate to="/admin" replace />;
        return <Navigate to="/boards/default" replace />;
    }

    return children;
}

function AppContent() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const { user, currentRole } = useAuth();

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
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />

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
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setIsCreateModalOpen(true)}
                                    >
                                        + New Card
                                    </button>
                                }
                            >
                                <Routes>
                                    <Route path="/" element={<Navigate to="/boards" replace />} />
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
        </BrowserRouter>
    );
}

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <BoardsProvider>
                    <AppContent />
                </BoardsProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
