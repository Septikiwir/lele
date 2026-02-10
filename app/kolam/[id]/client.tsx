'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import Modal from '../../components/ui/Modal';
import SortirModal from '../../components/modals/SortirModal';
import PanenModal from '../../components/modals/PanenModal';
import {
    ChevronLeft,
    Edit,
    Fish,
    Calendar,
    Info,
    Clock,
    TrendingUp,
    Scale,
    Edit2,
    Check,
    ArrowRight,
    Plus,
    Loader2,
    ArrowLeft,
    Bookmark,
    X,
    ArrowUpDown,
    Package,
    ShoppingCart
} from 'lucide-react';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GridCell {
    row: number;
    col: number;
    kepadatan: number;
    status: 'aman' | 'waspada' | 'berisiko';
}

const statusColors = {
    aman: 'grid-cell-aman',
    waspada: 'grid-cell-waspada',
    berisiko: 'grid-cell-berisiko',
};

const statusLabels = {
    aman: 'Aman',
    waspada: 'Waspada',
    berisiko: 'Berisiko',
};

const rekomendasi = {
    aman: 'Kepadatan ideal. Lanjutkan pemberian pakan sesuai jadwal.',
    waspada: 'Kepadatan mulai tinggi. Pertimbangkan untuk memanen sebagian atau mengurangi pakan.',
    berisiko: 'Kepadatan terlalu tinggi! Segera lakukan panen sebagian atau pindahkan ikan ke kolam lain.',
};

interface InitialData {
    id: string;
    nama: string;
    panjang: number;
    lebar: number;
    kedalaman: number;
    tanggalTebar: string | null;
    jumlahIkan: number;
    status: 'aman' | 'waspada' | 'berisiko';
    pakan: any[];
    kondisiAir: any[];
    riwayatIkan: any[];
    riwayatSampling: any[];
    penjualan: any[];
    riwayatPanen: any[];
    riwayatSortir: any[];
}

interface KolamDetailClientProps {
    initialData: InitialData;
}

