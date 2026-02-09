'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
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

export interface Farm {
    id: string;
    nama: string;
    alamat?: string;
    modalAwal: number;
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

export type KategoriPengeluaran = 'BIBIT' | 'PAKAN' | 'OBAT' | 'LISTRIK' | 'TENAGA_KERJA' | 'LAINNYA' | 'MODAL';

export interface Pengeluaran {
    id: string;
    kolamId: string | null;
    tanggal: string;
    kategori: KategoriPengeluaran;
    keterangan: string;
    jumlah: number;
    createdAt?: string;
}

export interface StokPakan {
    id: string;
    jenisPakan: string;
    stokAwal: number;
    hargaPerKg: number;
    tanggalTambah: string;
    keterangan?: string;
    createdAt?: string;
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
    createdAt?: string;
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
    bobotGram?: number; // bobot per ekor saat sampling (gram)
    catatan?: string;
}

export interface RiwayatSortir {
    id: string;
    kolamId: string;
    tanggal: string;
    periode: number; // 1, 2, 3, or 4
    jumlahIkanSebelum: number;
    jumlahIkanSesudah: number;
    mortalitas: number;
    bobotRataRata?: number;
    catatan?: string;
}

export interface SortingAlert {
    kolamId: string;
    kolamNama: string;
    periode: number; // 1, 2, 3, or 4
    reason: 'week' | 'weight';
    value: number; // week number or weight in grams
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
    farm: Farm | null;
    updateFarm: (updates: Partial<Farm>) => Promise<void>;
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
    addStokIkan: (data: { kolamId: string; tanggal: string; jumlah: number; beratPerEkor: number; hargaPerEkor: number }) => Promise<void>;
    getRiwayatIkanByKolam: (kolamId: string) => RiwayatIkan[];

    // Sampling (Biomass)
    addRiwayatSampling: (sampling: Omit<RiwayatSampling, 'id'>) => Promise<void>;
    getSamplingByKolam: (kolamId: string) => RiwayatSampling[];
    getLatestSampling: (kolamId: string) => RiwayatSampling | undefined;
    calculateBiomass: (kolamId: string) => { totalBiomass: number; density: number; averageWeight: number };
    getUnifiedStatus: (kolamId: string) => { status: 'aman' | 'waspada' | 'berisiko'; kepadatanEkor: number; kepadatanBerat: number; source: 'ekor' | 'berat' };

