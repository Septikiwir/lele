'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface User {
    id: string;
    name: string;
    role: UserRole;
    avatar?: string;
    plan?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (role: UserRole) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Check localStorage for existing session
        const storedUser = localStorage.getItem('lele_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (role: UserRole) => {
        let newUser: User;

        switch (role) {
            case 'admin':
                newUser = { id: '1', name: 'Pak Bos', role: 'admin', plan: 'Pro Plan' };
                break;
            case 'operator':
                newUser = { id: '2', name: 'Kang Lele', role: 'operator', plan: 'Team Plan' };
                break;
            case 'viewer':
                newUser = { id: '3', name: 'Pengunjung', role: 'viewer', plan: 'Free Plan' };
                break;
            default:
                newUser = { id: '3', name: 'Pengunjung', role: 'viewer', plan: 'Free Plan' };
        }

        setUser(newUser);
        localStorage.setItem('lele_user', JSON.stringify(newUser));
        router.push('/');
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('lele_user');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
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
