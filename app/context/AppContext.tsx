'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from './ToastContext';

// Types
export interface Kolam {
    id: string;
    nama: string;
    panjang: number;
    lebar: number;
    kedalaman: number;
    tanggalTebar: string | null;
    jumlahIkan: number;
    status: 'aman' | 'waspada' | 'berisiko';
    position?: {
        x: number;
        y: number;
        w: number;
        h: number;
        color?: string;
    }
}

export interface DataPakan {
    id: string;
    kolamId: string;
    tanggal: string;
    jumlahKg: number;
    jenisPakan: string;
}

export interface KondisiAir {
    id: string;
    kolamId: string;
    tanggal: string;
    warna: string;
    bau: string;
    ketinggian: number;
    ph?: number;
    suhu?: number;
}

export type KategoriPengeluaran = 'BIBIT' | 'PAKAN' | 'OBAT' | 'LISTRIK' | 'TENAGA_KERJA' | 'LAINNYA';

export interface Pengeluaran {
    id: string;
    kolamId: string | null;
    tanggal: string;
    kategori: KategoriPengeluaran;
    keterangan: string;
    jumlah: number;
}

export interface StokPakan {
    id: string;
    jenisPakan: string;
    stokAwal: number;
    hargaPerKg: number;
    tanggalTambah: string;
    keterangan?: string;
}

export type TipePembeli = 'TENGKULAK' | 'PASAR' | 'RESTORAN' | 'LAINNYA';

export interface Pembeli {
    id: string;
    nama: string;
    tipe: TipePembeli;
    kontak?: string;
    alamat?: string;
}

export interface Penjualan {
    id: string;
    kolamId: string;
    pembeliId: string;
    tanggal: string;
    beratKg: number;
    hargaPerKg: number;
    jumlahIkan?: number;
    keterangan?: string;
}

export interface JadwalPakan {
    id: string;
    kolamId: string;
    waktu: string;
    jenisPakan: string;
    jumlahKg: number;
    keterangan?: string;
    aktif: boolean;
}

export type TipePanen = 'PARSIAL' | 'TOTAL';

export interface RiwayatPanen {
    id: string;
    kolamId: string;
    kolam?: { nama: string };
    tanggal: string;
    beratTotalKg: number;
    jumlahEkor: number;
    hargaPerKg: number;
    tipe: TipePanen;
    catatan?: string;
}

export interface RiwayatIkan {
    id: string;
    kolamId: string;
    tanggal: string;
    jumlahPerubahan: number;
    jumlahAkhir: number;
    keterangan: string;
}

export interface RiwayatSampling {
    id: string;
    kolamId: string;
    tanggal: string;
    jumlahIkanPerKg: number;
    catatan?: string;
}

export interface CycleSummary {
    kolamId: string;
    cycleNumber: number; // Added: Order of the cycle (1, 2, 3...)
    startDate: string;
    endDate: string;
    totalDays: number;
    initialFish: number;
    finalFish: number;
    totalFeedKg: number;
    totalFeedCost: number;
    totalHarvestKg: number;
    totalHarvestRevenue: number; // Operational (non-feed)
    totalExpenses: number;
    netProfit: number;
    fcr: number;
    sr: number; // Survival Rate
    adjustmentNet: number; // Net change from manual adjustments (deaths/corrections)
    isActive: boolean;
    startId?: string; // Optional ID of the start event (Tebar)
    lastInputTime?: string; // Timestamp of the last data entry for this cycle
}

export interface Activity {
    id: string;
    type: 'PAKAN' | 'PANEN' | 'KEMATIAN' | 'TEBAR' | 'SAMPLING' | 'LAINNYA';
    date: string; // ISO Date string (YYYY-MM-DD or ISO)
    title: string;
    description: string;
    kolamName: string;
    kolamId: string;
}

// Context Type
interface AppContextType {
    // Data
    kolam: Kolam[];
    pakan: DataPakan[];
    kondisiAir: KondisiAir[];
    pengeluaran: Pengeluaran[];
    stokPakan: StokPakan[];
    pembeli: Pembeli[];
    penjualan: Penjualan[];
    jadwalPakan: JadwalPakan[];
    riwayatPanen: RiwayatPanen[];
    riwayatIkan: RiwayatIkan[];
    riwayatSampling: RiwayatSampling[];

    // Farm
    activeFarmId: string | null;
    isLoading: boolean;

    // Kolam CRUD
    addKolam: (kolam: Omit<Kolam, 'id' | 'status'>) => Promise<void>;
    updateKolam: (id: string, kolam: Partial<Kolam>) => Promise<void>;
    deleteKolam: (id: string) => Promise<void>;

    // Pakan
    addPakan: (pakan: Omit<DataPakan, 'id'>) => Promise<void>;

    // Kondisi Air
    addKondisiAir: (kondisi: Omit<KondisiAir, 'id'>) => Promise<void>;

    // Pengeluaran
    addPengeluaran: (pengeluaran: Omit<Pengeluaran, 'id'>) => Promise<void>;
    deletePengeluaran: (id: string) => void;

    // Stok Pakan
    addStokPakan: (stok: Omit<StokPakan, 'id'>) => Promise<void>;
    deleteStokPakan: (id: string) => void;

    // Pembeli
    addPembeli: (pembeli: Omit<Pembeli, 'id'>) => Promise<Pembeli | undefined>;
    deletePembeli: (id: string) => void;

    // Penjualan
    addPenjualan: (penjualan: Omit<Penjualan, 'id'>) => Promise<void>;
    deletePenjualan: (id: string) => void;

    // Jadwal Pakan
    addJadwalPakan: (jadwal: Omit<JadwalPakan, 'id'>) => Promise<void>;
    updateJadwalPakan: (id: string, updates: Partial<JadwalPakan>) => void;
    deleteJadwalPakan: (id: string) => void;
    getJadwalByKolam: (kolamId: string) => JadwalPakan[];

    // Panen
    addRiwayatPanen: (panen: Omit<RiwayatPanen, 'id'>) => Promise<void>;
    deleteRiwayatPanen: (id: string) => void;
    getPanenByKolam: (kolamId: string) => RiwayatPanen[];

    // Riwayat Ikan (Fish History)
    addRiwayatIkan: (history: Omit<RiwayatIkan, 'id' | 'jumlahAkhir'>) => Promise<void>;
    getRiwayatIkanByKolam: (kolamId: string) => RiwayatIkan[];

    // Sampling (Biomass)
    addRiwayatSampling: (sampling: Omit<RiwayatSampling, 'id'>) => Promise<void>;
    getSamplingByKolam: (kolamId: string) => RiwayatSampling[];
    getLatestSampling: (kolamId: string) => RiwayatSampling | undefined;
    calculateBiomass: (kolamId: string) => { totalBiomass: number; density: number; averageWeight: number };
    getUnifiedStatus: (kolamId: string) => { status: 'aman' | 'waspada' | 'berisiko'; kepadatanEkor: number; kepadatanBerat: number; source: 'ekor' | 'berat' };

