'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import Modal from '../../components/ui/Modal';
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
    X
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
}

interface KolamDetailClientProps {
    initialData: InitialData;
}

export default function KolamDetailClient({ initialData }: KolamDetailClientProps) {
    const {
        calculateBiomass,
        calculateKepadatan,
        getUnifiedStatus,
        addRiwayatSampling,
        addRiwayatIkan,
        addStokIkan,
        getSamplingByKolam,
        getCycleHistory,
        getAvailableFunds,
    } = useApp();

    const [gridScale, setGridScale] = useState<number>(1);
    const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);
    const [pinnedCells, setPinnedCells] = useState<GridCell[]>([]);
    const [showTooltip, setShowTooltip] = useState<{ x: number; y: number } | null>(null);

    // Edit Fish Count State
    const [isEditFishOpen, setIsEditFishOpen] = useState(false);
    const [editFishCount, setEditFishCount] = useState('');
    const [addFishCount, setAddFishCount] = useState('');
    const [hargaBibit, setHargaBibit] = useState('');
    const [beratBibit, setBeratBibit] = useState('');
    const [editReason, setEditReason] = useState('Koreksi / Hitung Ulang');

    // Sampling State
    const [isSamplingOpen, setIsSamplingOpen] = useState(false);
    const [samplingInputUnit, setSamplingInputUnit] = useState<'berat' | 'size'>('berat');
    const [samplingValue, setSamplingValue] = useState('');
    const [samplingCatatan, setSamplingCatatan] = useState('');

    // History View State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [chartRange, setChartRange] = useState<'7' | '30' | '90' | 'all'>('30');

    // Use initialData as the kolam reference (already loaded from server)
    const kolam = initialData;
    const cycleHistory = getCycleHistory(kolam.id);

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
            } else {
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
            setIsEditFishOpen(false);
            // Reset fields
            setAddFishCount('');
            setHargaBibit('');
            setBeratBibit('');
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
    const syncRef = useRef(false);

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

    // Filter, Sort, and Deduplicate Chart Data (Pick latest per day)
    const processedData = samplingHistory
        .filter(s => {
            if (chartRange === 'all') return true;
            const daysArr = { '7': 7, '30': 30, '90': 90 };
            const limitDate = new Date();
            limitDate.setDate(limitDate.getDate() - (daysArr[chartRange as keyof typeof daysArr] || 0));
            return new Date(s.tanggal) >= limitDate;
        })
        .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

    // Deduplicate: If multiple samplings in one day, take the latest one
    const deduplicatedMap = new Map();
    processedData.forEach(s => {
        const dateKey = new Date(s.tanggal).toLocaleDateString('en-CA'); // YYYY-MM-DD
        deduplicatedMap.set(dateKey, s); // Overwrites previous, keeping latest because it's sorted
    });

    const chartData = Array.from(deduplicatedMap.values()).map((s: any) => {
        const berat = s.bobotGram || (s.jumlahIkanPerKg > 0 ? 1000 / s.jumlahIkanPerKg : 0);
        return {
            id: s.id,
            fullDate: s.tanggal,
            tanggal: new Date(s.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
            berat: Math.round(Number(berat)),
            size: s.jumlahIkanPerKg
        };
    });

    const kepadatan = calculateKepadatan(kolam as any);
    const volume = kolam.panjang * kolam.lebar * kolam.kedalaman;
    const luas = kolam.panjang * kolam.lebar;
    const unifiedStatus = getUnifiedStatus(kolam.id);
    const { totalBiomass, density: biomassDensity, averageWeight } = calculateBiomass(kolam.id);
    const displayStatus = unifiedStatus.status;

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

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/kolam" className="text-slate-500 hover:text-slate-700">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-900">{kolam.nama}</h1>
                    </div>
                </div>

                {/* Status Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-lg text-white ${displayStatus === 'aman' ? 'bg-emerald-500' : displayStatus === 'waspada' ? 'bg-amber-500' : 'bg-red-500'}`}>
                        <p className="text-sm font-medium">Status</p>
                        <p className="text-2xl font-bold">{statusLabels[displayStatus]}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <p className="text-sm font-medium text-slate-600">Jumlah Ikan</p>
                        <p className="text-2xl font-bold text-slate-900">{kolam.jumlahIkan.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <p className="text-sm font-medium text-slate-600">Bobot Rata-rata</p>
                        <p className="text-2xl font-bold text-slate-900">{(averageWeight * 1000).toFixed(0)}g</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Kolam Info */}
                    <div className="lg:col-span-2 space-y-4">
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

                        {/* Pertumbuhan Ikan Chart */}
                        <div className="bg-white p-6 rounded-lg border border-slate-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Pertumbuhan Ikan</h2>
                                    <p className="text-sm text-slate-500">Tren berat rata-rata per ekor (gram)</p>
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

                            <div className="h-[300px] w-full">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
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
                                            <Tooltip
                                                labelFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                    fontSize: '12px'
                                                }}
                                                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                                            />
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
                                        <Calendar className="w-8 h-8 opacity-20" />
                                        <p className="text-sm">Belum ada data sampling dalam rentang ini</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                        <button
                            onClick={() => setIsEditFishOpen(true)}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Edit className="w-4 h-4 inline mr-2" />
                            Update Jumlah Ikan
                        </button>
                        <button
                            onClick={() => setIsSamplingOpen(true)}
                            className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                            <Fish className="w-4 h-4 inline mr-2" />
                            Input Sampling
                        </button>
                    </div>
                </div>

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
                                <option>Koreksi / Hitung Ulang</option>
                                <option>Kematian</option>
                                <option>Bibit Baru</option>
                                <option>Pindah Kolam</option>
                            </select>
                        </div>

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
                        ) : (
                            <div className="form-group animate-in fade-in duration-300">
                                <label className="form-label">Jumlah Ikan Terbaru</label>
                                <input
                                    type="text"
                                    value={editFishCount}
                                    onChange={(e) => setEditFishCount(formatCurrencyInput(e.target.value))}
                                    className="input"
                                    placeholder={kolam.jumlahIkan.toLocaleString('id-ID')}
                                    required
                                />
                                <p className="form-hint">Masukkan angka populasi terakhir yang valid</p>
                            </div>
                        )}
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
            </div>
        </DashboardLayout>
    );
}
