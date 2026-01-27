'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSession } from 'next-auth/react';

// Types matching Prisma schema
export interface Farm {
    id: string;
    nama: string;
    alamat?: string;
    ownerId: string;
    createdAt: string;
    owner?: { id: string; name: string; email: string };
    members?: FarmMember[];
    _count?: { kolam: number };
}

export interface FarmMember {
    id: string;
    role: 'OWNER' | 'ADMIN' | 'OPERATOR' | 'VIEWER';
    userId: string;
    farmId: string;
    user?: { id: string; name: string; email: string };
}

export interface DbKolam {
    id: string;
    farmId: string;
    nama: string;
    panjang: number;
    lebar: number;
    kedalaman: number;
    tanggalTebar: string;
    jumlahIkan: number;
    status: 'AMAN' | 'WASPADA' | 'BERISIKO';
    positionX?: number;
    positionY?: number;
    positionW?: number;
    positionH?: number;
    color?: string;
}

interface FarmContextType {
    // Auth state
    isAuthenticated: boolean;
    isLoading: boolean;

    // Farms
    farms: Farm[];
    activeFarmId: string | null;
    activeFarm: Farm | null;
    setActiveFarmId: (id: string) => void;
    fetchFarms: () => Promise<void>;
    createFarm: (data: { nama: string; alamat?: string }) => Promise<Farm | null>;

    // Kolam
    kolamList: DbKolam[];
    fetchKolam: () => Promise<void>;
    createKolam: (data: Omit<DbKolam, 'id' | 'farmId' | 'status'>) => Promise<DbKolam | null>;
    updateKolam: (id: string, data: Partial<DbKolam>) => Promise<DbKolam | null>;
    deleteKolam: (id: string) => Promise<boolean>;

    // Error handling
    error: string | null;
    clearError: () => void;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export function FarmProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [farms, setFarms] = useState<Farm[]>([]);
    const [activeFarmId, setActiveFarmId] = useState<string | null>(null);
    const [kolamList, setKolamList] = useState<DbKolam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isAuthenticated = status === 'authenticated' && !!session?.user;

    // Fetch farms when authenticated
    const fetchFarms = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            setIsLoading(true);
            const res = await fetch('/api/farms');
            if (!res.ok) throw new Error('Failed to fetch farms');
            const data = await res.json();
            setFarms(data);

            // Auto-select first farm if none selected
            if (data.length > 0 && !activeFarmId) {
                setActiveFarmId(data[0].id);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch farms');
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, activeFarmId]);

    // Fetch kolam for active farm
    const fetchKolam = useCallback(async () => {
        if (!isAuthenticated || !activeFarmId) return;

        try {
            const res = await fetch(`/api/farms/${activeFarmId}/kolam`);
            if (!res.ok) throw new Error('Failed to fetch kolam');
            const data = await res.json();
            setKolamList(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch kolam');
        }
    }, [isAuthenticated, activeFarmId]);

    // Create farm
    const createFarm = async (data: { nama: string; alamat?: string }): Promise<Farm | null> => {
        try {
            const res = await fetch('/api/farms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create farm');
            const farm = await res.json();
            setFarms(prev => [...prev, farm]);
            return farm;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create farm');
            return null;
        }
    };

    // Create kolam
    const createKolam = async (data: Omit<DbKolam, 'id' | 'farmId' | 'status'>): Promise<DbKolam | null> => {
        if (!activeFarmId) return null;

        try {
            const res = await fetch(`/api/farms/${activeFarmId}/kolam`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create kolam');
            const kolam = await res.json();
            setKolamList(prev => [...prev, kolam]);
            return kolam;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create kolam');
            return null;
        }
    };

    // Update kolam
    const updateKolam = async (id: string, data: Partial<DbKolam>): Promise<DbKolam | null> => {
        if (!activeFarmId) return null;

        try {
            const res = await fetch(`/api/farms/${activeFarmId}/kolam/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update kolam');
            const kolam = await res.json();
            setKolamList(prev => prev.map(k => k.id === id ? kolam : k));
            return kolam;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update kolam');
            return null;
        }
    };

    // Delete kolam
    const deleteKolam = async (id: string): Promise<boolean> => {
        if (!activeFarmId) return false;

        try {
            const res = await fetch(`/api/farms/${activeFarmId}/kolam/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete kolam');
            setKolamList(prev => prev.filter(k => k.id !== id));
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete kolam');
            return false;
        }
    };

    const clearError = () => setError(null);

    // Auto-fetch on auth change
    useEffect(() => {
        if (isAuthenticated) {
            fetchFarms();
        }
    }, [isAuthenticated, fetchFarms]);

    // Fetch kolam when active farm changes
    useEffect(() => {
        if (activeFarmId) {
            fetchKolam();
        }
    }, [activeFarmId, fetchKolam]);

    const activeFarm = farms.find(f => f.id === activeFarmId) || null;

    return (
        <FarmContext.Provider value={{
            isAuthenticated,
            isLoading,
            farms,
            activeFarmId,
            activeFarm,
            setActiveFarmId,
            fetchFarms,
            createFarm,
            kolamList,
            fetchKolam,
            createKolam,
            updateKolam,
            deleteKolam,
            error,
            clearError,
        }}>
            {children}
        </FarmContext.Provider>
    );
}

export function useFarm() {
    const context = useContext(FarmContext);
    if (context === undefined) {
        throw new Error('useFarm must be used within a FarmProvider');
    }
    return context;
}
