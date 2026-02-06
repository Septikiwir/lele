'use client';

import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
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

const CACHED_SESSION_KEY = 'lelefarm_cached_session';

export function AuthProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [cachedUser, setCachedUser] = useState<User | null>(null);
    const isLoading = status === 'loading';

    // Load cached session on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem(CACHED_SESSION_KEY);
            if (cached) {
                try {
                    setCachedUser(JSON.parse(cached));
                } catch (error) {
                    console.error('Failed to parse cached session:', error);
                }
            }
        }
    }, []);

    // Map NextAuth session to our User type
    const user: User | null = session?.user ? {
        id: session.user.id || '',
        name: session.user.name || 'User',
        email: session.user.email || '',
        role: 'admin', // Default role - will be updated when we implement proper roles
        plan: 'Pro Plan'
    } : null;

    // Cache session when online
    useEffect(() => {
        if (user && typeof window !== 'undefined') {
            localStorage.setItem(CACHED_SESSION_KEY, JSON.stringify(user));
            setCachedUser(user);
        }
    }, [user]);

    // Use cached user if offline and no active session
    const effectiveUser = user || cachedUser;
    const isAuthenticated = !!effectiveUser;

    const logout = async () => {
        // Clear cached session
        if (typeof window !== 'undefined') {
            localStorage.removeItem(CACHED_SESSION_KEY);
        }
        setCachedUser(null);
        
        try {
            await signOut({ redirect: false });
        } catch (error) {
            console.error('Logout failed:', error);
        }
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user: effectiveUser, isAuthenticated, isLoading, logout }}>
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
