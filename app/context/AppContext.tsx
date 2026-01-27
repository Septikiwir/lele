'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

export type KategoriPengeluaran = 'bibit' | 'pakan' | 'obat' | 'listrik' | 'tenaga_kerja' | 'lainnya';

export interface Pengeluaran {
    id: string;
    kolamId: string;
    tanggal: string;
    kategori: KategoriPengeluaran;
    keterangan: string;
    jumlah: number; // dalam rupiah
}

// Stok Pakan - Feed Inventory
export interface StokPakan {
    id: string;
    jenisPakan: string;
    stokAwal: number; // kg - initial stock added
    hargaPerKg: number; // rupiah per kg
    tanggalTambah: string;
    keterangan?: string;
}

// Pembeli - Buyer data
export type TipePembeli = 'tengkulak' | 'pasar' | 'restoran' | 'lainnya';

export interface Pembeli {
    id: string;
    nama: string;
    tipe: TipePembeli;
    kontak?: string;
    alamat?: string;
}

// Penjualan - Sales/Income data
export interface Penjualan {
    id: string;
    kolamId: string;
    pembeliId: string;
    tanggal: string;
    beratKg: number; // total weight sold
    hargaPerKg: number;
    jumlahIkan?: number; // optional - number of fish sold
    keterangan?: string;
}

// Jadwal Pakan - Feeding Schedule
export interface JadwalPakan {
    id: string;
    kolamId: string;
    waktu: string; // "HH:mm" format
    jenisPakan: string;
    jumlahKg: number;
    keterangan?: string;
    aktif: boolean;
}

// Riwayat Panen - Harvest Data (including Partial)
export type TipePanen = 'parsial' | 'total';

export interface RiwayatPanen {
    id: string;
    kolamId: string;
    tanggal: string;
    beratTotalKg: number;
    jumlahEkor: number; // estimated
    hargaPerKg: number;
    tipe: TipePanen;
    catatan?: string;
}

// Initial demo data
const initialKolam: Kolam[] = [
    {
        id: '1',
        nama: 'Kolam A1',
        panjang: 10,
        lebar: 5,
        kedalaman: 1.2,
        tanggalTebar: '2025-01-01',
        jumlahIkan: 5000,
        status: 'aman',
    },
    {
        id: '2',
        nama: 'Kolam A2',
        panjang: 8,
        lebar: 4,
        kedalaman: 1.0,
        tanggalTebar: '2025-01-15',
        jumlahIkan: 4000,
        status: 'waspada',
    },
    {
        id: '3',
        nama: 'Kolam B1',
        panjang: 12,
        lebar: 6,
        kedalaman: 1.5,
        tanggalTebar: '2024-12-01',
        jumlahIkan: 10000,
        status: 'berisiko',
    },
];

const initialPakan: DataPakan[] = [
    { id: '1', kolamId: '1', tanggal: '2025-01-27', jumlahKg: 15, jenisPakan: 'Pelet Hi-Pro' },
    { id: '2', kolamId: '1', tanggal: '2025-01-26', jumlahKg: 14, jenisPakan: 'Pelet Hi-Pro' },
    { id: '3', kolamId: '2', tanggal: '2025-01-27', jumlahKg: 10, jenisPakan: 'Pelet 781' },
];

const initialKondisiAir: KondisiAir[] = [
    { id: '1', kolamId: '1', tanggal: '2025-01-27', warna: 'Hijau cerah', bau: 'Normal', ketinggian: 1.1, ph: 7.2, suhu: 28 },
    { id: '2', kolamId: '2', tanggal: '2025-01-27', warna: 'Hijau pekat', bau: 'Amis', ketinggian: 0.9, ph: 6.8, suhu: 30 },
];

const initialPengeluaran: Pengeluaran[] = [
    { id: '1', kolamId: '1', tanggal: '2025-01-01', kategori: 'bibit', keterangan: 'Bibit lele 5000 ekor @Rp100', jumlah: 500000 },
    { id: '2', kolamId: '1', tanggal: '2025-01-15', kategori: 'pakan', keterangan: 'Pelet Hi-Pro 50kg', jumlah: 600000 },
    { id: '3', kolamId: '1', tanggal: '2025-01-20', kategori: 'obat', keterangan: 'Probiotik air', jumlah: 75000 },
    { id: '4', kolamId: '2', tanggal: '2025-01-15', kategori: 'bibit', keterangan: 'Bibit lele 4000 ekor @Rp100', jumlah: 400000 },
    { id: '5', kolamId: '2', tanggal: '2025-01-20', kategori: 'pakan', keterangan: 'Pelet 781 40kg', jumlah: 480000 },
    { id: '6', kolamId: '3', tanggal: '2024-12-01', kategori: 'bibit', keterangan: 'Bibit lele 10000 ekor @Rp100', jumlah: 1000000 },
    { id: '7', kolamId: '3', tanggal: '2024-12-15', kategori: 'pakan', keterangan: 'Pelet Hi-Pro 100kg', jumlah: 1200000 },
    { id: '8', kolamId: '3', tanggal: '2025-01-10', kategori: 'listrik', keterangan: 'Biaya aerator listrik', jumlah: 150000 },
];

