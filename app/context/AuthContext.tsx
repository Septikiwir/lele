'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
    plan?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const isLoading = status === 'loading';

    // Map NextAuth session to our User type
    const user: User | null = session?.user ? {
        id: session.user.id || '',
        name: session.user.name || 'User',
        email: session.user.email || '',
        role: 'admin', // Default role - will be updated when we implement proper roles
        plan: 'Pro Plan'
    } : null;

    const logout = async () => {
        await signOut({ redirect: false });
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!session, isLoading, logout }}>
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
