'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSession } from 'next-auth/react';

// Types
export interface Kolam {
    id: string;
    nama: string;
    panjang: number;
    lebar: number;
    kedalaman: number;
    tanggalTebar: string;
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
    tanggal: string;
    beratTotalKg: number;
    jumlahEkor: number;
    hargaPerKg: number;
    tipe: TipePanen;
    catatan?: string;
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
    addPembeli: (pembeli: Omit<Pembeli, 'id'>) => Promise<void>;
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

    // Refresh
    refreshData: () => Promise<void>;
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
        tanggalTebar: typeof dbKolam.tanggalTebar === 'string'
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

    // State
    const [activeFarmId, setActiveFarmId] = useState<string | null>('cmkwud2ft000cdbvl90uq3lge');
    const [kolam, setKolam] = useState<Kolam[]>([]);
    const [pakan, setPakan] = useState<DataPakan[]>([]);
    const [kondisiAir, setKondisiAir] = useState<KondisiAir[]>([]);
    const [pengeluaran, setPengeluaran] = useState<Pengeluaran[]>([]);
    const [stokPakan, setStokPakan] = useState<StokPakan[]>([]);
    const [pembeli, setPembeli] = useState<Pembeli[]>([]);
    const [penjualan, setPenjualan] = useState<Penjualan[]>([]);
    const [jadwalPakan, setJadwalPakan] = useState<JadwalPakan[]>([]);
    const [riwayatPanen, setRiwayatPanen] = useState<RiwayatPanen[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

    // Fetch all data for active farm
    const fetchAllData = useCallback(async () => {
        if (!activeFarmId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const [
                kolamRes,
                pakanRes,
                stokPakanRes,
                kondisiAirRes,
                pengeluaranRes,
                pembeliRes,
                penjualanRes,
                jadwalRes,
                panenRes
            ] = await Promise.all([
                fetch(`/api/farms/${activeFarmId}/kolam`),
                fetch(`/api/farms/${activeFarmId}/pakan`),
                fetch(`/api/farms/${activeFarmId}/stok-pakan`),
                fetch(`/api/farms/${activeFarmId}/kondisi-air`),
                fetch(`/api/farms/${activeFarmId}/pengeluaran`),
                fetch(`/api/farms/${activeFarmId}/pembeli`),
                fetch(`/api/farms/${activeFarmId}/penjualan`),
                fetch(`/api/farms/${activeFarmId}/jadwal-pakan`),
                fetch(`/api/farms/${activeFarmId}/riwayat-panen`)
            ]);

            if (kolamRes.ok) {
                const data = await kolamRes.json();
                setKolam(data.map(mapKolam));
            }
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
                    kategori: p.kategori // Prisma returns UPPERCASE by default matched to Enum
                })));
            }
            if (pembeliRes.ok) {
                const data = await pembeliRes.json();
                setPembeli(data); // Prisma returns UPPERCASE
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
                    tanggal: (p.tanggal as string).split('T')[0],
                    tipe: p.tipe
                })));
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [activeFarmId]);

    // Load sidebar state from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('lele_sidebar_collapsed');
        if (saved) setIsSidebarCollapsed(JSON.parse(saved));
    }, []);

    // Save sidebar state
    useEffect(() => {
        localStorage.setItem('lele_sidebar_collapsed', JSON.stringify(isSidebarCollapsed));
    }, [isSidebarCollapsed]);

    // Fetch farm on auth
    useEffect(() => {
        fetchFarm();
    }, [fetchFarm]);

    // Fetch data when farm changes
    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const refreshData = async () => {
        await fetchAllData();
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

        // Map position to DB fields
        const dbUpdates: Record<string, unknown> = { ...updates };
        if (updates.position) {
            dbUpdates.positionX = updates.position.x;
            dbUpdates.positionY = updates.position.y;
            dbUpdates.positionW = updates.position.w;
            dbUpdates.positionH = updates.position.h;
            dbUpdates.color = updates.position.color;
            delete dbUpdates.position;
        }

        try {
            const res = await fetch(`/api/farms/${activeFarmId}/kolam/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dbUpdates)
            });
            if (res.ok) {
                const updated = await res.json();
                setKolam(prev => prev.map(k => k.id === id ? mapKolam(updated) : k));
            }
        } catch (error) {
            console.error('Failed to update kolam:', error);
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
            }
        } catch (error) {
            console.error('Failed to add pembeli:', error);
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
                    tanggal: created.tanggal.split('T')[0],
                    tipe: created.tipe
                }]);
                // Refresh kolam to get updated fish count
                await refreshData();
            }
        } catch (error) {
            console.error('Failed to add riwayat panen:', error);
        }
    };

    const deleteRiwayatPanen = (id: string) => {
        setRiwayatPanen(prev => prev.filter(p => p.id !== id));
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

    const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

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
            refreshData,
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
