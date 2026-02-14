import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Role } from '../../../../packages/shared/src/types';

// Extend User to include role if not already properly typed from shared
// (The shared User interface already has roles: Role[])

interface AuthContextType {
    user: User | null;
    currentRole: Role | null;
    login: (role: Role, specificUser?: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    impersonateClient: () => void;
    exitImpersonation: () => void;
    isImpersonating: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER: Omit<User, 'roles'> = {
    id: 'mock-user-id',
    name: 'Test User',
    email: 'test@example.com',
    avatarUrl: 'https://ui-avatars.com/api/?name=Test+User&background=random'
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem('auth_user');
        return stored ? JSON.parse(stored) : null;
    });
    const [currentRole, setCurrentRole] = useState<Role | null>(() => {
        const stored = localStorage.getItem('auth_role');
        return stored ? (JSON.parse(stored) as Role) : null;
    });

    const [realUser, setRealUser] = useState<User | null>(() => {
        const stored = localStorage.getItem('auth_real_user');
        return stored ? JSON.parse(stored) : null;
    });
    const [realRole, setRealRole] = useState<Role | null>(() => {
        const stored = localStorage.getItem('auth_real_role');
        return stored ? (JSON.parse(stored) as Role) : null;
    });

    useEffect(() => {
        console.log('AuthProvider Debug: State Changed', { user, currentRole });
    }, [user, currentRole]);

    useEffect(() => {
        console.log('AuthProvider Debug: MOUNTED');
        return () => console.log('AuthProvider Debug: UNMOUNTED');
    }, []);

    const login = (role: Role, specificUser?: User) => {
        // Mock login - sets a user with the requested role
        const newUser: User = specificUser || {
            ...MOCK_USER,
            roles: [role]
        };
        setUser(newUser);
        setCurrentRole(role);
        localStorage.setItem('auth_user', JSON.stringify(newUser));
        localStorage.setItem('auth_role', JSON.stringify(role));
    };

    const logout = () => {
        setUser(null);
        setCurrentRole(null);
        setRealUser(null);
        setRealRole(null);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_role');
        localStorage.removeItem('auth_real_user');
        localStorage.removeItem('auth_real_role');
    };

    const impersonateClient = () => {
        if (!user || currentRole === 'Client') return;

        // Save state
        setRealUser(user);
        setRealRole(currentRole);
        localStorage.setItem('auth_real_user', JSON.stringify(user));
        localStorage.setItem('auth_real_role', JSON.stringify(currentRole));

        // Switch to Client
        const clientUser: User = {
            id: 'mock-client-id',
            name: 'Mock Customer (Acme)',
            email: 'customer@acme.com',
            roles: ['Client'],
            avatarUrl: 'https://ui-avatars.com/api/?name=Acme+Corp&background=0D8ABC&color=fff'
        };
        login('Client', clientUser);
    };

    const exitImpersonation = () => {
        if (!realUser || !realRole) return;

        setUser(realUser);
        setCurrentRole(realRole);
        localStorage.setItem('auth_user', JSON.stringify(realUser));
        localStorage.setItem('auth_role', JSON.stringify(realRole));

        // Clear backup
        setRealUser(null);
        setRealRole(null);
        localStorage.removeItem('auth_real_user');
        localStorage.removeItem('auth_real_role');
    };

    return (
        <AuthContext.Provider value={{
            user,
            currentRole,
            login,
            logout,
            isAuthenticated: !!user,
            impersonateClient,
            exitImpersonation,
            isImpersonating: !!realUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