    // Helper functions
    getKolamById: (id: string) => Kolam | undefined;
    getPakanByKolam: (kolamId: string) => DataPakan[];
    getKondisiAirByKolam: (kolamId: string) => KondisiAir[];
    getPengeluaranByKolam: (kolamId: string) => Pengeluaran[];
    getTotalPengeluaranByKolam: (kolamId: string) => number;
    getTotalPengeluaranByKategori: (kolamId: string, kategori: KategoriPengeluaran) => number;
    getStokTersediaByJenis: (jenisPakan: string) => number;
    getAllJenisPakan: () => string[];
    getPenjualanByKolam: (kolamId: string) => Penjualan[];
    getTotalPenjualanByKolam: (kolamId: string) => number;
    getTotalPenjualan: () => number;
    getProfitByKolam: (kolamId: string) => number;
    calculateKepadatan: (kolam: Kolam) => number;
    calculateFCR: (kolamId: string) => number;

    // UI State
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;

    // Harga Pasar
    hargaPasarPerKg: number;
    setHargaPasarPerKg: (harga: number) => void;

    // Tebar
    tebarBibit: (kolamId: string, data: { tanggal: string; jumlah: number; beratPerEkor: number; hargaPerEkor: number }) => Promise<void>;

    // Refresh
    refreshData: () => Promise<void>;

    // Feed Recommendation Helper
    getFeedRecommendation: (weightGrams: number, biomassKg: number) => { type: string; amount: string; ratePercent: string };

    // Cycle Analysis
    getCycleSummary: (kolamId: string) => CycleSummary | null;
    getCycleHistory: (kolamId: string) => CycleSummary[];

    // Dashboard Helpers
    getFeedTrend: (days?: number) => { date: string; amount: number }[];
    calculateTotalAssetValue: (pricePerKg: number) => number;
    // Predictive Analytics
    predictHarvestDate: (kolamId: string) => { daysRemaining: number; date: string; currentWeight: number; targetReached: boolean };
    calculateProjectedProfit: (kolamId: string) => { revenue: number; cost: number; profit: number; roi: number };
    detectAppetiteDrop: (kolamId: string) => { hasDrop: boolean; dropPercent: number; diff: number };
    getRecentActivities: (limit?: number) => Activity[];

    // Smart Feed
    getDailyFeedStatus: (kolamId: string) => {
        target: number;
        actual: number;
        remaining: number;
        progress: number;
        status: 'cukup' | 'kurang' | 'berlebih';
        schedule: {
            morning: { time: string; amount: number; isNext: boolean };
            evening: { time: string; amount: number; isNext: boolean };
            next: string; // 'Pagi' | 'Sore' | 'Besok'
        }
    };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to map DB status to local status
function mapStatus(status: string): 'aman' | 'waspada' | 'berisiko' {
    const s = status?.toLowerCase();
    if (s === 'aman') return 'aman';
    if (s === 'waspada') return 'waspada';
    return 'berisiko';
}

// Helper to map DB kolam to local kolam
function mapKolam(dbKolam: Record<string, unknown>): Kolam {
    return {
        id: dbKolam.id as string,
        nama: dbKolam.nama as string,
        panjang: dbKolam.panjang as number,
        lebar: dbKolam.lebar as number,
        kedalaman: dbKolam.kedalaman as number,
        tanggalTebar: !dbKolam.tanggalTebar ? null : typeof dbKolam.tanggalTebar === 'string'
            ? dbKolam.tanggalTebar.split('T')[0]
            : new Date(dbKolam.tanggalTebar as string).toISOString().split('T')[0],
        jumlahIkan: dbKolam.jumlahIkan as number,
        status: mapStatus(dbKolam.status as string),
        position: dbKolam.positionX != null ? {
            x: dbKolam.positionX as number,
            y: dbKolam.positionY as number,
            w: dbKolam.positionW as number || 2,
            h: dbKolam.positionH as number || 2,
            color: dbKolam.color as string || undefined
        } : undefined
    };
}

export function AppProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const isAuthenticated = status === 'authenticated';