const initialStokPakan: StokPakan[] = [
    { id: '1', jenisPakan: 'Pelet Hi-Pro', stokAwal: 150, hargaPerKg: 12000, tanggalTambah: '2025-01-01', keterangan: 'Pembelian awal' },
    { id: '2', jenisPakan: 'Pelet 781', stokAwal: 50, hargaPerKg: 10000, tanggalTambah: '2025-01-15', keterangan: 'Beli dari distributor' },
    { id: '3', jenisPakan: 'Pelet Ekonomis', stokAwal: 30, hargaPerKg: 8000, tanggalTambah: '2025-01-20' },
    { id: '4', jenisPakan: 'Cacing', stokAwal: 10, hargaPerKg: 25000, tanggalTambah: '2025-01-25' },
    { id: '5', jenisPakan: 'Maggot', stokAwal: 5, hargaPerKg: 20000, tanggalTambah: '2025-01-26' },
];

const initialPembeli: Pembeli[] = [
    { id: '1', nama: 'Pak Joko', tipe: 'tengkulak', kontak: '081234567890', alamat: 'Pasar Induk' },
    { id: '2', nama: 'Rumah Makan Sederhana', tipe: 'restoran', kontak: '082345678901', alamat: 'Jl. Raya No. 10' },
    { id: '3', nama: 'Toko Ikan Segar', tipe: 'pasar', kontak: '083456789012', alamat: 'Pasar Tradisional' },
];

const initialPenjualan: Penjualan[] = [
    { id: '1', kolamId: '3', pembeliId: '1', tanggal: '2025-01-20', beratKg: 500, hargaPerKg: 25000, jumlahIkan: 2500, keterangan: 'Panen parsial' },
    { id: '2', kolamId: '3', pembeliId: '2', tanggal: '2025-01-22', beratKg: 100, hargaPerKg: 28000, jumlahIkan: 500, keterangan: 'Penjualan ke restoran' },
];

const initialJadwalPakan: JadwalPakan[] = [
    { id: '1', kolamId: '1', waktu: '07:00', jenisPakan: 'Pelet Hi-Pro', jumlahKg: 5, aktif: true },
    { id: '2', kolamId: '1', waktu: '12:00', jenisPakan: 'Pelet Hi-Pro', jumlahKg: 5, aktif: true },
    { id: '3', kolamId: '1', waktu: '17:00', jenisPakan: 'Pelet Hi-Pro', jumlahKg: 5, aktif: true },
    { id: '4', kolamId: '2', waktu: '07:00', jenisPakan: 'Pelet 781', jumlahKg: 4, aktif: true },
    { id: '5', kolamId: '2', waktu: '17:00', jenisPakan: 'Pelet 781', jumlahKg: 4, aktif: true },
    { id: '6', kolamId: '3', waktu: '06:00', jenisPakan: 'Pelet Hi-Pro', jumlahKg: 10, keterangan: 'Pagi sebelum matahari tinggi', aktif: true },
    { id: '7', kolamId: '3', waktu: '18:00', jenisPakan: 'Pelet Hi-Pro', jumlahKg: 10, keterangan: 'Sore menjelang malam', aktif: true },
];

const initialRiwayatPanen: RiwayatPanen[] = [
    { id: '1', kolamId: '3', tanggal: '2025-01-20', beratTotalKg: 50, jumlahEkor: 500, hargaPerKg: 25000, tipe: 'parsial', catatan: 'Panen sortir ukuran konsumsi' }
];

