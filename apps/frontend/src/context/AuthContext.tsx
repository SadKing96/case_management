import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Role } from '../../../../packages/shared/src/types';

// Extend User to include role if not already properly typed from shared
// (The shared User interface already has roles: Role[])

interface AuthContextType {
    user: User | null;
    currentRole: Role | null;
    login: (role: Role) => void;
    logout: () => void;
    isAuthenticated: boolean;
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

    const login = (role: Role) => {
        // Mock login - sets a user with the requested role
        const newUser: User = {
            ...MOCK_USER,
            roles: [role] // For simplicity in this mock, assign single role
        };
        setUser(newUser);
        setCurrentRole(role);
        localStorage.setItem('auth_user', JSON.stringify(newUser));
        localStorage.setItem('auth_role', JSON.stringify(role));
    };

    const logout = () => {
        setUser(null);
        setCurrentRole(null);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_role');
    };

    return (
        <AuthContext.Provider value={{
            user,
            currentRole,
            login,
            logout,
            isAuthenticated: !!user
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