    const { showToast } = useToast();
    const [activeFarmId, setActiveFarmId] = useState<string | null>(null);
    const [kolam, setKolam] = useState<Kolam[]>([]);
    const [pakan, setPakan] = useState<DataPakan[]>([]);
    const [kondisiAir, setKondisiAir] = useState<KondisiAir[]>([]);
    const [pengeluaran, setPengeluaran] = useState<Pengeluaran[]>([]);
    const [stokPakan, setStokPakan] = useState<StokPakan[]>([]);
    const [pembeli, setPembeli] = useState<Pembeli[]>([]);
    const [penjualan, setPenjualan] = useState<Penjualan[]>([]);
    const [jadwalPakan, setJadwalPakan] = useState<JadwalPakan[]>([]);
    const [riwayatPanen, setRiwayatPanen] = useState<RiwayatPanen[]>([]);
    const [riwayatIkan, setRiwayatIkan] = useState<RiwayatIkan[]>([]);
    const [riwayatSampling, setRiwayatSampling] = useState<RiwayatSampling[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [hargaPasarPerKg, setHargaPasarPerKg] = useState(35000); // Default Rp 35.000/kg

    // Optimistic Update Helpers
    const pendingRequestIds = React.useRef<Record<string, number>>({});

    // Fetch active farm
    const fetchFarm = useCallback(async () => {
        if (!isAuthenticated) {
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/farms');
            if (res.ok) {
                const farms = await res.json();
                if (farms.length > 0) {
                    setActiveFarmId(farms[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch farms:', error);
        }
    }, [isAuthenticated]);

    // Fetch critical data (Kolam) first to unblock UI
    const fetchCriticalData = useCallback(async () => {
        if (!activeFarmId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const kolamRes = await fetch(`/api/farms/${activeFarmId}/kolam`);
            if (kolamRes.ok) {
                const data = await kolamRes.json();
                setKolam(data.map(mapKolam));
            }
        } catch (error) {
            console.error('Failed to fetch critical data:', error);
        } finally {
            // Critical data loaded, unblock UI immediately
            setIsLoading(false);
            // Trigger secondary fetch in background
            fetchSecondaryData();
        }
    }, [activeFarmId]);

    // Fetch secondary data in background
    const fetchSecondaryData = useCallback(async () => {
        if (!activeFarmId) return;

        try {
            const [
                pakanRes,
                stokPakanRes,
                kondisiAirRes,
                pengeluaranRes,
                pembeliRes,
                penjualanRes,
                jadwalRes,
                panenRes,
                riwayatIkanRes,
                samplingRes
            ] = await Promise.all([
                fetch(`/api/farms/${activeFarmId}/pakan`),
                fetch(`/api/farms/${activeFarmId}/stok-pakan`),
                fetch(`/api/farms/${activeFarmId}/kondisi-air`),
                fetch(`/api/farms/${activeFarmId}/pengeluaran`),
                fetch(`/api/farms/${activeFarmId}/pembeli`),
                fetch(`/api/farms/${activeFarmId}/penjualan`),
                fetch(`/api/farms/${activeFarmId}/jadwal-pakan`),
                fetch(`/api/farms/${activeFarmId}/riwayat-panen`),
                fetch(`/api/farms/${activeFarmId}/riwayat-ikan`),
                fetch(`/api/farms/${activeFarmId}/sampling`)
            ]);

            if (pakanRes.ok) {
                const data = await pakanRes.json();
                setPakan(data.map((p: Record<string, unknown>) => ({
                    ...p,
                    tanggal: (p.tanggal as string).split('T')[0]
                })));
            }
            if (stokPakanRes.ok) {
                const data = await stokPakanRes.json();
                setStokPakan(data.map((s: Record<string, unknown>) => ({
                    ...s,
                    tanggalTambah: (s.tanggalTambah as string).split('T')[0]
                })));
            }
            if (kondisiAirRes.ok) {
                const data = await kondisiAirRes.json();
                setKondisiAir(data.map((k: Record<string, unknown>) => ({
                    ...k,
                    tanggal: (k.tanggal as string).split('T')[0]
                })));
            }
            if (pengeluaranRes.ok) {
                const data = await pengeluaranRes.json();
                setPengeluaran(data.map((p: any) => ({
                    ...p,
                    tanggal: (p.tanggal as string).split('T')[0],
                    kategori: p.kategori
                })));
            }
            if (pembeliRes.ok) {
                const data = await pembeliRes.json();
                setPembeli(data);
            }
            if (penjualanRes.ok) {
                const data = await penjualanRes.json();
                setPenjualan(data.map((p: Record<string, unknown>) => ({
                    ...p,
                    tanggal: (p.tanggal as string).split('T')[0]
                })));
            }
            if (jadwalRes.ok) {
                const data = await jadwalRes.json();
                setJadwalPakan(data);
            }
            if (panenRes.ok) {
                const data = await panenRes.json();
                setRiwayatPanen(data.map((p: any) => ({
                    ...p,
                    tanggal: p.tanggal, // Keep full ISO string
                    tipe: p.tipe
                })));
            }
            if (riwayatIkanRes.ok) {
                const data = await riwayatIkanRes.json();
                setRiwayatIkan(data.map((r: any) => ({
                    ...r,
                    tanggal: new Date(r.tanggal).toISOString().split('T')[0]
                })));
            }
            if (samplingRes.ok) {
                const data = await samplingRes.json();
                setRiwayatSampling(data.map((s: any) => ({
                    ...s,
                    tanggal: new Date(s.tanggal).toISOString()
                })));
            }
        } catch (error) {
            console.error('Failed to fetch secondary data:', error);
        }
    }, [activeFarmId]);


    // Load sidebar state from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('lele_sidebar_collapsed');
            if (saved) setIsSidebarCollapsed(JSON.parse(saved));
        }
    }, []);

    // Save sidebar state
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('lele_sidebar_collapsed', JSON.stringify(isSidebarCollapsed));
        }
    }, [isSidebarCollapsed]);

    // Fetch farm on auth
    useEffect(() => {
        fetchFarm();
    }, [fetchFarm]);

    // Fetch data when farm changes
    useEffect(() => {
        fetchCriticalData();
    }, [fetchCriticalData]);

    const refreshData = async () => {
        await fetchCriticalData();
    };

    // === CRUD Operations ===

    const addKolam = async (newKolam: Omit<Kolam, 'id' | 'status'>) => {
        if (!activeFarmId) return;

        try {
            const res = await fetch(`/api/farms/${activeFarmId}/kolam`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newKolam)
            });
            if (res.ok) {
                const created = await res.json();
                setKolam(prev => [...prev, mapKolam(created)]);
            }
        } catch (error) {
            console.error('Failed to add kolam:', error);
        }
    };

    const updateKolam = async (id: string, updates: Partial<Kolam>) => {
        if (!activeFarmId) return;

        // 1. Store previous state for revert
        const previousKolam = [...kolam];

        // Optimistic Update: Increment request version for this id
        const requestId = (pendingRequestIds.current[id] || 0) + 1;
        pendingRequestIds.current[id] = requestId;

        // 2. Optimistic Update
        setKolam(prev => prev.map(k => {
            if (k.id === id) {
                const updated = { ...k, ...updates };
                // Ensure position is correctly merged if it exists in updates
                if (updates.position) {
                    updated.position = { ...k.position, ...updates.position };
                }
                return updated;
            }
            return k;
        }));

        // Map position to DB fields for API
        const dbUpdates: Record<string, unknown> = { ...updates };
        if (updates.position) {
            if (updates.position.x !== undefined) dbUpdates.positionX = updates.position.x;
            if (updates.position.y !== undefined) dbUpdates.positionY = updates.position.y;
            if (updates.position.w !== undefined) dbUpdates.positionW = updates.position.w;
            if (updates.position.h !== undefined) dbUpdates.positionH = updates.position.h;
            if (updates.position.color !== undefined) dbUpdates.color = updates.position.color;
            delete dbUpdates.position;
        }

        if (updates.status) {
            dbUpdates.status = updates.status.toUpperCase();
        }

        try {
            const res = await fetch(`/api/farms/${activeFarmId}/kolam/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dbUpdates)
            });

            if (!res.ok) {
                throw new Error('Failed to update kolam on server');
            }

            // Sync only if this is still the LATEST request
            if (pendingRequestIds.current[id] === requestId) {
                const updated = await res.json();
                setKolam(prev => prev.map(k => k.id === id ? mapKolam(updated) : k));
            }
        } catch (error) {
            console.error('Failed to update kolam:', error);
            // Revert only if this is still the LATEST request
            if (pendingRequestIds.current[id] === requestId) {
                setKolam(previousKolam);
                showToast('Gagal memperbarui data kolam. Perubahan dibatalkan.', 'error');
            }
        }
    };

    const deleteKolam = async (id: string) => {
        if (!activeFarmId) return;

        try {
            const res = await fetch(`/api/farms/${activeFarmId}/kolam/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setKolam(prev => prev.filter(k => k.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete kolam:', error);
        }
    };

    const addPakan = async (newPakan: Omit<DataPakan, 'id'>) => {
        if (!activeFarmId) return;

        try {
            const res = await fetch(`/api/farms/${activeFarmId}/pakan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPakan)
            });
            if (res.ok) {
                const created = await res.json();
                setPakan(prev => [...prev, { ...created, tanggal: created.tanggal.split('T')[0] }]);

                // Tambahkan ke pengeluaran juga
                const stok = stokPakan.find(s => s.jenisPakan === newPakan.jenisPakan);
                if (stok) {
                    const totalBiaya = newPakan.jumlahKg * stok.hargaPerKg;
                    await addPengeluaran({
                        kolamId: newPakan.kolamId,
                        tanggal: newPakan.tanggal,
                        kategori: 'PAKAN',
                        keterangan: `Pakan ${newPakan.jenisPakan} - ${newPakan.jumlahKg} kg`,
                        jumlah: totalBiaya
                    });
                }
            }
        } catch (error) {
            console.error('Failed to add pakan:', error);
        }
    };

    const addKondisiAir = async (newKondisi: Omit<KondisiAir, 'id'>) => {
        if (!activeFarmId) return;

        try {
            const res = await fetch(`/api/farms/${activeFarmId}/kondisi-air`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newKondisi)
            });
            if (res.ok) {
                const created = await res.json();
                setKondisiAir(prev => [...prev, { ...created, tanggal: created.tanggal.split('T')[0] }]);
            }
        } catch (error) {
            console.error('Failed to add kondisi air:', error);
        }
    };

    const addPengeluaran = async (newPengeluaran: Omit<Pengeluaran, 'id'>) => {
        console.log('addPengeluaran called', { activeFarmId, newPengeluaran });
        if (!activeFarmId) {
            console.error('No activeFarmId found');
            return;
        }

        try {
            const res = await fetch(`/api/farms/${activeFarmId}/pengeluaran`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPengeluaran)
            });
            if (res.ok) {
                const created = await res.json();
                setPengeluaran(prev => [...prev, {
                    ...created,
                    tanggal: created.tanggal.split('T')[0],
                    kategori: created.kategori
                }]);
            }
        } catch (error) {
            console.error('Failed to add pengeluaran:', error);
        }
    };

    const deletePengeluaran = (id: string) => {
        setPengeluaran(prev => prev.filter(p => p.id !== id));
    };

    const addStokPakan = async (newStok: Omit<StokPakan, 'id'>) => {
        if (!activeFarmId) return;

        try {
            const res = await fetch(`/api/farms/${activeFarmId}/stok-pakan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStok)
            });
            if (res.ok) {
                const created = await res.json();
                setStokPakan(prev => [...prev, { ...created, tanggalTambah: created.tanggalTambah.split('T')[0] }]);
            }
        } catch (error) {
            console.error('Failed to add stok pakan:', error);
        }
    };

    const deleteStokPakan = (id: string) => {
        setStokPakan(prev => prev.filter(s => s.id !== id));
    };

    const addPembeli = async (newPembeli: Omit<Pembeli, 'id'>) => {
        if (!activeFarmId) return;

        try {
            const res = await fetch(`/api/farms/${activeFarmId}/pembeli`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPembeli)
            });
            if (res.ok) {
                const created = await res.json();
                setPembeli(prev => [...prev, created]);
                return created; // Return created object
            }
        } catch (error) {
            console.error('Failed to add pembeli:', error);
            throw error;
        }
    };

    const deletePembeli = (id: string) => {
        setPembeli(prev => prev.filter(p => p.id !== id));
    };

    const addPenjualan = async (newPenjualan: Omit<Penjualan, 'id'>) => {
        if (!activeFarmId) return;

        try {
            const res = await fetch(`/api/farms/${activeFarmId}/penjualan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPenjualan)
            });
            if (res.ok) {
                const created = await res.json();
                setPenjualan(prev => [...prev, { ...created, tanggal: created.tanggal.split('T')[0] }]);
            }
        } catch (error) {
            console.error('Failed to add penjualan:', error);
        }
    };

    const deletePenjualan = (id: string) => {
        setPenjualan(prev => prev.filter(p => p.id !== id));
    };

    const addJadwalPakan = async (newJadwal: Omit<JadwalPakan, 'id'>) => {
        if (!activeFarmId) return;

        try {
            const res = await fetch(`/api/farms/${activeFarmId}/jadwal-pakan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newJadwal)
            });
            if (res.ok) {
                const created = await res.json();
                setJadwalPakan(prev => [...prev, created]);
            }
        } catch (error) {
            console.error('Failed to add jadwal pakan:', error);
        }
    };

    const updateJadwalPakan = (id: string, updates: Partial<JadwalPakan>) => {
        setJadwalPakan(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
    };

    const deleteJadwalPakan = (id: string) => {
        setJadwalPakan(prev => prev.filter(j => j.id !== id));
    };

    const addRiwayatPanen = async (newPanen: Omit<RiwayatPanen, 'id'>) => {
        if (!activeFarmId) return;

        try {
            const res = await fetch(`/api/farms/${activeFarmId}/riwayat-panen`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPanen)
            });
            if (res.ok) {
                const created = await res.json();
                setRiwayatPanen(prev => [...prev, {
                    ...created,
                    tanggal: created.tanggal, // Keep full ISO string
                    tipe: created.tipe
                }]);
                // Refresh kolam to get updated fish count
                await refreshData();
            } else {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to add harvest record');
            }
        } catch (error) {
            console.error('Failed to add riwayat panen:', error);
            throw error;
        }
    };

    const deleteRiwayatPanen = (id: string) => {
        setRiwayatPanen(prev => prev.filter(p => p.id !== id));
    };

    const addRiwayatIkan = async (newHistory: Omit<RiwayatIkan, 'id' | 'jumlahAkhir'>) => {
        if (!activeFarmId) return;

        try {
            const res = await fetch(`/api/farms/${activeFarmId}/riwayat-ikan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newHistory)
            });
            if (res.ok) {
                const result = await res.json();
                // This updates both history and kolam (fish count)
                // We need to refresh data or manually update local state

                // Add to history
                setRiwayatIkan(prev => [{
                    ...result.history, // Assuming API returns history object in result or is the result
                    id: result.id,
                    kolamId: result.kolamId,
                    tanggal: new Date(result.tanggal).toISOString().split('T')[0],
                    jumlahPerubahan: result.jumlahPerubahan,
                    jumlahAkhir: result.jumlahAkhir,
                    keterangan: result.keterangan
                }, ...prev]);

                // Update kolam count
                setKolam(prev => prev.map(k => {
                    if (k.id === newHistory.kolamId) {
                        return { ...k, jumlahIkan: k.jumlahIkan + newHistory.jumlahPerubahan };
                    }
                    return k;
                }));
            } else {
                const errorText = await res.text();
                console.error("Server API Error (addRiwayatIkan):", errorText);
                throw new Error(errorText || "Failed to add riwayat ikan");
            }
        } catch (error) {
            console.error('Failed to add riwayat ikan:', error);
            throw error; // Propagate to caller
        }
    };

    const getRiwayatIkanByKolam = (kolamId: string) =>
        riwayatIkan.filter(r => r.kolamId === kolamId).sort((a, b) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        );

    const addRiwayatSampling = async (newSampling: Omit<RiwayatSampling, 'id'>) => {
        if (!activeFarmId) return;
        try {
            const res = await fetch(`/api/farms/${activeFarmId}/kolam/${newSampling.kolamId}/sampling`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSampling)
            });
            if (res.ok) {
                const created = await res.json();
                setRiwayatSampling(prev => [...prev, {
                    ...created,
                    tanggal: new Date(created.tanggal).toISOString()
                }]);
            }
        } catch (error) {
            console.error('Failed to add sampling:', error);
        }
    };

    const getSamplingByKolam = (kolamId: string) =>
        riwayatSampling.filter(s => s.kolamId === kolamId).sort((a, b) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        );

    const getLatestSampling = (kolamId: string) => {
        const samples = getSamplingByKolam(kolamId);
        return samples.length > 0 ? samples[0] : undefined;
    };

    const calculateBiomass = (kolamId: string) => {
        const kolam = getKolamById(kolamId);
        const sampling = getLatestSampling(kolamId);

        if (!kolam || !sampling || sampling.jumlahIkanPerKg <= 0) {
            return { totalBiomass: 0, density: 0, averageWeight: 0 };
        }

        const averageWeight = 1 / sampling.jumlahIkanPerKg; // kg
        const totalBiomass = kolam.jumlahIkan * averageWeight; // kg
        const volume = kolam.panjang * kolam.lebar * kolam.kedalaman; // m3
        const density = volume > 0 ? totalBiomass / volume : 0; // kg/m3

        return { totalBiomass, density, averageWeight };
    };

    /**
     * Unified status calculation.
     * If sampling data is available, uses biomass density (kg/m³) for more accurate status.
     * Falls back to fish count density (ekor/m³) if no sampling data.
     * 
     * Thresholds:
     * - Biomass Density (kg/m³): AMAN ≤ 10, WASPADA ≤ 20, BERISIKO > 20
     * - Fish Count Density (ekor/m³): AMAN ≤ 50, WASPADA ≤ 100, BERISIKO > 100
     */
    const getUnifiedStatus = (kolamId: string): { status: 'aman' | 'waspada' | 'berisiko'; kepadatanEkor: number; kepadatanBerat: number; source: 'ekor' | 'berat' } => {
        const kolam = getKolamById(kolamId);
        if (!kolam) {
            return { status: 'aman', kepadatanEkor: 0, kepadatanBerat: 0, source: 'ekor' };
        }

        const kepadatanEkor = calculateKepadatan(kolam);
        const { density: kepadatanBerat } = calculateBiomass(kolamId);

        // If biomass density is available (sampling data exists)
        if (kepadatanBerat > 0) {
            let status: 'aman' | 'waspada' | 'berisiko' = 'aman';
            if (kepadatanBerat > 20) status = 'berisiko';
            else if (kepadatanBerat > 10) status = 'waspada';
            return { status, kepadatanEkor, kepadatanBerat, source: 'berat' };
        }

        // Fallback to fish count density
        let status: 'aman' | 'waspada' | 'berisiko' = 'aman';
        if (kepadatanEkor > 100) status = 'berisiko';
        else if (kepadatanEkor > 50) status = 'waspada';
        return { status, kepadatanEkor, kepadatanBerat, source: 'ekor' };
    };

    const getFeedRecommendation = (weightGrams: number, biomassKg: number) => {
        let type = '';
        let minRate = 0;
        let maxRate = 0;
        let labelRate = '';

        if (weightGrams < 5) {
            type = 'PF-500/800 (Tepung/Butiran Halus)';
            minRate = 0.08; maxRate = 0.10; labelRate = '8-10%';
        } else if (weightGrams < 10) {
            type = 'PF-1000';
            minRate = 0.06; maxRate = 0.08; labelRate = '6-8%';
        } else if (weightGrams < 30) {
            type = '781-1 / LP-1 (2mm)';
            minRate = 0.04; maxRate = 0.05; labelRate = '4-5%';
        } else if (weightGrams < 100) {
            type = '781-2 / LP-2 (3mm)';
            minRate = 0.03; maxRate = 0.04; labelRate = '3-4%';
        } else if (weightGrams < 200) {
            type = '781-3 / LP-3 (4mm)';
            minRate = 0.02; maxRate = 0.03; labelRate = '2-3%';
        } else {
            type = '781-3 / LP-3 (4mm)'; // > 200g usually finish with larger pellet
            minRate = 0.015; maxRate = 0.02; labelRate = '1.5-2%';
        }

        const minAmountVal = biomassKg * minRate;
        const maxAmountVal = biomassKg * maxRate;

        let amountDisplay = '';

        const formatVal = (val: number, isGram: boolean = false, isTon: boolean = false) => {
            if (isGram) return Math.round(val).toLocaleString('id-ID');
            // For kg and Ton, show up to 1 decimal place
            return val.toLocaleString('id-ID', { maximumFractionDigits: 1 });
        };

        if (maxAmountVal < 1) {
            const minGram = minAmountVal * 1000;
            const maxGram = maxAmountVal * 1000;
            amountDisplay = `${formatVal(minGram, true)} - ${formatVal(maxGram, true)} gram`;
        } else if (maxAmountVal >= 10000) {
            const minTon = minAmountVal / 1000;
            const maxTon = maxAmountVal / 1000;
            amountDisplay = `${formatVal(minTon, false, true)} - ${formatVal(maxTon, false, true)} Ton`;
        } else {
            amountDisplay = `${formatVal(minAmountVal)} - ${formatVal(maxAmountVal)} kg`;
        }

        return {
            type,
            amount: amountDisplay,
            ratePercent: labelRate
        };
    };

    // === Helper Functions ===

    const getKolamById = (id: string) => kolam.find(k => k.id === id);

    const getPakanByKolam = (kolamId: string) =>
        pakan.filter(p => p.kolamId === kolamId).sort((a, b) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        );

    const getKondisiAirByKolam = (kolamId: string) =>
        kondisiAir.filter(ka => ka.kolamId === kolamId).sort((a, b) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        );

    const getPengeluaranByKolam = (kolamId: string) =>
        pengeluaran.filter(p => p.kolamId === kolamId).sort((a, b) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        );

    const getFeedPrice = useCallback((jenisPakan: string) => {
        const stocks = stokPakan.filter(s => s.jenisPakan === jenisPakan);
        if (stocks.length === 0) return 0;
        const totalValue = stocks.reduce((sum, s) => sum + (s.stokAwal * s.hargaPerKg), 0);
        const totalKg = stocks.reduce((sum, s) => sum + s.stokAwal, 0);
        return totalKg > 0 ? totalValue / totalKg : 0;
    }, [stokPakan]);

    const getTotalPengeluaranByKolam = useCallback((kolamId: string): number => {
        // 1. Manual expenses
        const specificExpenses = pengeluaran.filter(p => p.kolamId === kolamId);
        const expenseTotal = specificExpenses.reduce((sum, p) => sum + p.jumlah, 0);

        // 2. Feed Cost (Calculated)
        const kolamPakan = pakan.filter(p => p.kolamId === kolamId);
        const feedCost = kolamPakan.reduce((sum, p) => {
            const price = getFeedPrice(p.jenisPakan);
            return sum + (p.jumlahKg * price);
        }, 0);

        return expenseTotal + feedCost;
    }, [pengeluaran, pakan, getFeedPrice]);

    const getTotalPengeluaranByKategori = useCallback((kolamId: string, kategori: KategoriPengeluaran): number => {
        let total = pengeluaran
            .filter(p => p.kolamId === kolamId && p.kategori === kategori)
            .reduce((sum, p) => sum + p.jumlah, 0);

        if (kategori === 'PAKAN') {
            const kolamPakan = pakan.filter(p => p.kolamId === kolamId);
            const feedCost = kolamPakan.reduce((sum, p) => {
                const price = getFeedPrice(p.jenisPakan);
                return sum + (p.jumlahKg * price);
            }, 0);
            total += feedCost;
        }
        return total;
    }, [pengeluaran, pakan, getFeedPrice]);

    const getStokTersediaByJenis = (jenisPakan: string): number => {
        const totalStok = stokPakan
            .filter(s => s.jenisPakan === jenisPakan)
            .reduce((sum, s) => sum + s.stokAwal, 0);
        const totalUsed = pakan
            .filter(p => p.jenisPakan === jenisPakan)
            .reduce((sum, p) => sum + p.jumlahKg, 0);
        return totalStok - totalUsed;
    };

    const getAllJenisPakan = (): string[] => {
        const fromStok = stokPakan.map(s => s.jenisPakan);
        const fromPakan = pakan.map(p => p.jenisPakan);
        return [...new Set([...fromStok, ...fromPakan])];
    };

    const getPenjualanByKolam = (kolamId: string) =>
        penjualan.filter(p => p.kolamId === kolamId).sort((a, b) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        );

    const getTotalPenjualanByKolam = (kolamId: string): number =>
        penjualan.filter(p => p.kolamId === kolamId).reduce((sum, p) => sum + (p.beratKg * p.hargaPerKg), 0);

    const getTotalPenjualan = (): number =>
        penjualan.reduce((sum, p) => sum + (p.beratKg * p.hargaPerKg), 0);

    const getJadwalByKolam = (kolamId: string) =>
        jadwalPakan.filter(j => j.kolamId === kolamId).sort((a, b) =>
            a.waktu.localeCompare(b.waktu)
        );

    const getPanenByKolam = (kolamId: string) =>
        riwayatPanen.filter(p => p.kolamId === kolamId).sort((a, b) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        );

    const getProfitByKolam = (kolamId: string): number => {
        const pendapatan = getTotalPenjualanByKolam(kolamId);
        const pengeluaranTotal = getTotalPengeluaranByKolam(kolamId);
        return pendapatan - pengeluaranTotal;
    };

    const calculateKepadatan = (k: Kolam): number => {
        const volume = k.panjang * k.lebar * k.kedalaman;
        return volume > 0 ? k.jumlahIkan / volume : 0;
    };

    const calculateFCR = (kolamId: string): number => {
        const pakanKolam = getPakanByKolam(kolamId);
        const totalPakan = pakanKolam.reduce((sum, p) => sum + p.jumlahKg, 0);
        const k = getKolamById(kolamId);
        if (!k) return 0;
        const estimatedWeightGain = k.jumlahIkan * 0.05;
        return estimatedWeightGain > 0 ? totalPakan / estimatedWeightGain : 0;
    };


    // Helper to calculate metrics for a specific date range
    const calculateCycleMetrics = (kolamId: string, startDate: string, endDate: string, startTimestamp: string, endTimestamp?: string): Omit<CycleSummary, 'cycleNumber'> => {
        const k = getKolamById(kolamId);
        const strictFilter = (d: { tanggal: string }) => {
            const itemTime = new Date((d as any).createdAt || d.tanggal).getTime();
            const minTime = new Date(startTimestamp || startDate).getTime();
            const maxTime = endTimestamp ? new Date(endTimestamp).getTime() : Infinity;
            if ((d as any).createdAt && startTimestamp) {
                return itemTime >= minTime && itemTime < maxTime;
            } else {
                return d.tanggal >= startDate && d.tanggal <= endDate;
            }
        };
        const rangeFilterInclusive = strictFilter;

        // Feed
        const cycleFeed = pakan.filter(p => p.kolamId === kolamId && rangeFilterInclusive(p));
        const totalFeedKg = cycleFeed.reduce((sum, p) => sum + p.jumlahKg, 0);
        const totalFeedCost = cycleFeed.reduce((sum, p) => sum + (p.jumlahKg * getFeedPrice(p.jenisPakan)), 0);

        // Harvest
        const cycleHarvest = riwayatPanen.filter(p => p.kolamId === kolamId && rangeFilterInclusive(p));
        const totalHarvestKg = cycleHarvest.reduce((sum, p) => sum + p.beratTotalKg, 0);
        const totalHarvestRevenue = cycleHarvest.reduce((sum, p) => sum + (p.beratTotalKg * p.hargaPerKg), 0);
        const finalFish = cycleHarvest.reduce((sum, p) => sum + p.jumlahEkor, 0);

        // Expenses
        const cycleExpenses = pengeluaran.filter(p => p.kolamId === kolamId && p.kategori !== 'PAKAN' && rangeFilterInclusive(p));
        const totalExpenses = cycleExpenses.reduce((sum, p) => sum + p.jumlah, 0);

        // Initial Fish (Sum of all positive additions in this cycle, EXCLUDING the start of the next cycle)
        const cycleFishHistory = getRiwayatIkanByKolam(kolamId)
            .filter(rangeFilterInclusive);

        const initialFish = cycleFishHistory
            .filter(h => h.jumlahPerubahan > 0)
            .reduce((sum, h) => sum + h.jumlahPerubahan, 0);

        // Calculate Last Input Time (Strictly from Harvest)
        const harvestRecords = cycleHarvest.map(r => ({ date: r.tanggal, time: (r as any).createdAt || r.tanggal }));

        let lastInputTime = startDate;
        if (harvestRecords.length > 0) {
            harvestRecords.sort((a, b) => {
                const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
                if (dateDiff !== 0) return dateDiff;
                return new Date(b.time).getTime() - new Date(a.time).getTime();
            });
            lastInputTime = harvestRecords[0].time;
        }

        // FCR
        const fcr = totalHarvestKg > 0 ? totalFeedKg / totalHarvestKg : 0;

        // SR
        const totalLived = finalFish;
        const sr = initialFish > 0 ? (totalLived / initialFish) * 100 : 0;

        const netProfit = totalHarvestRevenue - (totalFeedCost + totalExpenses);

        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 3600 * 24)));

        return {
            kolamId,
            startDate,
            endDate,
            totalDays,
            initialFish,
            finalFish: totalLived,
            totalFeedKg,
            totalFeedCost,
            totalHarvestKg,
            totalHarvestRevenue,
            totalExpenses,
            netProfit,
            fcr,
            sr,
            adjustmentNet: 0,
            isActive: false,
            startId: '',
            lastInputTime // Added field
        };
    };

    const getCycleSummary = (kolamId: string): CycleSummary | null => {
        const k = getKolamById(kolamId);
        if (!k) return null;

        const historyDesc = getRiwayatIkanByKolam(kolamId);
        const startEvent = historyDesc.find(h =>
            h.keterangan.toLowerCase().includes('tebar') ||
            (h.jumlahPerubahan > 0 && h.jumlahAkhir === h.jumlahPerubahan)
        );

        if (!startEvent) return null;

        const startDate = startEvent.tanggal;
        const startId = startEvent.id;

        let endDate = new Date().toISOString().split('T')[0];
        let isActive = k.jumlahIkan > 0;

        if (!isActive && historyDesc.length > 0) {
            endDate = historyDesc[0].tanggal;
        }

        const startTimestamp = (startEvent as any).createdAt || startDate;
        const metrics = calculateCycleMetrics(kolamId, startDate, endDate, startTimestamp);
        const cycleNumber = historyDesc.filter(h => h.keterangan.toLowerCase().includes('tebar') || (h.jumlahPerubahan > 0 && h.jumlahAkhir === h.jumlahPerubahan)).length;
        return { ...metrics, startId, isActive, cycleNumber };
    };



    const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

    const getCycleHistory = (kolamId: string): CycleSummary[] => {
        // 1. Get all fish history sorted by CREATED AT (Ascending) for chronological processing
        const historyAsc = getRiwayatIkanByKolam(kolamId).sort((a, b) => {
            const timeA = new Date((a as any).createdAt || a.tanggal).getTime();
            const timeB = new Date((b as any).createdAt || b.tanggal).getTime();
            return timeA - timeB;
        });

        const cycles: CycleSummary[] = [];

        // 2. Identify Cycle Starts (Tebar events)
        let tebarEvents = historyAsc.filter(h =>
            h.keterangan.toLowerCase().includes('tebar') ||
            (h.jumlahPerubahan > 0 && h.jumlahAkhir === h.jumlahPerubahan)
        );

        // 3. Iterate to define strict boundaries
        for (let i = 0; i < tebarEvents.length; i++) {
            const startEvent = tebarEvents[i];
            const startTimestamp = (startEvent as any).createdAt || startEvent.tanggal;

            let endTimestamp: string | undefined = undefined;
            let endDate = new Date().toISOString().split('T')[0];
            let isActive = true;

            if (i < tebarEvents.length - 1) {
                // Determine end based on NEXT cycle start
                const nextEvent = tebarEvents[i + 1];
                endTimestamp = (nextEvent as any).createdAt || nextEvent.tanggal;

                // For display, EndDate is the date of the last relevant event (Harvest)
                const lastHarvest = riwayatPanen.filter(p => {
                    const t = new Date((p as any).createdAt || p.tanggal).getTime();
                    return t >= new Date(startTimestamp).getTime() && t < new Date(endTimestamp!).getTime();
                }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())[0];

                endDate = lastHarvest ? lastHarvest.tanggal : startEvent.tanggal;
                isActive = false;
            } else {
                // Latest cycle
                const k = getKolamById(kolamId);
                isActive = k ? k.jumlahIkan > 0 : true;

                if (!isActive) {
                    const lastHarvest = riwayatPanen
                        .filter(p => p.kolamId === kolamId && p.tanggal >= startEvent.tanggal)
                        .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())[0];
                    if (lastHarvest) endDate = lastHarvest.tanggal;
                }
            }

            const metrics = calculateCycleMetrics(kolamId, startEvent.tanggal, endDate, startTimestamp, endTimestamp);

            cycles.push({
                ...metrics,
                cycleNumber: i + 1,
                isActive
            });
        }

        return cycles.reverse(); // Return Newest First
    };

    // === Dashboard Helpers ===

    const getFeedTrend = (days: number = 7) => {
        const result: { date: string; amount: number }[] = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            // Sum feed for this date
            const amount = pakan
                .filter(p => p.tanggal === dateStr)
                .reduce((sum, p) => sum + p.jumlahKg, 0);

            result.push({ date: dateStr, amount });
        }
        return result;
    };

    const calculateTotalAssetValue = (pricePerKg: number): number => {
        let totalVal = 0;
        kolam.forEach(k => {
            if (k.jumlahIkan > 0) {
                // Menggunakan range 85-150 gram, kita ambil nilai tengah = 117.5 gram
                const avgWeightInRange = 117.5; // gram
                const beratTotalKg = (k.jumlahIkan * avgWeightInRange) / 1000;
                totalVal += beratTotalKg * pricePerKg;
            }
        });
        return totalVal;
    };

    const getRecentActivities = (limit: number = 10): Activity[] => {
        const activities: Activity[] = [];

        // 1. Pakan
        pakan.forEach(p => {
            const k = getKolamById(p.kolamId);
            activities.push({
                id: p.id,
                type: 'PAKAN',
                date: p.tanggal,
                title: 'Pemberian Pakan',
                description: `${p.jumlahKg} kg ${p.jenisPakan}`,
                kolamName: k?.nama || 'Unknown',
                kolamId: p.kolamId
            });
        });

        // 2. Panen
        riwayatPanen.forEach(p => {
            const k = getKolamById(p.kolamId);
            activities.push({
                id: p.id,
                type: 'PANEN',
                date: p.tanggal,
                title: 'Panen Ikan',
                description: `${p.beratTotalKg} kg (${p.tipe.toLowerCase()})`,
                kolamName: k?.nama || 'Unknown',
                kolamId: p.kolamId
            });
        });

        // 3. Ikan/Kematian (Riwayat Ikan)
        riwayatIkan.forEach(r => {
            const k = getKolamById(r.kolamId);
            let type: Activity['type'] = 'LAINNYA';
            let title = 'Update Populasi';

            const descLower = r.keterangan.toLowerCase();
            if (descLower.includes('mati') || descLower.includes('kematian')) {
                type = 'KEMATIAN';
                title = 'Kematian Ikan';
            } else if (descLower.includes('tebar')) {
                type = 'TEBAR';
                title = 'Tebar Bibit';
            }

            // Filter out system generated entries if needed, but assuming user wants to see them
            // Only include significant events?

            activities.push({
                id: r.id,
                type,
                date: r.tanggal, // already YYYY-MM-DD from mapRiwayatIkan logic? check state
                title,
                description: `${r.jumlahPerubahan > 0 ? '+' : ''}${r.jumlahPerubahan} ekor • ${r.keterangan}`,
                kolamName: k?.nama || 'Unknown',
                kolamId: r.kolamId
            });
        });

        // Sort descending by date
        return activities
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, limit);
    };





    const tebarBibit = async (kolamId: string, data: { tanggal: string; jumlah: number; beratPerEkor: number; hargaPerEkor: number }) => {
        if (!activeFarmId) return;

        try {
            await updateKolam(kolamId, {
                tanggalTebar: data.tanggal,
                status: 'aman'
            });

            await addRiwayatIkan({
                kolamId,
                tanggal: data.tanggal,
                jumlahPerubahan: data.jumlah,
                keterangan: 'Tebar Bibit Awal'
            });

            if (data.beratPerEkor > 0) {
                const jumlahIkanPerKg = 1000 / data.beratPerEkor;
                await addRiwayatSampling({
                    kolamId,
                    tanggal: data.tanggal,
                    jumlahIkanPerKg,
                    catatan: `Bibit awal: ${data.beratPerEkor} gram/ekor`
                });
            }

            // Catat pengeluaran bibit
            const totalHarga = data.jumlah * data.hargaPerEkor;
            await addPengeluaran({
                tanggal: data.tanggal,
                kategori: 'BIBIT',
                keterangan: `Pembelian bibit ${data.jumlah} ekor @ Rp${data.hargaPerEkor.toLocaleString('id-ID')}`,
                jumlah: totalHarga,
                kolamId
            });

            await refreshData();
        } catch (error) {
            console.error('Tebar bibit failed:', error);
            throw error;
        }
    };

    // === Predictive Analytics Implementation ===

    // Constants
    const GROWTH_RATE_PER_DAY = 0.002; // 2 grams per day (kg) -> 0.002 kg
    const TARGET_WEIGHT_KG = 0.15; // 150 grams
    const ESTIMATED_FEED_PRICE = 13000; // Rp/kg (fallback)

    const predictHarvestDate = (kolamId: string) => {
        const sampling = getLatestSampling(kolamId);
        // Default to small bibit size (5g = 0.005kg) if no sampling
        const currentWeight = sampling ? (1 / sampling.jumlahIkanPerKg) : 0.005;

        if (currentWeight >= TARGET_WEIGHT_KG) {
            return { daysRemaining: 0, date: new Date().toISOString().split('T')[0], currentWeight, targetReached: true };
        }

        const weightDiff = TARGET_WEIGHT_KG - currentWeight;
        const daysRemaining = Math.ceil(weightDiff / GROWTH_RATE_PER_DAY);

        const date = new Date();
        date.setDate(date.getDate() + daysRemaining);

        return {
            daysRemaining,
            date: date.toISOString().split('T')[0],
            currentWeight,
            targetReached: false
        };
    };

    const calculateProjectedProfit = (kolamId: string) => {
        const k = getKolamById(kolamId);
        if (!k) return { revenue: 0, cost: 0, profit: 0, roi: 0 };

        // 1. Realized Revenue (Actual Sales)
        const realizedRevenue = getTotalPenjualanByKolam(kolamId);

        // 2. Unrealized Revenue (Asset Value)
        const sampling = getLatestSampling(kolamId);
        const currentWeight = sampling ? (1 / sampling.jumlahIkanPerKg) : 0.005;
        const totalBiomass = k.jumlahIkan * currentWeight;
        // Use last sale price or default
        const lastSale = penjualan.find(p => p.kolamId === kolamId);
        const marketPrice = lastSale ? lastSale.hargaPerKg : 25000;
        const unrealizedRevenue = totalBiomass * marketPrice;

        const totalRevenue = realizedRevenue + unrealizedRevenue;

        // 3. Costs (Feed + Other)
        const otherExpenses = getTotalPengeluaranByKolam(kolamId);

        // Feed Cost: Sum of actually consumed feed * estimated price (simplification)
        const kolamPakan = getPakanByKolam(kolamId);
        const totalFeedKg = kolamPakan.reduce((sum, p) => sum + p.jumlahKg, 0);
        // Ideally we map feed type to stock price, but for now use constant avg
        const feedCost = totalFeedKg * ESTIMATED_FEED_PRICE;

        const totalCost = otherExpenses + feedCost;

        const profit = totalRevenue - totalCost;
        const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

        return { revenue: totalRevenue, cost: totalCost, profit, roi };
    };

    const detectAppetiteDrop = (kolamId: string) => {
        const kolamPakan = getPakanByKolam(kolamId)
            .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()); // descending

        if (kolamPakan.length < 6) return { hasDrop: false, dropPercent: 0, diff: 0 };

        // Group by Date 
        const dailyFeed: Record<string, number> = {};
        kolamPakan.forEach(p => {
            dailyFeed[p.tanggal] = (dailyFeed[p.tanggal] || 0) + p.jumlahKg;
        });

        const dates = Object.keys(dailyFeed).sort().reverse(); // Newest first
        if (dates.length < 4) return { hasDrop: false, dropPercent: 0, diff: 0 };

        // Compare last 3 days vs previous 3 days (simplification: just compare last 2 days avg vs prev 2 days)
        // Taking last 3 days
        const last3Days = dates.slice(0, 3);
        const prev3Days = dates.slice(3, 6);

        const avgLast = last3Days.reduce((sum, d) => sum + dailyFeed[d], 0) / last3Days.length;
        const avgPrev = prev3Days.reduce((sum, d) => sum + dailyFeed[d], 0) / prev3Days.length;

        if (avgPrev === 0) return { hasDrop: false, dropPercent: 0, diff: 0 };

        const diff = avgLast - avgPrev;
        const dropPercent = (diff / avgPrev) * 100;

        // Alert if drop is more than 20% (negative)
        const hasDrop = dropPercent < -20;

        return { hasDrop, dropPercent, diff };
    };

    const getDailyFeedStatus = (kolamId: string) => {
        const k = getKolamById(kolamId);
        if (!k) return {
            target: 0, actual: 0, remaining: 0, progress: 0, status: 'kurang' as const,
            schedule: {
                morning: { time: '05:00', amount: 0, isNext: false },
                evening: { time: '17:00', amount: 0, isNext: false },
                next: '-'
            }
        };

        // 1. Calculate Target
        // We need average weight. If we have sampling, use it. If not, estimate based on days?
        // Let's use getLatestSampling.
        const sampling = getLatestSampling(kolamId);
        // Default to 10g avg weight (0.01kg) if unknown, or maybe small bibit 5g
        let avgWeightKg = 0.01;
        if (sampling && sampling.jumlahIkanPerKg > 0) {
            avgWeightKg = 1 / sampling.jumlahIkanPerKg;
        }

        const biomass = k.jumlahIkan * avgWeightKg;

        // Feed Rate logic (3% default or dynamic)
        // Use logic from getFeedRecommendation roughly
        // <10g: 6-8%, <30g: 4-5%, <100g: 3-4%, >100g: 2-3%
        let feedRate = 0.03; // Default 3%
        const weightGrams = avgWeightKg * 1000;

        if (weightGrams < 10) feedRate = 0.06;
        else if (weightGrams < 50) feedRate = 0.04;
        else if (weightGrams < 200) feedRate = 0.03;
        else feedRate = 0.02;

        const dailyTarget = biomass * feedRate; // kg

        // 2. Calculate Actual (Today)
        const todayStr = new Date().toISOString().split('T')[0];
        const todayFeed = pakan
            .filter(p => p.kolamId === kolamId && p.tanggal === todayStr)
            .reduce((sum, p) => sum + p.jumlahKg, 0);

        const remaining = Math.max(0, dailyTarget - todayFeed);
        const progress = dailyTarget > 0 ? (todayFeed / dailyTarget) * 100 : 0;

        let status: 'cukup' | 'kurang' | 'berlebih' = 'kurang';
        if (progress >= 100) status = 'cukup';
        if (progress > 110) status = 'berlebih';

        // 3. Schedule Logic (Morning 50% / Evening 50%)
        // If remaining > 0, split it? Or just static target split?
        // Let's do static target split for display "Target Pagi/Sore"
        const morningTarget = dailyTarget * 0.5;
        const eveningTarget = dailyTarget * 0.5;

        // Next Schedule Logic
        const now = new Date();
        const hour = now.getHours(); // 0-23

        let isNextMorning = false;
        let isNextEvening = false;
        let nextLabel = '';

        if (progress >= 100) {
            // If target reached, stop feeding
            nextLabel = 'Besok';
        } else {
            if (hour < 5) {
                isNextMorning = true;
                nextLabel = 'Pagi Ini (05:00)';
            } else if (hour < 17) {
                isNextEvening = true;
                nextLabel = 'Sore Ini (17:00)';
            } else {
                // After 17:00, next is tomorrow
                // But wait, if they haven't fed evening yet?
                // Assuming they might still feed late? 
                // Let's say if it's 8 PM, it's effectively "Besok" unless they are late.
                // But for standard schedule, it loops to tomorrow morning.
                isNextMorning = true; // For next day actually
                nextLabel = 'Besok Pagi (05:00)';
            }
        }

        return {
            target: dailyTarget,
            actual: todayFeed,
            remaining,
            progress,
            status,
            schedule: {
                morning: { time: '05:00', amount: morningTarget, isNext: isNextMorning && nextLabel.includes('Pagi Ini') },
                evening: { time: '17:00', amount: eveningTarget, isNext: isNextEvening },
                next: nextLabel
            }
        };
    };

    return (
        <AppContext.Provider value={{
            kolam,
            pakan,
            kondisiAir,
            pengeluaran,
            stokPakan,
            pembeli,
            penjualan,
            jadwalPakan,
            riwayatPanen,
            activeFarmId,
            isLoading,
            addKolam,
            updateKolam,
            deleteKolam,
            addPakan,
            addKondisiAir,
            addPengeluaran,
            deletePengeluaran,
            addStokPakan,
            deleteStokPakan,
            addPembeli,
            deletePembeli,
            addPenjualan,
            deletePenjualan,
            addJadwalPakan,
            updateJadwalPakan,
            deleteJadwalPakan,
            getJadwalByKolam,
            addRiwayatPanen,
            deleteRiwayatPanen,
            getPanenByKolam,
            riwayatIkan,
            addRiwayatIkan,
            getRiwayatIkanByKolam,
            riwayatSampling,
            addRiwayatSampling,
            getSamplingByKolam,
            getLatestSampling,
            calculateBiomass,
            getUnifiedStatus,
            getKolamById,
            getPakanByKolam,
            getKondisiAirByKolam,
            getPengeluaranByKolam,
            getTotalPengeluaranByKolam,
            getTotalPengeluaranByKategori,
            getStokTersediaByJenis,
            getAllJenisPakan,
            getPenjualanByKolam,
            getTotalPenjualanByKolam,
            getTotalPenjualan,
            getProfitByKolam,
            calculateKepadatan,
            calculateFCR,
            isSidebarCollapsed,
            toggleSidebar,
            hargaPasarPerKg,
            setHargaPasarPerKg,
            tebarBibit,
            refreshData,
            getFeedRecommendation,
            getCycleSummary,
            getCycleHistory,
            getFeedTrend,
            calculateTotalAssetValue,
            getRecentActivities,
            predictHarvestDate,
            calculateProjectedProfit,
            detectAppetiteDrop,
            getDailyFeedStatus,
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