// Context
interface AppContextType {
    kolam: Kolam[];
    pakan: DataPakan[];
    kondisiAir: KondisiAir[];
    pengeluaran: Pengeluaran[];
    stokPakan: StokPakan[];
    pembeli: Pembeli[];
    penjualan: Penjualan[];
    jadwalPakan: JadwalPakan[];
    addKolam: (kolam: Omit<Kolam, 'id' | 'status'>) => void;
    updateKolam: (id: string, kolam: Partial<Kolam>) => void;
    deleteKolam: (id: string) => void;
    addPakan: (pakan: Omit<DataPakan, 'id'>) => void;
    addKondisiAir: (kondisi: Omit<KondisiAir, 'id'>) => void;
    addPengeluaran: (pengeluaran: Omit<Pengeluaran, 'id'>) => void;
    deletePengeluaran: (id: string) => void;
    addStokPakan: (stok: Omit<StokPakan, 'id'>) => void;
    deleteStokPakan: (id: string) => void;
    addPembeli: (pembeli: Omit<Pembeli, 'id'>) => void;
    deletePembeli: (id: string) => void;
    addPenjualan: (penjualan: Omit<Penjualan, 'id'>) => void;
    deletePenjualan: (id: string) => void;
    addJadwalPakan: (jadwal: Omit<JadwalPakan, 'id'>) => void;
    updateJadwalPakan: (id: string, updates: Partial<JadwalPakan>) => void;
    deleteJadwalPakan: (id: string) => void;
    getJadwalByKolam: (kolamId: string) => JadwalPakan[];
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
    // Panen
    riwayatPanen: RiwayatPanen[];
    addRiwayatPanen: (panen: Omit<RiwayatPanen, 'id'>) => void;
    deleteRiwayatPanen: (id: string) => void;
    getPanenByKolam: (kolamId: string) => RiwayatPanen[];
    // UI State
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper functions
function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

function calculateStatus(kepadatan: number): 'aman' | 'waspada' | 'berisiko' {
    if (kepadatan <= 50) return 'aman';
    if (kepadatan <= 100) return 'waspada';
    return 'berisiko';
}

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
    const [kolam, setKolam] = useState<Kolam[]>([]);
    const [pakan, setPakan] = useState<DataPakan[]>([]);
    const [kondisiAir, setKondisiAir] = useState<KondisiAir[]>([]);
    const [pengeluaran, setPengeluaran] = useState<Pengeluaran[]>([]);
    const [stokPakan, setStokPakan] = useState<StokPakan[]>([]);
    const [pembeli, setPembeli] = useState<Pembeli[]>([]);
    const [penjualan, setPenjualan] = useState<Penjualan[]>([]);
    const [jadwalPakan, setJadwalPakan] = useState<JadwalPakan[]>([]);
    const [riwayatPanen, setRiwayatPanen] = useState<RiwayatPanen[]>([]);
    // UI State
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const savedKolam = localStorage.getItem('lele_kolam');
        const savedPakan = localStorage.getItem('lele_pakan');
        const savedKondisiAir = localStorage.getItem('lele_kondisi_air');
        const savedPengeluaran = localStorage.getItem('lele_pengeluaran');
        const savedStokPakan = localStorage.getItem('lele_stok_pakan');
        const savedPembeli = localStorage.getItem('lele_pembeli');
        const savedPenjualan = localStorage.getItem('lele_penjualan');
        const savedJadwalPakan = localStorage.getItem('lele_jadwal_pakan');
        const savedRiwayatPanen = localStorage.getItem('lele_riwayat_panen');
        const savedSidebar = localStorage.getItem('lele_sidebar_collapsed');

        setKolam(savedKolam ? JSON.parse(savedKolam) : initialKolam);
        setPakan(savedPakan ? JSON.parse(savedPakan) : initialPakan);
        setKondisiAir(savedKondisiAir ? JSON.parse(savedKondisiAir) : initialKondisiAir);
        setPengeluaran(savedPengeluaran ? JSON.parse(savedPengeluaran) : initialPengeluaran);
        setStokPakan(savedStokPakan ? JSON.parse(savedStokPakan) : initialStokPakan);
        setPembeli(savedPembeli ? JSON.parse(savedPembeli) : initialPembeli);
        setPenjualan(savedPenjualan ? JSON.parse(savedPenjualan) : initialPenjualan);
        setJadwalPakan(savedJadwalPakan ? JSON.parse(savedJadwalPakan) : initialJadwalPakan);
        setRiwayatPanen(savedRiwayatPanen ? JSON.parse(savedRiwayatPanen) : initialRiwayatPanen);
        if (savedSidebar) setIsSidebarCollapsed(JSON.parse(savedSidebar));