export default function KolamDetailClient({ initialData }: KolamDetailClientProps) {
    const {
        kolam: allKolam,
        calculateBiomass,
        calculateKepadatan,
        getUnifiedStatus,
        addRiwayatSampling,
        addRiwayatIkan,
        addStokIkan,
        getSamplingByKolam,
        getCycleHistory,
        getAvailableFunds,
        getSortirByKolam,
        getRiwayatIkanByKolam,
        getSortingAlerts,
        getWeeksSinceTebar,
        getCurrentWeight,
        getPakanByKolam,
        addPakan,
        getAllJenisPakan
    } = useApp();

    const [gridScale, setGridScale] = useState<number>(1);
    const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);
    const [pinnedCells, setPinnedCells] = useState<GridCell[]>([]);
    const [showTooltip, setShowTooltip] = useState<{ x: number; y: number } | null>(null);

    // Edit Fish Count State
    const [isEditFishOpen, setIsEditFishOpen] = useState(false);
    const [isSortirModalOpen, setIsSortirModalOpen] = useState(false);
    const [editFishCount, setEditFishCount] = useState('');
    const [addFishCount, setAddFishCount] = useState('');
    const [hargaBibit, setHargaBibit] = useState('');
    const [beratBibit, setBeratBibit] = useState('');
    const [editReason, setEditReason] = useState('Kematian Tambahan');
    const [targetKolamId, setTargetKolamId] = useState('');
    const [pindahJumlah, setPindahJumlah] = useState('');

    // Sampling State
    const [isSamplingOpen, setIsSamplingOpen] = useState(false);
    const [samplingInputUnit, setSamplingInputUnit] = useState<'berat' | 'size'>('berat');
    const [samplingValue, setSamplingValue] = useState('');
    const [samplingCatatan, setSamplingCatatan] = useState('');

    // Feed Modal State
    const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
    const [feedForm, setFeedForm] = useState({
        kolamId: '',
        tanggal: new Date().toLocaleDateString('en-CA'),
        jumlahKg: '',
        jenisPakan: ''
    });

    // Panen Modal State
    const [isPanenModalOpen, setIsPanenModalOpen] = useState(false);

    // History View State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [chartRange, setChartRange] = useState<'7' | '30' | '90' | 'all'>('30');

    // Use initialData as the kolam reference (already loaded from server)
    const kolam = initialData;
    const cycleHistory = useMemo(() => getCycleHistory(kolam.id), [kolam.id, getCycleHistory]);

    // Check for recent sortir (within 24 hours)
    const recentSortir = useMemo(() => {
        const sortirHistory = getSortirByKolam(kolam.id);
        if (sortirHistory.length === 0) return null;
        
        const lastSortir = sortirHistory[0]; // Assuming sorted by date desc
        const sortirDate = new Date(lastSortir.tanggal);
        const now = new Date();
        const hoursSince = (now.getTime() - sortirDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSince <= 24) {
            return lastSortir;
        }
        return null;
    }, [kolam.id, getSortirByKolam]);

    const handleUpdateFish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!kolam || isSubmitting) return;

        setIsSubmitting(true);
        try {
            if (editReason === 'Bibit Baru') {
                const countToAdd = parseInt(parseCurrencyInput(addFishCount));
                const price = parseInt(parseCurrencyInput(hargaBibit));
                const weight = parseFloat(beratBibit);

                if (isNaN(countToAdd) || countToAdd <= 0) throw new Error("Jumlah ikan tidak valid");

                await addStokIkan({
                    kolamId: kolam.id,
                    tanggal: new Date().toISOString(),
                    jumlah: countToAdd,
                    beratPerEkor: weight || 0,
                    hargaPerEkor: price || 0
                });
            } else if (editReason === 'Pindah Kolam') {
                const jumlahPindah = parseInt(parseCurrencyInput(pindahJumlah));
                if (!targetKolamId) throw new Error("Kolam tujuan harus dipilih");
                if (isNaN(jumlahPindah) || jumlahPindah <= 0) throw new Error("Jumlah ikan yang dipindah tidak valid");
                if (jumlahPindah > kolam.jumlahIkan) throw new Error("Jumlah ikan yang dipindah tidak boleh melebihi populasi");

                const targetKolamInfo = allKolam.find(k => k.id === targetKolamId);
                
                // Record for source pond (reduce)
                await addRiwayatIkan({
                    kolamId: kolam.id,
                    tanggal: new Date().toISOString(),
                    jumlahPerubahan: -jumlahPindah,
                    keterangan: `Pindah Kolam ke ${targetKolamInfo?.nama || 'Kolam Lain'}`
                });

                // Record for target pond (add)
                await addRiwayatIkan({
                    kolamId: targetKolamId,
                    tanggal: new Date().toISOString(),
                    jumlahPerubahan: jumlahPindah,
                    keterangan: `Terima dari ${kolam.nama}`
                });
            } else {
                // For "Kematian Tambahan", input is the number of dead fish
                if (editReason === 'Kematian Tambahan') {
                    const deadCount = parseInt(parseCurrencyInput(editFishCount));
                    if (!isNaN(deadCount) && deadCount > 0) {
                        if (deadCount > kolam.jumlahIkan) {
                            throw new Error("Jumlah ikan yang mati tidak boleh melebihi populasi");
                        }

                        await addRiwayatIkan({
                            kolamId: kolam.id,
                            tanggal: new Date().toISOString(),
                            jumlahPerubahan: -deadCount,
                            keterangan: editReason
                        });
                    } else if (deadCount === 0) {
                        setIsEditFishOpen(false);
                        return;
                    }
                } else {
                    // For other reasons (if any), input is the new total count
                    const newCount = parseInt(parseCurrencyInput(editFishCount));
                    if (!isNaN(newCount) && newCount >= 0) {
                        const currentCount = kolam.jumlahIkan;
                        const delta = newCount - currentCount;

                        if (delta === 0) {
                            setIsEditFishOpen(false);
                            return;
                        }

                        await addRiwayatIkan({
                            kolamId: kolam.id,
                            tanggal: new Date().toISOString(),
                            jumlahPerubahan: delta,
                            keterangan: editReason
                        });
                    }
                }
            }
            setIsEditFishOpen(false);
            // Reset fields
            setAddFishCount('');
            setHargaBibit('');
            setBeratBibit('');
            setTargetKolamId('');
            setPindahJumlah('');
        } catch (error) {
            console.error("Failed to update fish count:", error);
            alert("Gagal mengupdate jumlah ikan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputSampling = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!kolam || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const val = parseFloat(samplingValue);
            if (!isNaN(val) && val > 0) {
                let sizePerKg = 0;
                let bobotGram = 0;

                if (samplingInputUnit === 'berat') {
                    bobotGram = val;
                    sizePerKg = Math.round(1000 / val);
                } else {
                    sizePerKg = Math.round(val);
                    bobotGram = 1000 / val;
                }

                if (sizePerKg > 0) {
                    await addRiwayatSampling({
                        kolamId: kolam.id,
                        tanggal: new Date().toISOString(),
                        jumlahIkanPerKg: sizePerKg,
                        bobotGram: bobotGram,
                        catatan: samplingCatatan
                    });
                    setIsSamplingOpen(false);
                    setSamplingValue('');
                    setSamplingCatatan('');
                } else {
                    alert("Nilai tidak valid");
                }
            }
        } catch (error) {
            console.error("Failed to add sampling:", error);
            alert("Gagal menyimpan sampling.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Auto-Sync Growth Logic
    const samplingHistory = getSamplingByKolam(kolam.id);
    const sortirHistory = getSortirByKolam(kolam.id);
    const riwayatIkanHistory = getRiwayatIkanByKolam(kolam.id);
    const sortingAlerts = getSortingAlerts().filter(alert => alert.kolamId === kolam.id);
    const syncRef = useRef(false);

    const handleFeedSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedForm.kolamId || !feedForm.jumlahKg || !feedForm.jenisPakan) {
            alert('Mohon lengkapi semua data pakan');
            return;
        }
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            // Determine the timestamp
            let timestamp = feedForm.tanggal;
            const today = new Date();
            const todayStr = today.toLocaleDateString('en-CA');
            
            if (feedForm.tanggal === todayStr) {
                // If the date is today, use the current time
                timestamp = today.toISOString();
            } else {
                // If it's a different date (backdated), we still want to preserve the "ordering" if possible,
                // or just default to that day at the current time to allow sorting relative to other events that day?
                // Or safely default to noon to avoid timezone shift issues
                // Using 12:00:00 on that day
                const d = new Date(feedForm.tanggal);
                d.setHours(12, 0, 0, 0); // Noon
                timestamp = d.toISOString();
            }

            await addPakan({
                kolamId: feedForm.kolamId,
                tanggal: timestamp,
                jumlahKg: parseFloat(feedForm.jumlahKg),
                jenisPakan: feedForm.jenisPakan,
            });
            setIsFeedModalOpen(false);
            // Reset but keep ID and Date
            setFeedForm(prev => ({ ...prev, jumlahKg: '' }));
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const syncMissingGrowth = async () => {
            if (!kolam.id || syncRef.current || isSyncing || samplingHistory.length === 0) return;

            const lastSampling = samplingHistory[0];
            const lastDateDate = new Date(lastSampling.tanggal);
            const now = new Date();

            const getEffective01AM = (date: Date) => {
                const d = new Date(date);
                if (d.getHours() < 1) d.setDate(d.getDate() - 1);
                d.setHours(1, 0, 0, 0);
                return d;
            };

            const start01AM = getEffective01AM(lastDateDate);
            const end01AM = getEffective01AM(now);
            const missedDays = Math.max(0, Math.floor((end01AM.getTime() - start01AM.getTime()) / (1000 * 60 * 60 * 24)));

            if (missedDays > 0) {
                syncRef.current = true;
                setIsSyncing(true);
                try {
                    // Start recording from the next day's 01:00 AM
                    const startMs = start01AM.getTime();
                    const dayMs = 1000 * 60 * 60 * 24;

                    for (let i = 1; i <= missedDays; i++) {
                        const syncTime = new Date(startMs + (i * dayMs));

                        const baseWeight = lastSampling.bobotGram || (1000 / lastSampling.jumlahIkanPerKg);
                        const newWeight = Math.round(baseWeight + (i * 2)); // +2g every day
                        const sizePerKg = Math.round(1000 / newWeight);

                        await addRiwayatSampling({
                            kolamId: kolam.id,
                            tanggal: syncTime.toISOString(),
                            bobotGram: newWeight,
                            jumlahIkanPerKg: sizePerKg,
                            catatan: 'Pertumbuhan Otomatis Harian (+2g)'
                        });
                    }
                } catch (err) {
                    console.error("Auto-sync growth failed:", err);
                } finally {
                    setIsSyncing(false);
                    setTimeout(() => { syncRef.current = false; }, 2000);
                }
            }
        };

        syncMissingGrowth();
    }, [kolam.id, samplingHistory[0]?.id]); // Only re-run if the latest sampling record changes

    // Calculate biomass and status BEFORE using in chartData
    const kepadatan = calculateKepadatan(kolam as any);
    const volume = kolam.panjang * kolam.lebar * kolam.kedalaman;
    const luas = kolam.panjang * kolam.lebar;
    const unifiedStatus = getUnifiedStatus(kolam.id);
    const { totalBiomass, density: biomassDensity, averageWeight } = calculateBiomass(kolam.id);
    const displayStatus = unifiedStatus.status;

    // Calculate total pakan for current cycle (getPakanByKolam is already filtered by current cycle)
    const pakanHistory = getPakanByKolam(kolam.id);
    const totalPakanSiklus = useMemo(() => {
        return pakanHistory.reduce((sum, p) => sum + p.jumlahKg, 0);
    }, [pakanHistory]);

    // Filter, Sort, and Deduplicate Chart Data (Merge sampling + sortir, use calculated weight for recent data)
    const chartData = useMemo(() => {
        const sortirHistory = getSortirByKolam(kolam.id);
        
        // Merge sampling and sortir data
        const allWeightData: any[] = [];
        
        // Add sampling data
        samplingHistory.forEach(s => {
            allWeightData.push({
                tanggal: s.tanggal,
                berat: s.bobotGram || (s.jumlahIkanPerKg > 0 ? 1000 / s.jumlahIkanPerKg : 0),
                source: 'sampling',
                id: s.id
            });
        });
        
        // Add sortir data (only if bobotRataRata exists)
        sortirHistory.forEach((s: any) => {
            if (s.bobotRataRata && s.bobotRataRata > 0) {
                allWeightData.push({
                    tanggal: s.tanggal,
                    berat: s.bobotRataRata,
                    source: 'sortir',
                    id: s.id
                });
            }
        });
        
        // Filter by date range
        const filtered = allWeightData.filter(d => {
            if (chartRange === 'all') return true;
            const daysArr = { '7': 7, '30': 30, '90': 90 };
            const limitDate = new Date();
            limitDate.setDate(limitDate.getDate() - (daysArr[chartRange as keyof typeof daysArr] || 0));
            return new Date(d.tanggal) >= limitDate;
        });
        
        // Sort by date
        const sorted = filtered.sort((a, b) => 
            new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
        );
        
        // Deduplicate: If multiple records in one day, prefer sortir over sampling
        const deduplicatedMap = new Map();
        sorted.forEach(d => {
            const dateKey = new Date(d.tanggal).toLocaleDateString('en-CA'); // YYYY-MM-DD
            const existing = deduplicatedMap.get(dateKey);
            // Prefer sortir data if both exist
            if (!existing || d.source === 'sortir') {
                deduplicatedMap.set(dateKey, d);
            }
        });
        
        // Convert to array and map to chart format
        const result = Array.from(deduplicatedMap.values()).map(d => {
            const dataDate = new Date(d.tanggal);
            const todayDate = new Date();
            
            // Check if this data is from today
            const isToday = dataDate.toLocaleDateString('en-CA') === todayDate.toLocaleDateString('en-CA');
            
            // For today's data, use calculated weight from calculateBiomass to ensure consistency
            const displayWeight = isToday && averageWeight > 0 
                ? Math.round(averageWeight * 1000)
                : Math.round(Number(d.berat));
            
            return {
                id: d.id,
                fullDate: d.tanggal,
                tanggal: dataDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
                berat: displayWeight,
                source: isToday ? 'calculated' : d.source
            };
        });
        
        // If no data for today, add calculated weight as current data point
        const todayKey = new Date().toLocaleDateString('en-CA');
        const hasToday = deduplicatedMap.has(todayKey);
        
        if (!hasToday && averageWeight > 0) {
            result.push({
                id: 'current',
                fullDate: new Date().toISOString(),
                tanggal: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
                berat: Math.round(averageWeight * 1000),
                source: 'calculated'
            });
        }
        
        return result;
    }, [samplingHistory, chartRange, getSortirByKolam, kolam.id, averageWeight]);

    const cols = Math.ceil(kolam.panjang / gridScale);
    const rows = Math.ceil(kolam.lebar / gridScale);

    const generateCellData = (row: number, col: number): GridCell => {
        const baseKepadatan = unifiedStatus.source === 'berat' ? unifiedStatus.kepadatanBerat : unifiedStatus.kepadatanEkor;
        const variation = (Math.sin(row * 0.5) + Math.cos(col * 0.7)) * (baseKepadatan * 0.2);
        const cellKepadatan = Math.max(0, baseKepadatan + variation);

        let status: 'aman' | 'waspada' | 'berisiko' = 'aman';
        if (unifiedStatus.source === 'berat') {
            if (cellKepadatan > 20) status = 'berisiko';
            else if (cellKepadatan > 10) status = 'waspada';
        } else {
            if (cellKepadatan > 100) status = 'berisiko';
            else if (cellKepadatan > 50) status = 'waspada';
        }

        return { row, col, kepadatan: cellKepadatan, status };
    };

    // Custom Tooltip for Growth Chart
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const sourceLabel = data.source === 'sortir' ? 'Sortir' : 
                               data.source === 'sampling' ? 'Sampling' : 
                               'Proyeksi';
            const sourceColor = data.source === 'sortir' ? 'text-blue-600' : 
                               data.source === 'sampling' ? 'text-green-600' : 
                               'text-purple-600';
            
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                    <p className="font-bold text-slate-700 mb-2">
                        {new Date(label).toLocaleDateString('id-ID', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                        })}
                    </p>
                    <p className="text-sm text-slate-600">
                        Berat (g): <span className="font-bold text-blue-600">{data.berat}</span>
                    </p>
                    <p className={`text-xs ${sourceColor} mt-1`}>
                        Sumber: {sourceLabel}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Header with Action Buttons */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/kolam" className="text-slate-500 hover:text-slate-700">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-900">{kolam.nama}</h1>
                    </div>
                    
                    {/* Action Buttons - Horizontal */}
                    <div className="flex flex-wrap items-center gap-2">
                        {sortingAlerts.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-xs">
                                <span className="font-semibold text-blue-800">Perlu Sortir!</span>
                                <span className="text-blue-600 ml-1">
                                    P{sortingAlerts[0].periode} • {sortingAlerts[0].reason === 'week' ? `Minggu ${sortingAlerts[0].value}` : `${sortingAlerts[0].value}g`}
                                </span>
                            </div>
                        )}
                        <button
                            onClick={() => {
                                setFeedForm(prev => ({ ...prev, kolamId: kolam.id, tanggal: new Date().toLocaleDateString('en-CA') }));
                                setIsFeedModalOpen(true);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Package className="w-4 h-4" />
                            <span className="hidden sm:inline">Pakan</span>
                        </button>
                        <button
                            onClick={() => setIsPanenModalOpen(true)}
                            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            <span className="hidden sm:inline">Panen</span>
                        </button>
                        <button
                            onClick={() => setIsSortirModalOpen(true)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <ArrowUpDown className="w-4 h-4" />
                            <span className="hidden sm:inline">Catat Sortir</span>
                        </button>
                        <button
                            onClick={() => setIsEditFishOpen(true)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Edit className="w-4 h-4" />
                            <span className="hidden sm:inline">Update Ikan</span>
                        </button>
                        <button
                            onClick={() => setIsSamplingOpen(true)}
                            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                        >
                            <Fish className="w-4 h-4" />
                            <span className="hidden sm:inline">Input Sampling</span>
                        </button>
                    </div>
                </div>

                {/* Recent Sortir Alert */}
                {recentSortir && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-4 rounded-lg shadow-sm animate-in fade-in duration-300">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                                    <ArrowUpDown className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-bold text-amber-900">
                                        Sortir Baru-baru Ini
                                    </h3>
                                    <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs font-semibold rounded-full">
                                        Periode {recentSortir.periode}
                                    </span>
                                </div>
                                <p className="text-sm text-amber-800">
                                    Sortir dilakukan pada{' '}
                                    <strong>
                                        {new Date(recentSortir.tanggal).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </strong>
                                    {' '}dengan mortalitas{' '}
                                    <strong className="text-amber-900">
                                        {recentSortir.mortalitas.toLocaleString()} ekor
                                        {' '}({((recentSortir.mortalitas / recentSortir.jumlahIkanSebelum) * 100).toFixed(1)}%)
                                    </strong>.
                                    {' '}Kematian sudah tercatat otomatis dalam riwayat ikan.
                                </p>
                                {recentSortir.catatan && (
                                    <p className="text-xs text-amber-700 mt-2 italic">
                                        Catatan: {recentSortir.catatan}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-lg text-white ${displayStatus === 'aman' ? 'bg-emerald-500' : displayStatus === 'waspada' ? 'bg-amber-500' : 'bg-red-500'}`}>
                        <p className="text-sm font-medium">Status</p>
                        <p className="text-2xl font-bold">{statusLabels[displayStatus]}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <p className="text-sm font-medium text-slate-600">Jumlah Ikan</p>
                        <p className="text-2xl font-bold text-slate-900">{kolam.jumlahIkan.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <p className="text-sm font-medium text-slate-600">Terpakai (Siklus)</p>
                        <p className="text-2xl font-bold text-slate-900">{totalPakanSiklus.toLocaleString('id-ID')} <span className="text-sm text-slate-500 font-normal">kg</span></p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <p className="text-sm font-medium text-slate-600">Bobot Rata-rata</p>
                        <p className="text-2xl font-bold text-slate-900">{(averageWeight * 1000).toFixed(0)}g</p>
                    </div>
                </div>

                {/* 2-Column Layout: Chart (Left) + Pond Info (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pertumbuhan Ikan Chart - Half Width */}
                    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Pertumbuhan Ikan</h2>
                                <p className="text-sm text-slate-500 mt-1">Tren berat rata-rata per ekor (gram)</p>
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                {[
                                    { label: '7H', value: '7' },
                                    { label: '30H', value: '30' },
                                    { label: '90H', value: '90' },
                                    { label: 'Semua', value: 'all' },
                                ].map((range) => (
                                    <button
                                        key={range.value}
                                        onClick={() => setChartRange(range.value as any)}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${chartRange === range.value
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-[400px] w-full">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="fullDate"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                            tickFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line
                                            type="monotone"
                                            dataKey="berat"
                                            name="Berat (g)"
                                            stroke="#2563eb"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 border-2 border-dashed border-slate-100 rounded-xl">
                                    <Calendar className="w-10 h-10 opacity-20" />
                                    <p className="text-sm font-medium">Belum ada data sampling</p>
                                    <p className="text-xs text-slate-400">Mulai input sampling untuk melihat tren</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Informasi Kolam - Half Width */}
                    <div className="bg-white p-6 rounded-lg border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Informasi Kolam</h2>
                        <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-slate-600">Panjang</p>
                            <p className="text-lg font-semibold">{kolam.panjang} m</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Lebar</p>
                            <p className="text-lg font-semibold">{kolam.lebar} m</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Kedalaman</p>
                            <p className="text-lg font-semibold">{kolam.kedalaman} m</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Volume</p>
                            <p className="text-lg font-semibold">{volume.toFixed(2)} m³</p>
                        </div>
                    </div>
                </div>
                </div>

                {/* Riwayat Sortir Section */}
                {sortirHistory.length > 0 && (
                    <div className="bg-white p-6 rounded-lg border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <ArrowUpDown className="w-5 h-5 text-blue-600" />
                            Riwayat Sortir
                        </h2>
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-800">
                                <strong>ℹ️ Info:</strong> Setiap sortir otomatis mencatat mortalitas ke riwayat ikan. 
                                Tidak perlu input manual lagi.
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Tanggal</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Periode</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Sebelum</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Sesudah</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Mortalitas</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Bobot</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {sortirHistory.map((sortir: any) => {
                                        const mortalitasPercent = sortir.jumlahIkanSebelum > 0
                                            ? ((sortir.mortalitas / sortir.jumlahIkanSebelum) * 100).toFixed(1)
                                            : '0';
                                        
                                        return (
                                            <tr key={sortir.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 text-sm text-slate-900">
                                                    {new Date(sortir.tanggal).toLocaleDateString('id-ID', { 
                                                        day: '2-digit', 
                                                        month: 'short', 
                                                        year: 'numeric' 
                                                    })}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        Periode {sortir.periode}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-slate-900 font-medium">
                                                    {sortir.jumlahIkanSebelum.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-slate-900 font-medium">
                                                    {sortir.jumlahIkanSesudah.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-amber-900">{sortir.mortalitas.toLocaleString()}</span>
                                                            {sortir.mortalitas > 0 && (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                                                                    Auto
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-amber-600">({mortalitasPercent}%)</div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-slate-700">
                                                    {sortir.bobotRataRata ? `${sortir.bobotRataRata.toFixed(1)}g` : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {sortirHistory.some((s: any) => s.catatan) && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Catatan:</p>
                                {sortirHistory.filter((s: any) => s.catatan).map((sortir: any) => (
                                    <div key={sortir.id} className="text-sm text-slate-600 mb-1">
                                        <span className="font-medium">P{sortir.periode}:</span> {sortir.catatan}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Riwayat Pakan Section */}
                <div className="bg-white p-6 rounded-lg border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-amber-600" />
                        Riwayat Pemberian Pakan
                    </h2>
                    {!kolam.tanggalTebar ? (
                        <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
                            <p>Siklus belum dimulai.</p>
                        </div>
                    ) : pakanHistory.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
                            <p>Belum ada pemberian pakan pada siklus ini.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Waktu</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Jenis Pakan</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Jumlah (kg)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {pakanHistory.map((pakan: any) => (
                                        <tr key={pakan.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm text-slate-900">
                                                {new Date(pakan.tanggal).toLocaleString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-900">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                    {pakan.jenisPakan}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right text-slate-900 font-medium">
                                                {pakan.jumlahKg.toLocaleString('id-ID')} kg
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Riwayat Ikan Section */}
                {riwayatIkanHistory.length > 0 && (
                    <div className="bg-white p-6 rounded-lg border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Fish className="w-5 h-5 text-emerald-600" />
                            Riwayat Perubahan Ikan
                        </h2>
                        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <p className="text-xs text-emerald-800">
                                <strong>ℹ️ Info:</strong> Semua perubahan jumlah ikan tercatat di sini (kematian, transfer, penambahan bibit, dll).
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Tanggal</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Keterangan</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Perubahan</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Jumlah Akhir</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {riwayatIkanHistory.map((riwayat: any) => {
                                        const isNegative = riwayat.jumlahPerubahan < 0;
                                        const isPositive = riwayat.jumlahPerubahan > 0;
                                        const perubahanColor = isNegative ? 'text-red-600' : isPositive ? 'text-emerald-600' : 'text-slate-600';
                                        const perubahanBg = isNegative ? 'bg-red-50' : isPositive ? 'bg-emerald-50' : 'bg-slate-50';
                                        
                                        // Determine badge color based on keterangan
                                        let badgeColor = 'bg-slate-100 text-slate-700';
                                        if (riwayat.keterangan.includes('Kematian') || riwayat.keterangan.includes('Mati')) {
                                            badgeColor = 'bg-red-100 text-red-700';
                                        } else if (riwayat.keterangan.includes('Pindah') || riwayat.keterangan.includes('Transfer')) {
                                            badgeColor = 'bg-blue-100 text-blue-700';
                                        } else if (riwayat.keterangan.includes('Bibit') || riwayat.keterangan.includes('Tambah')) {
                                            badgeColor = 'bg-emerald-100 text-emerald-700';
                                        } else if (riwayat.keterangan.includes('Sortir')) {
                                            badgeColor = 'bg-amber-100 text-amber-700';
                                        }
                                        
                                        return (
                                            <tr key={riwayat.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 text-sm text-slate-900">
                                                    {new Date(riwayat.tanggal).toLocaleDateString('id-ID', { 
                                                        day: '2-digit', 
                                                        month: 'short', 
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>
                                                        {riwayat.keterangan}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded ${perubahanBg} ${perubahanColor} font-semibold`}>
                                                        {riwayat.jumlahPerubahan > 0 ? '+' : ''}{riwayat.jumlahPerubahan.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-slate-900 font-medium">
                                                    {riwayat.jumlahAkhir.toLocaleString()} ekor
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Modals */}
                <Modal
                    isOpen={isEditFishOpen}
                    onClose={() => setIsEditFishOpen(false)}
                    title="Update Jumlah Ikan"
                    footer={
                        <>
                            <button type="button" onClick={() => setIsEditFishOpen(false)} className="btn btn-secondary" disabled={isSubmitting}>Batal</button>
                            <button type="submit" form="update-fish-form" className="btn btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 me-1.5 -ms-0.5 animate-spin" /> : null}
                                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </>
                    }
                >
                    <form id="update-fish-form" onSubmit={handleUpdateFish} className="space-y-4">
                        <div className="p-3 bg-blue-50 rounded-xl mb-4">
                            <p className="text-xs text-blue-600 mb-1">Status Kolam Sekarang</p>
                            <p className="text-lg font-bold text-blue-900">
                                {kolam.jumlahIkan.toLocaleString('id-ID')} <span className="text-sm font-normal">ekor</span>
                            </p>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Alasan Perubahan</label>
                            <select
                                value={editReason}
                                onChange={(e) => setEditReason(e.target.value)}
                                className="input"
                            >
                                <option value="Kematian Tambahan" disabled={!!recentSortir}>
                                    Kematian Tambahan {recentSortir ? '(Tidak tersedia)' : ''}
                                </option>
                                <option>Bibit Baru</option>
                                <option>Pindah Kolam</option>
                            </select>
                            {recentSortir ? (
                                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-xs text-amber-800">
                                        <strong>⚠️ Sortir Baru-baru Ini</strong>
                                        <br />
                                        Sortir Periode {recentSortir.periode} dilakukan {' '}
                                        {new Date(recentSortir.tanggal).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'long',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                        {' '}dengan mortalitas <strong>{recentSortir.mortalitas.toLocaleString()} ekor</strong>.
                                        <br />
                                        Kematian sudah tercatat otomatis. Jika ada kematian tambahan setelah sortir, 
                                        gunakan opsi ini setelah 24 jam.
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 mt-1">
                                    <strong>Kematian Tambahan:</strong> Untuk kematian di luar proses sortir
                                </p>
                            )}
                        </div>

                        {/* Pindah Kolam Section */}
                        {editReason === 'Pindah Kolam' && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <div className="form-group">
                                    <label className="form-label">Pindah Ke Kolam</label>
                                    <select
                                        value={targetKolamId}
                                        onChange={(e) => setTargetKolamId(e.target.value)}
                                        className="input"
                                        required
                                    >
                                        <option value="">-- Pilih Kolam Tujuan --</option>
                                        {allKolam.map(k => (
                                            k.id !== kolam.id && (
                                                <option key={k.id} value={k.id}>
                                                    {k.nama} ({k.jumlahIkan.toLocaleString()} ekor)
                                                </option>
                                            )
                                        ))}
                                    </select>
                                    {allKolam.filter(k => k.id !== kolam.id).length === 0 && (
                                        <p className="text-xs text-red-500 mt-1">Tidak ada kolam lain yang tersedia</p>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Jumlah Ikan yang Dipindah</label>
                                    <input
                                        type="text"
                                        value={pindahJumlah}
                                        onChange={(e) => setPindahJumlah(formatCurrencyInput(e.target.value))}
                                        className="input"
                                        placeholder="Contoh: 500"
                                        required
                                    />
                                    <p className="form-hint">Maksimal: {kolam.jumlahIkan.toLocaleString()} ekor</p>
                                </div>
                            </div>
                        )}

                        {editReason === 'Bibit Baru' ? (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <div className="form-group">
                                    <label className="form-label">Tambah Jumlah Ikan (ekor)</label>
                                    <input
                                        type="text"
                                        value={addFishCount}
                                        onChange={(e) => setAddFishCount(formatCurrencyInput(e.target.value))}
                                        className="input"
                                        placeholder="Contoh: 1,000"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Harga per Ekor</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">Rp</span>
                                            <input
                                                type="text"
                                                style={{ paddingLeft: '40px' }}
                                                value={hargaBibit}
                                                onChange={(e) => setHargaBibit(formatCurrencyInput(e.target.value))}
                                                className="input"
                                                placeholder="0"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Bobot (g/ekor)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={beratBibit}
                                            onChange={(e) => setBeratBibit(e.target.value)}
                                            className="input"
                                            placeholder="5"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-orange-700 font-medium">Dana Saat Ini</span>
                                        <span className="font-bold text-slate-700">Rp {getAvailableFunds().toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-orange-700 font-medium">Total Biaya</span>
                                        <span className="font-bold text-red-600">
                                            - Rp {(parseInt(parseCurrencyInput(addFishCount) || '0') * parseInt(parseCurrencyInput(hargaBibit) || '0')).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="pt-2 border-t border-orange-200 flex justify-between font-bold text-sm">
                                        <span className="text-orange-800 uppercase tracking-wider text-[10px]">Sisa Dana</span>
                                        <span className={getAvailableFunds() - (parseInt(parseCurrencyInput(addFishCount) || '0') * parseInt(parseCurrencyInput(hargaBibit) || '0')) < 0 ? 'text-red-600' : 'text-emerald-600'}>
                                            Rp {(getAvailableFunds() - (parseInt(parseCurrencyInput(addFishCount) || '0') * parseInt(parseCurrencyInput(hargaBibit) || '0'))).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : editReason !== 'Pindah Kolam' ? (
                            <div className="form-group animate-in fade-in duration-300">
                                <label className="form-label">
                                    {editReason === 'Kematian Tambahan' ? 'Jumlah Ikan yang Mati' : 'Jumlah Ikan Terbaru'}
                                </label>
                                <input
                                    type="text"
                                    value={editFishCount}
                                    onChange={(e) => setEditFishCount(formatCurrencyInput(e.target.value))}
                                    className="input"
                                    placeholder={editReason === 'Kematian Tambahan' ? 'Contoh: 100' : kolam.jumlahIkan.toLocaleString('id-ID')}
                                    required
                                />
                                <p className="form-hint">
                                    {editReason === 'Kematian Tambahan' 
                                        ? `Maksimal: ${kolam.jumlahIkan.toLocaleString('id-ID')} ekor` 
                                        : 'Masukkan angka populasi terakhir yang valid'
                                    }
                                </p>
                            </div>
                        ) : null}
                    </form>
                </Modal>

                <Modal isOpen={isSamplingOpen} onClose={() => setIsSamplingOpen(false)} title="Input Sampling">
                    <form onSubmit={handleInputSampling} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Unit Input</label>
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="berat"
                                        checked={samplingInputUnit === 'berat'}
                                        onChange={(e) => setSamplingInputUnit(e.target.value as 'berat' | 'size')}
                                    />
                                    <span className="ml-2">Gram per Ekor</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="size"
                                        checked={samplingInputUnit === 'size'}
                                        onChange={(e) => setSamplingInputUnit(e.target.value as 'berat' | 'size')}
                                    />
                                    <span className="ml-2">Ekor per Kg</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Nilai</label>
                            <input
                                type="number"
                                step="0.1"
                                value={samplingValue}
                                onChange={(e) => setSamplingValue(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Catatan</label>
                            <textarea
                                value={samplingCatatan}
                                onChange={(e) => setSamplingCatatan(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                                rows={3}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Sampling'}
                        </button>
                    </form>
                </Modal>

                <SortirModal
                    isOpen={isSortirModalOpen}
                    onClose={() => setIsSortirModalOpen(false)}
                    defaultKolamId={kolam.id}
                    defaultPeriode={sortingAlerts.length > 0 ? sortingAlerts[0].periode : undefined}
                />

                <PanenModal
                    isOpen={isPanenModalOpen}
                    onClose={() => setIsPanenModalOpen(false)}
                    defaultKolamId={kolam.id}
                />

                <Modal isOpen={isFeedModalOpen} onClose={() => setIsFeedModalOpen(false)} title="Pakan Harian">
                    <form onSubmit={handleFeedSubmit} className="space-y-4">
                        <div>
                            <label className="form-label">Tanggal</label>
                            <input
                                type="date"
                                className="input"
                                value={feedForm.tanggal}
                                onChange={e => setFeedForm({ ...feedForm, tanggal: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="form-label">Jenis Pakan</label>
                            <select
                                className="input"
                                value={feedForm.jenisPakan}
                                onChange={e => setFeedForm({ ...feedForm, jenisPakan: e.target.value })}
                                required
                            >
                                <option value="">-- Pilih Pakan --</option>
                                {getAllJenisPakan().map((jp: string) => (
                                    <option key={jp} value={jp}>{jp}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Jumlah (kg)</label>
                            <input
                                type="number"
                                step="any"
                                className="input"
                                value={feedForm.jumlahKg}
                                onChange={e => setFeedForm({ ...feedForm, jumlahKg: e.target.value })}
                                placeholder="0.0"
                                required
                            />
                        </div>
                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn btn-primary"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Menyimpan...
                                    </>
                                ) : 'Simpan Pakan'}
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
