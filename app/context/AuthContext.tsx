'use client';

import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export type UserRole = 'admin' | 'operator' | 'viewer' | 'SUPERADMIN' | 'OWNER' | 'OPERATOR';

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
    const [user, setUser] = useState<User | null>(null);

    // Fetch actual user data from API to get role
    useEffect(() => {
        if (status !== 'authenticated' || !session?.user?.id) {
            setUser(null);
            return;
        }

        const fetchUserData = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (!res.ok) throw new Error('Failed to fetch user');
                
                const userData = await res.json();
                setUser({
                    id: userData.id || session.user?.id || '',
                    name: userData.name || session.user?.name || 'User',
                    email: userData.email || session.user?.email || '',
                    role: userData.role || 'OWNER',
                    plan: 'Pro Plan'
                });
            } catch (error) {
                console.error('Error fetching user data:', error);
                // Fallback to session data
                setUser({
                    id: session.user?.id || '',
                    name: session.user?.name || 'User',
                    email: session.user?.email || '',
                    role: 'OWNER',
                    plan: 'Pro Plan'
                });
            }
        };

        fetchUserData();
    }, [status, session]);

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