        setIsLoaded(true);
    }, []);

    // Save to localStorage when data changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('lele_kolam', JSON.stringify(kolam));
        }
    }, [kolam, isLoaded]);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('lele_pakan', JSON.stringify(pakan));
        }
    }, [pakan, isLoaded]);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('lele_kondisi_air', JSON.stringify(kondisiAir));
        }
    }, [kondisiAir, isLoaded]);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('lele_pengeluaran', JSON.stringify(pengeluaran));
        }
    }, [pengeluaran, isLoaded]);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('lele_stok_pakan', JSON.stringify(stokPakan));
        }
    }, [stokPakan, isLoaded]);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('lele_pembeli', JSON.stringify(pembeli));
        }
    }, [pembeli, isLoaded]);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('lele_penjualan', JSON.stringify(penjualan));
        }
    }, [penjualan, isLoaded]);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('lele_jadwal_pakan', JSON.stringify(jadwalPakan));
        }
    }, [jadwalPakan, isLoaded]);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('lele_riwayat_panen', JSON.stringify(riwayatPanen));
        }
    }, [riwayatPanen, isLoaded]);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('lele_sidebar_collapsed', JSON.stringify(isSidebarCollapsed));
        }
    }, [isSidebarCollapsed, isLoaded]);

    const calculateKepadatan = (k: Kolam): number => {
        const volume = k.panjang * k.lebar * k.kedalaman;
        return volume > 0 ? k.jumlahIkan / volume : 0;
    };

    const addKolam = (newKolam: Omit<Kolam, 'id' | 'status'>) => {
        const tempKolam = { ...newKolam, id: '', status: 'aman' as const };
        const kepadatan = calculateKepadatan(tempKolam as Kolam);
        const status = calculateStatus(kepadatan);

        setKolam(prev => [...prev, { ...newKolam, id: generateId(), status }]);
    };

    const updateKolam = (id: string, updates: Partial<Kolam>) => {
        setKolam(prev => prev.map(k => {
            if (k.id !== id) return k;
            const updated = { ...k, ...updates };
            const kepadatan = calculateKepadatan(updated);
            return { ...updated, status: calculateStatus(kepadatan) };
        }));
    };

    const deleteKolam = (id: string) => {
        setKolam(prev => prev.filter(k => k.id !== id));
        setPakan(prev => prev.filter(p => p.kolamId !== id));
        setKondisiAir(prev => prev.filter(ka => ka.kolamId !== id));
        setPengeluaran(prev => prev.filter(p => p.kolamId !== id));
    };

    const addPakan = (newPakan: Omit<DataPakan, 'id'>) => {
        setPakan(prev => [...prev, { ...newPakan, id: generateId() }]);
    };

    const addKondisiAir = (newKondisi: Omit<KondisiAir, 'id'>) => {
        setKondisiAir(prev => [...prev, { ...newKondisi, id: generateId() }]);
    };

    const getKolamById = (id: string) => kolam.find(k => k.id === id);

    const getPakanByKolam = (kolamId: string) =>
        pakan.filter(p => p.kolamId === kolamId).sort((a, b) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        );

    const getKondisiAirByKolam = (kolamId: string) =>
        kondisiAir.filter(ka => ka.kolamId === kolamId).sort((a, b) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        );

    const addPengeluaran = (newPengeluaran: Omit<Pengeluaran, 'id'>) => {
        setPengeluaran(prev => [...prev, { ...newPengeluaran, id: generateId() }]);
    };

    const deletePengeluaran = (id: string) => {
        setPengeluaran(prev => prev.filter(p => p.id !== id));
    };

    const getPengeluaranByKolam = (kolamId: string) =>
        pengeluaran.filter(p => p.kolamId === kolamId).sort((a, b) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        );

    const getTotalPengeluaranByKolam = (kolamId: string): number =>
        pengeluaran.filter(p => p.kolamId === kolamId).reduce((sum, p) => sum + p.jumlah, 0);

    const getTotalPengeluaranByKategori = (kolamId: string, kategori: KategoriPengeluaran): number =>
        pengeluaran.filter(p => p.kolamId === kolamId && p.kategori === kategori).reduce((sum, p) => sum + p.jumlah, 0);

    // Stok Pakan functions
    const addStokPakan = (newStok: Omit<StokPakan, 'id'>) => {
        setStokPakan(prev => [...prev, { ...newStok, id: generateId() }]);
    };

    const deleteStokPakan = (id: string) => {
        setStokPakan(prev => prev.filter(s => s.id !== id));
    };

    // Calculate available stock by feed type (stok awal - used)
    const getStokTersediaByJenis = (jenisPakan: string): number => {
        const totalStok = stokPakan
            .filter(s => s.jenisPakan === jenisPakan)
            .reduce((sum, s) => sum + s.stokAwal, 0);
        const totalUsed = pakan
            .filter(p => p.jenisPakan === jenisPakan)
            .reduce((sum, p) => sum + p.jumlahKg, 0);
        return totalStok - totalUsed;
    };

    // Get all unique feed types
    const getAllJenisPakan = (): string[] => {
        const fromStok = stokPakan.map(s => s.jenisPakan);
        const fromPakan = pakan.map(p => p.jenisPakan);
        return [...new Set([...fromStok, ...fromPakan])];
    };

    // Pembeli functions
    const addPembeli = (newPembeli: Omit<Pembeli, 'id'>) => {
        setPembeli(prev => [...prev, { ...newPembeli, id: generateId() }]);
    };

    const deletePembeli = (id: string) => {
        setPembeli(prev => prev.filter(p => p.id !== id));
    };

    // Penjualan functions
    const addPenjualan = (newPenjualan: Omit<Penjualan, 'id'>) => {
        setPenjualan(prev => [...prev, { ...newPenjualan, id: generateId() }]);
    };

    const deletePenjualan = (id: string) => {
        setPenjualan(prev => prev.filter(p => p.id !== id));
    };

    const getPenjualanByKolam = (kolamId: string) =>
        penjualan.filter(p => p.kolamId === kolamId).sort((a, b) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        );

    const getTotalPenjualanByKolam = (kolamId: string): number =>
        penjualan.filter(p => p.kolamId === kolamId).reduce((sum, p) => sum + (p.beratKg * p.hargaPerKg), 0);

    const getTotalPenjualan = (): number =>
        penjualan.reduce((sum, p) => sum + (p.beratKg * p.hargaPerKg), 0);

    // Jadwal Pakan functions
    const addJadwalPakan = (newJadwal: Omit<JadwalPakan, 'id'>) => {
        setJadwalPakan(prev => [...prev, { ...newJadwal, id: generateId() }]);
    };

    const updateJadwalPakan = (id: string, updates: Partial<JadwalPakan>) => {
        setJadwalPakan(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
    };

    const deleteJadwalPakan = (id: string) => {
        setJadwalPakan(prev => prev.filter(j => j.id !== id));
    };

    const getJadwalByKolam = (kolamId: string) =>
        jadwalPakan.filter(j => j.kolamId === kolamId).sort((a, b) =>
            a.waktu.localeCompare(b.waktu)
        );

    const getProfitByKolam = (kolamId: string): number => {
        const pendapatan = getTotalPenjualanByKolam(kolamId);
        const pengeluaranTotal = getTotalPengeluaranByKolam(kolamId);
        return pendapatan - pengeluaranTotal;
    };

    const calculateFCR = (kolamId: string): number => {
        const pakanKolam = getPakanByKolam(kolamId);
        const totalPakan = pakanKolam.reduce((sum, p) => sum + p.jumlahKg, 0);
        // Simplified FCR calculation (normally would need weight gain data)
        const k = getKolamById(kolamId);
        if (!k) return 0;
        const estimatedWeightGain = k.jumlahIkan * 0.05; // Assume 50g avg weight gain per fish
        return estimatedWeightGain > 0 ? totalPakan / estimatedWeightGain : 0;
    };

    // Panen Logic
    const addRiwayatPanen = (newPanen: Omit<RiwayatPanen, 'id'>) => {
        const panenId = generateId();
        const panenRecord = { ...newPanen, id: panenId };

        // 1. Add record
        setRiwayatPanen(prev => [panenRecord, ...prev]);

        // 2. Reduce fish count in Kolam (Direct state update to ensure consistency)
        setKolam(prev => prev.map(k => {
            if (k.id !== newPanen.kolamId) return k;

            let newCount = k.jumlahIkan - newPanen.jumlahEkor;
            if (newCount < 0) newCount = 0;

            return {
                ...k,
                jumlahIkan: newCount,
                // Recalculate density
                status: calculateStatus(newCount / (k.panjang * k.lebar * k.kedalaman))
            };
        }));
    };

    const deleteRiwayatPanen = (id: string) => {
        // Optional: Revert fish count? Might be complex if cycle changed.
        // For simplicity, just delete record for now.
        setRiwayatPanen(prev => prev.filter(p => p.id !== id));
    };

    const getPanenByKolam = (kolamId: string) =>
        riwayatPanen.filter(p => p.kolamId === kolamId).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

    const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-pulse text-slate-500">Loading...</div>
            </div>
        );
    }

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
            riwayatPanen,
            addRiwayatPanen,
            deleteRiwayatPanen,
            getPanenByKolam,
            isSidebarCollapsed,
            toggleSidebar,
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