    // Sorting (Sortir)
    riwayatSortir: RiwayatSortir[];
    addRiwayatSortir: (sortir: Omit<RiwayatSortir, 'id'>) => Promise<void>;
    getSortirByKolam: (kolamId: string) => RiwayatSortir[];
    getSortingAlerts: () => SortingAlert[];
    getWeeksSinceTebar: (kolamId: string) => number;
    getCurrentWeight: (kolamId: string) => number;

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
    getAvailableFunds: () => number;

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
            ? new Date(dbKolam.tanggalTebar as string).toLocaleDateString('en-CA')
            : new Date(dbKolam.tanggalTebar as string).toLocaleDateString('en-CA'),
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
    const [farm, setFarm] = useState<Farm | null>(null);
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
    const [riwayatSortir, setRiwayatSortir] = useState<RiwayatSortir[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [hargaPasarPerKg, setHargaPasarPerKg] = useState(35000); // Default Rp 35.000/kg
    const [historicalFeedUsage, setHistoricalFeedUsage] = useState<Record<string, number>>({});

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
                    setFarm(farms[0]);
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
            // Trigger bulk fetch in background
            fetchBulkData();
        }
    }, [activeFarmId]);

    // Fetch all secondary data in a single request (Optimization)
    const fetchBulkData = useCallback(async () => {
        if (!activeFarmId) return;

        try {
            const res = await fetch(`/api/farms/${activeFarmId}/bulk-data`);
            if (!res.ok) throw new Error('Failed to fetch bulk data');

            const data = await res.json();

            // Set all states with optimized ISO to local mapping (YYYY-MM-DD)
            setPakan(data.pakan.map((p: any) => ({
                ...p,
                tanggal: new Date(p.tanggal).toLocaleDateString('en-CA')
            })));

            setStokPakan(data.stokPakan.map((s: any) => ({
                ...s,
                tanggalTambah: new Date(s.tanggalTambah).toLocaleDateString('en-CA')
            })));

            setKondisiAir(data.kondisiAir.map((k: any) => ({
                ...k,
                tanggal: new Date(k.tanggal).toLocaleDateString('en-CA')
            })));

            setPengeluaran(data.pengeluaran.map((p: any) => ({
                ...p,
                tanggal: new Date(p.tanggal).toLocaleDateString('en-CA')
            })));

            setPembeli(data.pembeli);

            setPenjualan(data.penjualan.map((p: any) => ({
                ...p,
                tanggal: new Date(p.tanggal).toLocaleDateString('en-CA')
            })));

            setJadwalPakan(data.jadwalPakan);

            setRiwayatPanen(data.riwayatPanen.map((p: any) => ({
                ...p,
                tanggal: p.tanggal, // ISO
                tipe: p.tipe as TipePanen
            })));

            setRiwayatIkan(data.riwayatIkan.map((r: any) => ({
                ...r,
                tanggal: new Date(r.tanggal).toLocaleDateString('en-CA')
            })));

            setRiwayatSampling(data.riwayatSampling.map((s: any) => ({
                ...s,
                tanggal: s.tanggal // ISO
            })));

            setRiwayatSortir(data.riwayatSortir?.map((s: any) => ({
                ...s,
                tanggal: s.tanggal // ISO
            })) || []);

            // Map historical usage array to object map
            const usageMap: Record<string, number> = {};
            if (data.historicalFeedUsage) {
                data.historicalFeedUsage.forEach((h: any) => {
                    usageMap[h.jenisPakan] = h.jumlahKg;
                });
            }
            setHistoricalFeedUsage(usageMap);

        } catch (error) {
            console.error('Failed to fetch bulk data:', error);
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

    const updateFarm = async (updates: Partial<Farm>) => {
        if (!activeFarmId) return;

        // Optimistic update
        setFarm(prev => prev ? { ...prev, ...updates } : null);

        try {
            const res = await fetch(`/api/farms/${activeFarmId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (res.ok) {
                const updated = await res.json();
                setFarm(updated);
                showToast('Data farm berhasil diperbarui', 'success');
            } else {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to update');
            }
        } catch (error) {
            console.error('Failed to update farm:', error);
            showToast(error instanceof Error ? error.message : 'Gagal memperbarui data farm', 'error');
            // Revert
            fetchFarm();
        }
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
                setPakan(prev => [...prev, { ...created, tanggal: new Date(created.tanggal).toLocaleDateString('en-CA') }]);
                showToast('Pakan berhasil dicatat', 'success');

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
            } else {
                const errorData = await res.json();
                showToast(errorData.error || 'Gagal mencatat pakan', 'error');
            }
        } catch (error) {
            console.error('Failed to add pakan:', error);
            showToast('Terjadi kesalahan saat mencatat pakan', 'error');
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
                setKondisiAir(prev => [...prev, { ...created, tanggal: new Date(created.tanggal).toLocaleDateString('en-CA') }]);
            }
        } catch (error) {
            console.error('Failed to add kondisi air:', error);
        }
    };

    const addPengeluaran = async (newPengeluaran: Omit<Pengeluaran, 'id'>) => {
        if (!activeFarmId) return;

        // 1. Validation: Check available funds
        const available = getAvailableFunds();
        if (available < newPengeluaran.jumlah) {
            throw new Error('Uang tersedia tidak mencukupi untuk pengeluaran ini');
        }

        try {
            const normalizedPengeluaran = {
                ...newPengeluaran,
                kategori: newPengeluaran.kategori.toUpperCase() as KategoriPengeluaran
            };
            const res = await fetch(`/api/farms/${activeFarmId}/pengeluaran`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(normalizedPengeluaran)
            });
            if (res.ok) {
                const created = await res.json();
                setPengeluaran(prev => [...prev, {
                    ...created,
                    tanggal: new Date(created.tanggal).toLocaleDateString('en-CA'),
                    kategori: created.kategori,
                    createdAt: created.createdAt
                }]);

                // 2. Deduction: Removed (Modal Awal should be static)
            } else {
                const errData = await res.json().catch(() => ({}));
                const msg = errData.details ? `${errData.error}: ${errData.details}` : (errData.error || 'Gagal menyimpan pengeluaran');
                throw new Error(msg);
            }
        } catch (error) {
            console.error('Failed to add pengeluaran:', error);
            throw error; // Propagate error to caller
        }
    };

    const deletePengeluaran = (id: string) => {
        setPengeluaran(prev => prev.filter(p => p.id !== id));
    };

    const addStokPakan = async (newStok: Omit<StokPakan, 'id'>) => {
        if (!activeFarmId) return;

        // 1. Validation
        const totalBiaya = newStok.stokAwal * newStok.hargaPerKg;
        const available = getAvailableFunds();
        if (available < totalBiaya) {
            throw new Error('Uang tersedia tidak mencukupi untuk pembelian pakan ini');
        }

        try {
            const res = await fetch(`/api/farms/${activeFarmId}/stok-pakan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStok)
            });
            if (res.ok) {
                const created = await res.json();
                setStokPakan(prev => [...prev, { ...created, tanggalTambah: new Date(created.tanggalTambah).toLocaleDateString('en-CA') }]);

                // 2. Record Expense & Deduct logic (handled by addPengeluaran)
                await addPengeluaran({
                    tanggal: newStok.tanggalTambah,
                    kategori: 'PAKAN',
                    keterangan: `Stok Pakan ${newStok.jenisPakan} ${newStok.stokAwal}kg`,
                    jumlah: totalBiaya,
                    kolamId: null
                });
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
                setPenjualan(prev => [...prev, {
                    ...created,
                    tanggal: new Date(created.tanggal).toLocaleDateString('en-CA'),
                    createdAt: created.createdAt
                }]);

                // Add revenue to available funds: Removed (Calculated dynamically)
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
                    tanggal: new Date(result.tanggal).toLocaleDateString('en-CA'),
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

    const addRiwayatSortir = async (newSortir: Omit<RiwayatSortir, 'id'>) => {
        if (!activeFarmId) return;
        try {
            const res = await fetch(`/api/farms/${activeFarmId}/kolam/${newSortir.kolamId}/sortir`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSortir)
            });
            if (res.ok) {
                const created = await res.json();
                setRiwayatSortir(prev => [...prev, {
                    ...created,
                    tanggal: new Date(created.tanggal).toISOString()
                }]);
                
                // Update kolam fish count with the new count after sorting
                setKolam(prev => prev.map(k => {
                    if (k.id === newSortir.kolamId) {
                        return { ...k, jumlahIkan: newSortir.jumlahIkanSesudah };
                    }
                    return k;
                }));
                
                showToast('Data sortir berhasil disimpan', 'success');
            }
        } catch (error) {
            console.error('Failed to add sortir:', error);
            showToast('Gagal menyimpan data sortir', 'error');
        }
    };



    const calculateBiomass = (kolamId: string) => {
        const kolam = getKolamById(kolamId);
        const sampling = getLatestSampling(kolamId);

        if (!kolam || !sampling || sampling.jumlahIkanPerKg <= 0) {
            return { totalBiomass: 0, density: 0, averageWeight: 0 };
        }

        // Get base weight from sampling, then add growth (+2g per day)
        let baseWeightGram = 0;
        if (sampling.bobotGram) {
            baseWeightGram = sampling.bobotGram;
        } else {
            baseWeightGram = 1000 / sampling.jumlahIkanPerKg;
        }

        // Calculate days since last sampling
        // Parse sampling date robustly. If it's a simple YYYY-MM-DD, parse as local midnight.
        // If it's a full ISO string (from our new tebar logic), parse normally.
        // Calculate growth based on 01:00 AM transitions
        const dateStr = sampling.tanggal;
        const samplingDate = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr.replace(/-/g, '/'));
        const now = new Date();

        const getEffective01AM = (date: Date) => {
            const d = new Date(date);
            if (d.getHours() < 1) d.setDate(d.getDate() - 1);
            d.setHours(1, 0, 0, 0);
            return d;
        };

        const daysPassed = Math.max(0, Math.floor((getEffective01AM(now).getTime() - getEffective01AM(samplingDate).getTime()) / (1000 * 60 * 60 * 24)));

        // Apply growth: +2 grams per day (Production)
        const GROWTH_RATE_PER_DAY_GRAMS = 2;
        const currentWeightGram = baseWeightGram + (daysPassed * GROWTH_RATE_PER_DAY_GRAMS);
        const averageWeight = currentWeightGram / 1000; // convert to kg

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

    // === Indexed Data and Memoization (Performance Tier 1) ===

    const pakanMap = useMemo(() => {
        const map = new Map<string, DataPakan[]>();
        pakan.forEach(p => {
            if (!map.has(p.kolamId)) map.set(p.kolamId, []);
            map.get(p.kolamId)!.push(p);
        });
        return map;
    }, [pakan]);

    const pengeluaranMap = useMemo(() => {
        const map = new Map<string, Pengeluaran[]>();
        pengeluaran.forEach(p => {
            if (p.kolamId) {
                if (!map.has(p.kolamId)) map.set(p.kolamId, []);
                map.get(p.kolamId)!.push(p);
            }
        });
        return map;
    }, [pengeluaran]);

    const riwayatIkanMap = useMemo(() => {
        const map = new Map<string, RiwayatIkan[]>();
        riwayatIkan.forEach(r => {
            if (!map.has(r.kolamId)) map.set(r.kolamId, []);
            map.get(r.kolamId)!.push(r);
        });
        return map;
    }, [riwayatIkan]);

    const riwayatPanenMap = useMemo(() => {
        const map = new Map<string, RiwayatPanen[]>();
        riwayatPanen.forEach(r => {
            if (!map.has(r.kolamId)) map.set(r.kolamId, []);
            map.get(r.kolamId)!.push(r);
        });
        return map;
    }, [riwayatPanen]);

    const penjualanMap = useMemo(() => {
        const map = new Map<string, Penjualan[]>();
        penjualan.forEach(p => {
            if (!map.has(p.kolamId)) map.set(p.kolamId, []);
            map.get(p.kolamId)!.push(p);
        });
        return map;
    }, [penjualan]);

    const feedPriceMap = useMemo(() => {
        const map = new Map<string, number>();
        const jenisPakanSet = new Set(stokPakan.map(s => s.jenisPakan));

        jenisPakanSet.forEach(jenis => {
            const stocks = stokPakan.filter(s => s.jenisPakan === jenis);
            if (stocks.length > 0) {
                const totalValue = stocks.reduce((sum, s) => sum + (s.stokAwal * s.hargaPerKg), 0);
                const totalKg = stocks.reduce((sum, s) => sum + s.stokAwal, 0);
                map.set(jenis, totalKg > 0 ? totalValue / totalKg : 0);
            }
        });
        return map;
    }, [stokPakan]);

    // === Optimized Helper Functions ===

    const getKolamById = (id: string) => kolam.find(k => k.id === id);

    const getPakanByKolam = useCallback((kolamId: string) =>
        (pakanMap.get(kolamId) || []).sort((a: any, b: any) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        ), [pakanMap]);

    const getKondisiAirByKolam = useCallback((kolamId: string) =>
        kondisiAir.filter(ka => ka.kolamId === kolamId).sort((a: any, b: any) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        ), [kondisiAir]); // Kondisi air usually fewer records, but could also be indexed if needed

    const getPengeluaranByKolam = useCallback((kolamId: string) =>
        (pengeluaranMap.get(kolamId) || []).sort((a: any, b: any) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        ), [pengeluaranMap]);

    const getFeedPrice = useCallback((jenisPakan: string) =>
        feedPriceMap.get(jenisPakan) || 0, [feedPriceMap]);

    const getTotalPengeluaranByKolam = useCallback((kolamId: string): number => {
        const specificExpenses = pengeluaranMap.get(kolamId) || [];
        return specificExpenses.reduce((sum, p) => sum + p.jumlah, 0);
    }, [pengeluaranMap]);

    const getTotalPengeluaranByKategori = useCallback((kolamId: string, kategori: KategoriPengeluaran): number => {
        const targetKat = kategori.toUpperCase();
        const knownCategories = ['PAKAN', 'BIBIT', 'LISTRIK', 'OBAT', 'TENAGA_KERJA', 'GAJI', 'MODAL'];
        const kolamExpenses = pengeluaranMap.get(kolamId) || [];

        return kolamExpenses
            .filter(p => {
                const pKat = p.kategori.toUpperCase();
                if (targetKat === 'LAINNYA') {
                    return !knownCategories.includes(pKat);
                }
                return pKat === targetKat;
            })
            .reduce((sum, p) => sum + p.jumlah, 0);
    }, [pengeluaranMap]);

    const getStokTersediaByJenis = useCallback((jenisPakan: string): number => {
        const totalStok = stokPakan
            .filter(s => s.jenisPakan === jenisPakan)
            .reduce((sum, s) => sum + s.stokAwal, 0);

        const recentUsed = pakan
            .filter(p => p.jenisPakan === jenisPakan)
            .reduce((sum, p) => sum + p.jumlahKg, 0);

        const historicalUsed = historicalFeedUsage[jenisPakan] || 0;

        return totalStok - (recentUsed + historicalUsed);
    }, [stokPakan, pakan, historicalFeedUsage]);

    const getPenjualanByKolam = useCallback((kolamId: string) =>
        (penjualanMap.get(kolamId) || []).sort((a: any, b: any) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        ), [penjualanMap]);

    const getTotalPenjualanByKolam = useCallback((kolamId: string): number =>
        (penjualanMap.get(kolamId) || []).reduce((sum, p) => sum + (p.beratKg * p.hargaPerKg), 0), [penjualanMap]);

    const getTotalPenjualan = useCallback((): number =>
        penjualan.reduce((sum, p) => sum + (p.beratKg * p.hargaPerKg), 0), [penjualan]);

    const getRiwayatIkanByKolam = useCallback((kolamId: string) =>
        (riwayatIkanMap.get(kolamId) || []).sort((a, b) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        ), [riwayatIkanMap]);


    const getAvailableFunds = useCallback((): number => {
        if (!farm) return 0;
        const totalPenjualanVal = getTotalPenjualan();
        const totalPengeluaranVal = pengeluaran.reduce((sum: number, p: any) => sum + p.jumlah, 0);
        return farm.modalAwal + totalPenjualanVal - totalPengeluaranVal;
    }, [farm, pengeluaran, getTotalPenjualan]);

    const getJadwalByKolam = useCallback((kolamId: string) =>
        jadwalPakan.filter(j => j.kolamId === kolamId).sort((a: any, b: any) =>
            a.waktu.localeCompare(b.waktu)
        ), [jadwalPakan]);

    const getPanenByKolam = useCallback((kolamId: string) =>
        (riwayatPanenMap.get(kolamId) || []).sort((a: any, b: any) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        ), [riwayatPanenMap]);

    const getSamplingByKolam = useCallback((kolamId: string) =>
        riwayatSampling.filter((s: any) => s.kolamId === kolamId).sort((a: any, b: any) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        ), [riwayatSampling]);

    const getLatestSampling = useCallback((kolamId: string) => {
        const samples = getSamplingByKolam(kolamId);
        return samples.length > 0 ? samples[0] : undefined;
    }, [getSamplingByKolam]);

    // Sorting Helper Functions
    const getSortirByKolam = useCallback((kolamId: string) =>
        riwayatSortir.filter((s: any) => s.kolamId === kolamId).sort((a: any, b: any) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        ), [riwayatSortir]);

    const getWeeksSinceTebar = useCallback((kolamId: string): number => {
        const kolam = getKolamById(kolamId);
        if (!kolam?.tanggalTebar) return 0;
        
        const tebarDate = new Date(kolam.tanggalTebar);
        const today = new Date();
        const daysPassed = Math.floor((today.getTime() - tebarDate.getTime()) / (1000 * 60 * 60 * 24));
        return Math.floor(daysPassed / 7);
    }, [getKolamById]);

    const getCurrentWeight = useCallback((kolamId: string): number => {
        const { averageWeight } = calculateBiomass(kolamId);
        return averageWeight * 1000; // Convert kg to grams
    }, [calculateBiomass]);

    const getSortingAlerts = useCallback((): SortingAlert[] => {
        const alerts: SortingAlert[] = [];
        
        // Periode sortir dengan kondisi: [periode, minggu minimum, bobot min (gram), bobot max (gram)]
        const sortingPeriods: [number, number, number, number][] = [
            [1, 2, 15, 25],
            [2, 4, 40, 55],
            [3, 6, 70, 90],
            [4, 8, 100, 125],
        ];

        for (const k of kolam) {
            if (!k.tanggalTebar) continue;

            const weeks = getWeeksSinceTebar(k.id);
            const currentWeight = getCurrentWeight(k.id);
            const sortirHistory = getSortirByKolam(k.id);

            for (const [periode, minWeek, minWeight, maxWeight] of sortingPeriods) {
                // Cek apakah periode ini sudah di-sortir
                const alreadySorted = sortirHistory.some(s => s.periode === periode);
                if (alreadySorted) continue;

                // Cek kondisi: minggu ATAU bobot
                const weekCondition = weeks >= minWeek;
                const weightCondition = currentWeight >= minWeight && currentWeight <= maxWeight;

                if (weekCondition || weightCondition) {
                    alerts.push({
                        kolamId: k.id,
                        kolamNama: k.nama,
                        periode,
                        reason: weekCondition ? 'week' : 'weight',
                        value: weekCondition ? weeks : Math.round(currentWeight),
                    });
                    break; // Only show the first matching period alert
                }
            }
        }

        return alerts;
    }, [kolam, getWeeksSinceTebar, getCurrentWeight, getSortirByKolam]);

    const getAllJenisPakan = useCallback(() => {
        const fromStok = stokPakan.map(s => s.jenisPakan);
        const fromPakan = pakan.map(p => p.jenisPakan);
        return [...new Set([...fromStok, ...fromPakan])];
    }, [stokPakan, pakan]);

    const getProfitByKolam = useCallback((kolamId: string): number => {
        const pendapatan = getTotalPenjualanByKolam(kolamId);
        const pengeluaranTotal = getTotalPengeluaranByKolam(kolamId);
        return pendapatan - pengeluaranTotal;
    }, [getTotalPenjualanByKolam, getTotalPengeluaranByKolam]);

    const calculateKepadatan = useCallback((k: Kolam): number => {
        const volume = k.panjang * k.lebar * k.kedalaman;
        return volume > 0 ? k.jumlahIkan / volume : 0;
    }, []);

    const calculateFCR = useCallback((kolamId: string): number => {
        const pakanKolam = getPakanByKolam(kolamId);
        const totalPakan = pakanKolam.reduce((sum: number, p: any) => sum + p.jumlahKg, 0);
        const k = getKolamById(kolamId);
        if (!k) return 0;
        const estimatedWeightGain = k.jumlahIkan * 0.05;
        return estimatedWeightGain > 0 ? totalPakan / estimatedWeightGain : 0;
    }, [getPakanByKolam, getKolamById]);


    // Helper to calculate metrics for a specific date range
    const calculateCycleMetrics = useCallback((kolamId: string, startDate: string, endDate: string, startTimestamp: string, endTimestamp?: string): Omit<CycleSummary, 'cycleNumber'> => {
        const k = getKolamById(kolamId);
        const strictFilter = (d: { tanggal: string }) => {
            const itemTime = new Date((d as any).createdAt || d.tanggal).getTime();
            const minTime = new Date(startTimestamp || startDate).getTime();
            const maxTime = endTimestamp ? new Date(endTimestamp).getTime() : Infinity;

            // Primary condition: Must match business date range (tanggal) to prevent "leaking" 
            // of late-entered data from previous cycles.
            if (d.tanggal < startDate) return false;
            if (endTimestamp && d.tanggal > endDate) return false; // Optional safety

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

        // Expenses (Normalize category for comparison)
        const cycleExpenses = pengeluaran.filter(p =>
            p.kolamId === kolamId &&
            p.kategori.toUpperCase() !== 'PAKAN' &&
            rangeFilterInclusive(p)
        );
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
    }, [getKolamById, pakan, riwayatPanen, getFeedPrice, pengeluaran, getRiwayatIkanByKolam]);

    const getCycleSummary = (kolamId: string): CycleSummary | null => {
        const k = getKolamById(kolamId);
        if (!k) return null;

        const historyDesc = getRiwayatIkanByKolam(kolamId);
        const startEvent = historyDesc.find(h =>
            h.keterangan.toLowerCase().includes('tebar') ||
            (h.jumlahPerubahan > 0 && h.jumlahAkhir === h.jumlahPerubahan)
        );

        if (!startEvent) return null;

        const today = new Date();
        const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const startDate = startEvent.tanggal;
        const startId = startEvent.id;
        let endDate = localToday;
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

    const getCycleHistory = useCallback((kolamId: string): CycleSummary[] => {
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
            const today = new Date();
            const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            let endDate = localToday;
            let isActive = true;

            if (i < tebarEvents.length - 1) {
                // Determine end based on NEXT cycle start
                const nextEvent = tebarEvents[i + 1];
                endTimestamp = (nextEvent as any).createdAt || nextEvent.tanggal;

                // For display, EndDate is the date of the last relevant event (Harvest)
                const lastHarvest = riwayatPanen.filter(p => {
                    const t = new Date((p as any).createdAt || p.tanggal).getTime();
                    return p.kolamId === kolamId &&
                        p.tanggal >= startEvent.tanggal && // Business Date must be after cycle start
                        t >= new Date(startTimestamp).getTime() &&
                        t < new Date(endTimestamp!).getTime();
                }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())[0];

                endDate = lastHarvest ? (lastHarvest.tanggal < startEvent.tanggal ? startEvent.tanggal : lastHarvest.tanggal) : startEvent.tanggal;
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
    }, [getRiwayatIkanByKolam, riwayatPanen, getKolamById, calculateCycleMetrics]);

    // === Dashboard Helpers ===

    const getFeedTrend = (days: number = 7) => {
        const result: { date: string; amount: number }[] = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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





    const addStokIkan = async (data: { kolamId: string; tanggal: string; jumlah: number; beratPerEkor: number; hargaPerEkor: number }) => {
        if (!activeFarmId) return;

        // 1. Validation Check
        const totalHarga = data.jumlah * data.hargaPerEkor;
        const available = getAvailableFunds();
        if (available < totalHarga) {
            throw new Error('Uang tersedia tidak mencukupi untuk penambahan bibit');
        }

        try {
            // Update Population History
            await addRiwayatIkan({
                kolamId: data.kolamId,
                tanggal: data.tanggal,
                jumlahPerubahan: data.jumlah,
                keterangan: 'Penebaran Bibit Tambahan'
            });

            // Update Sampling/Weight History
            if (data.beratPerEkor > 0) {
                const jumlahIkanPerKg = 1000 / data.beratPerEkor;
                await addRiwayatSampling({
                    kolamId: data.kolamId,
                    tanggal: data.tanggal,
                    bobotGram: data.beratPerEkor,
                    jumlahIkanPerKg,
                    catatan: `Bibit tambahan: ${data.beratPerEkor} gram/ekor`
                });
            }

            // Record Expense
            if (totalHarga > 0) {
                await addPengeluaran({
                    tanggal: data.tanggal,
                    kategori: 'BIBIT',
                    keterangan: `Pembelian bibit tambahan ${data.jumlah} ekor @ Rp${data.hargaPerEkor.toLocaleString('id-ID')}`,
                    jumlah: totalHarga,
                    kolamId: data.kolamId
                });
            }
        } catch (error) {
            console.error('Failed to add stok ikan:', error);
            throw error;
        }
    };

    const tebarBibit = async (kolamId: string, data: { tanggal: string; jumlah: number; beratPerEkor: number; hargaPerEkor: number }) => {
        if (!activeFarmId) return;

        // 1. Validation Check
        const totalHarga = data.jumlah * data.hargaPerEkor;
        const available = getAvailableFunds();
        if (available < totalHarga) {
            throw new Error('Uang tersedia tidak mencukupi untuk tebar bibit');
        }

        try {
            await updateKolam(kolamId, {
                tanggalTebar: data.tanggal,
                status: 'aman'
            });

            const isToday = new Date(data.tanggal).toDateString() === new Date().toDateString();
            const samplingTime = isToday ? new Date().toISOString() : new Date(data.tanggal).toISOString();

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
                    tanggal: samplingTime,
                    bobotGram: data.beratPerEkor,
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
    const GROWTH_RATE_PER_DAY = 0.002; // 2 grams per day (kg)
    const TARGET_WEIGHT_KG = 0.15; // 150 grams target (Production)
    const ESTIMATED_FEED_PRICE = 13000; // Rp/kg (fallback)

    const predictHarvestDate = (kolamId: string) => {
        const sampling = getLatestSampling(kolamId);
        // Default to small bibit size (5g = 0.005kg) if no sampling
        const currentWeight = sampling ? (1 / sampling.jumlahIkanPerKg) : 0.005;

        if (currentWeight >= TARGET_WEIGHT_KG) {
            const today = new Date();
            const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            return { daysRemaining: 0, date: localToday, currentWeight, targetReached: true };
        }

        const weightDiff = TARGET_WEIGHT_KG - currentWeight;
        const daysRemaining = Math.ceil(weightDiff / GROWTH_RATE_PER_DAY);

        const date = new Date();
        date.setDate(date.getDate() + daysRemaining);

        return {
            daysRemaining,
            date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
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
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
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
            farm,
            updateFarm,
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
            addStokIkan,
            calculateBiomass,
            getUnifiedStatus,
            riwayatSortir,
            addRiwayatSortir,
            getSortirByKolam,
            getSortingAlerts,
            getWeeksSinceTebar,
            getCurrentWeight,
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
            getAvailableFunds,
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
