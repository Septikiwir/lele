'use client';

import { use, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { notFound } from 'next/navigation';
import Modal from '../../components/ui/Modal';
import { EditIcon } from '../../components/ui/Icons';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils';

const ArrowLeftIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const PinIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
);

const CloseIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const HistoryIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

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

export default function KolamDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const {
        getKolamById,
        calculateKepadatan,
        getPakanByKolam,
        getKondisiAirByKolam,
        addRiwayatIkan,
        getRiwayatIkanByKolam,
        getUnifiedStatus,
        calculateBiomass,
        addRiwayatSampling,
        isLoading,
        getCycleSummary,
        getCycleHistory
    } = useApp();
    const kolam = getKolamById(resolvedParams.id);

    const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);
    const [pinnedCells, setPinnedCells] = useState<GridCell[]>([]);
    const [gridScale, setGridScale] = useState<number>(1);
    const [showTooltip, setShowTooltip] = useState<{ x: number; y: number } | null>(null);

    // Edit Fish Count State
    const [isEditFishOpen, setIsEditFishOpen] = useState(false);
    const [editFishCount, setEditFishCount] = useState('');
    const [editReason, setEditReason] = useState('Koreksi / Hitung Ulang');

    // Sampling State
    const [isSamplingOpen, setIsSamplingOpen] = useState(false);
    const [samplingInputUnit, setSamplingInputUnit] = useState<'berat' | 'size'>('berat');
    const [samplingValue, setSamplingValue] = useState('');
    const [samplingCatatan, setSamplingCatatan] = useState('');

    // History View State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const cycleHistory = kolam ? getCycleHistory(kolam.id) : [];

    const handleUpdateFish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!kolam) return;

        try {
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
                setIsEditFishOpen(false);
            }
        } catch (error) {
            console.error("Failed to update fish count:", error);
            alert("Gagal mengupdate jumlah ikan. Silakan coba lagi atau restart server jika baru saja ada update.");
        }
    };

    const handleInputSampling = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!kolam) return;

        try {
            const val = parseFloat(samplingValue);
            if (!isNaN(val) && val > 0) {
                let sizePerKg = 0;

                if (samplingInputUnit === 'berat') {
                    // Input is grams/fish
                    // 1000 / grams = fish/kg
                    sizePerKg = Math.round(1000 / val);
                } else {
                    // Input is fish/kg (size)
                    sizePerKg = Math.round(val);
                }

                if (sizePerKg > 0) {
                    await addRiwayatSampling({
                        kolamId: kolam.id,
                        tanggal: new Date().toISOString(),
                        jumlahIkanPerKg: sizePerKg,
                        catatan: samplingCatatan
                    });
                    setIsSamplingOpen(false);
                    setSamplingValue('');
                    setSamplingCatatan('');
                } else {
                    alert("Nilai tidak valid (hasil konversi 0 ekor/kg)");
                }
            }
        } catch (error) {
            console.error("Failed to add sampling:", error);
            alert("Gagal menyimpan sampling.");
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!kolam) {
        notFound();
    }

    const kepadatan = calculateKepadatan(kolam);
    const volume = kolam.panjang * kolam.lebar * kolam.kedalaman;
    const luas = kolam.panjang * kolam.lebar;
    const pakan = getPakanByKolam(kolam.id);
    const kondisiAir = getKondisiAirByKolam(kolam.id);
    const riwayatIkan = getRiwayatIkanByKolam(kolam.id);

    // Biomass calculations
    // Unified status calculation
    const unifiedStatus = getUnifiedStatus(kolam.id);
    const { totalBiomass, density: biomassDensity, averageWeight } = calculateBiomass(kolam.id);

    // Use unified status instead of kolam.status for UI logic
    const displayStatus = unifiedStatus.status;

    // Generate grid cells
    const cols = Math.ceil(kolam.panjang / gridScale);
    const rows = Math.ceil(kolam.lebar / gridScale);

    const generateCellData = (row: number, col: number): GridCell => {
        // Simulate varying kepadatan across the pond with some randomness
        // Use the unified source (weight or count) to determine base density for visualization
        const baseKepadatan = unifiedStatus.source === 'berat' ? unifiedStatus.kepadatanBerat : unifiedStatus.kepadatanEkor;

        const variation = (Math.sin(row * 0.5) + Math.cos(col * 0.7)) * (baseKepadatan * 0.2); // 20% variation
        const cellKepadatan = Math.max(0, baseKepadatan + variation);

        let status: 'aman' | 'waspada' | 'berisiko' = 'aman';

        // Thresholds based on source
        if (unifiedStatus.source === 'berat') {
            if (cellKepadatan > 20) status = 'berisiko';
            else if (cellKepadatan > 10) status = 'waspada';
        } else {
            if (cellKepadatan > 100) status = 'berisiko';
            else if (cellKepadatan > 50) status = 'waspada';
        }

        return { row, col, kepadatan: cellKepadatan, status };
    };

    const handleCellClick = (cell: GridCell, e: React.MouseEvent) => {
        if (pinnedCells.length >= 3) return;
        if (pinnedCells.some(p => p.row === cell.row && p.col === cell.col)) return;
        setPinnedCells([...pinnedCells, cell]);
    };

    const removePinnedCell = (cell: GridCell) => {
        setPinnedCells(pinnedCells.filter(p => !(p.row === cell.row && p.col === cell.col)));
    };

    const handleCellHover = (cell: GridCell, e: React.MouseEvent) => {
        setHoveredCell(cell);
        const rect = e.currentTarget.getBoundingClientRect();
        setShowTooltip({ x: rect.left + rect.width / 2, y: rect.top });
    };

    // Cycle Review Logic
    // Fix: Show "Cycle Review" only if fish <= 0 AND we have a valid past cycle.
    // If we just stared a new cycle (fish > 0), show active stats.

    // Determine Current Cycle Start Date to filter data
    // If active, get current cycle info. If inactive, show last cycle info? 
    // Actually, user wants "When cycle 1 finished, don't show old data in new cycle".

    // We can use getCycleSummary to get the *active* or *latest* cycle boundaries.
    const activeCycle = kolam ? getCycleSummary(kolam.id) : null;
    const currentCycleStartDate = activeCycle ? activeCycle.startDate : '1970-01-01';

    // Filter Data for View
    const filteredPakan = pakan.filter(p => p.tanggal >= currentCycleStartDate);
    const filteredKondisiAir = kondisiAir.filter(k => k.tanggal >= currentCycleStartDate);

    // Strict Filter for Riwayat Ikan
    // 1. Must be >= Start Date
    // 2. If it is a "Tebar" event (new cycle start), it MUST match our detected cycle start ID.
    //    This prevents showing "Tebar Bibit 11" (Cycle A) when we are in Cycle B (Tebar Bibit 20), even if same day.
    const filteredRiwayatIkan = riwayatIkan.filter(r => {
        if (r.tanggal < currentCycleStartDate) return false;

        // Check if this event looks like a "Cycle Start"
        const isStartEvent = r.keterangan.toLowerCase().includes('tebar') || (r.jumlahPerubahan > 0 && r.jumlahAkhir === r.jumlahPerubahan);

        if (isStartEvent && activeCycle?.startId) {
            // Only allow if it matches the active cycle's start ID
            return r.id === activeCycle.startId;
        }

        return true;
    });

    const cycleSummary = kolam.jumlahIkan === 0 ? getCycleSummary(kolam.id) : null;

    if (cycleSummary) {
        return (
            <DashboardLayout>
                <div className="mb-8">
                    <Link href="/kolam" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
                        <ArrowLeftIcon />
                        Kembali ke Daftar Kolam
                    </Link>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">{kolam.nama} <span className="text-slate-400 font-light">(Selesai)</span></h1>
                            <p className="text-slate-500 mt-1">
                                Siklus: {new Date(cycleSummary.startDate).toLocaleDateString('id-ID')} - {new Date(cycleSummary.endDate).toLocaleDateString('id-ID')} ({cycleSummary.totalDays} hari)
                            </p>
                        </div>
                        <span className="badge badge-neutral">Siklus Selesai</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Profit Card */}
                    <div className={`p-6 rounded-xl border ${cycleSummary.netProfit >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'} lg:col-span-2 relative overflow-hidden`}>
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Net Profit</p>
                            <h3 className={`text-3xl font-bold ${cycleSummary.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                Rp {cycleSummary.netProfit.toLocaleString('id-ID')}
                            </h3>
                            <div className="mt-4 flex gap-4 text-sm">
                                <div>
                                    <span className="text-slate-500 block">Total Omset</span>
                                    <span className="font-semibold text-slate-700">Rp {cycleSummary.totalHarvestRevenue.toLocaleString('id-ID')}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Total Cost</span>
                                    <span className="font-semibold text-slate-700">Rp {(cycleSummary.totalFeedCost + cycleSummary.totalExpenses).toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FCR Card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-medium text-slate-500">FCR</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${cycleSummary.fcr <= 1.2 ? 'bg-green-100 text-green-700' : cycleSummary.fcr <= 1.5 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                {cycleSummary.fcr <= 1.2 ? 'Excellent' : cycleSummary.fcr <= 1.5 ? 'Good' : 'High'}
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900">{cycleSummary.fcr.toFixed(2)}</h3>
                        <p className="text-xs text-slate-400 mt-2">Target: &lt; 1.2</p>
                    </div>

                    {/* SR Card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-medium text-slate-500">Survival Rate (SR)</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${cycleSummary.sr >= 90 ? 'bg-green-100 text-green-700' : cycleSummary.sr >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                {cycleSummary.sr >= 90 ? 'Excellent' : cycleSummary.sr >= 80 ? 'Good' : 'Low'}
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900">{cycleSummary.sr.toFixed(1)}%</h3>
                        <p className="text-xs text-slate-400 mt-2">{cycleSummary.initialFish.toLocaleString()} → {cycleSummary.finalFish.toLocaleString()} ekor</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Harvest Details */}
                    <div className="card p-6">
                        <h3 className="font-semibold text-slate-900 mb-4 text-lg">Detail Panen</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <span className="text-slate-500">Total Berat</span>
                                <span className="font-medium text-slate-900">{parseFloat(cycleSummary.totalHarvestKg.toFixed(1))} kg</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <span className="text-slate-500">Total Ekor</span>
                                <span className="font-medium text-slate-900">{cycleSummary.finalFish.toLocaleString()} ekor</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <span className="text-slate-500">Rata-rata Size</span>
                                <span className="font-medium text-slate-900">
                                    {cycleSummary.totalHarvestKg > 0 ? (1000 / (cycleSummary.finalFish / cycleSummary.totalHarvestKg)).toFixed(0) : 0} gram
                                    <span className="text-slate-400 text-xs ml-1">
                                        (Isi {cycleSummary.totalHarvestKg > 0 ? Math.round(cycleSummary.finalFish / cycleSummary.totalHarvestKg) : 0}/kg)
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Cost Details */}
                    <div className="card p-6">
                        <h3 className="font-semibold text-slate-900 mb-4 text-lg">Detail Biaya</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <span className="text-slate-500">Pakan ({parseFloat(cycleSummary.totalFeedKg.toFixed(1))} kg)</span>
                                <span className="font-medium text-slate-900">Rp {cycleSummary.totalFeedCost.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <span className="text-slate-500">Operasional Lain</span>
                                <span className="font-medium text-slate-900">Rp {cycleSummary.totalExpenses.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="font-bold text-slate-700">Total</span>
                                <span className="font-bold text-slate-900">Rp {(cycleSummary.totalFeedCost + cycleSummary.totalExpenses).toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Fish Population Flow */}
                    <div className="card p-6 lg:col-span-2">
                        <h3 className="font-semibold text-slate-900 mb-4 text-lg">Alur Populasi</h3>
                        <div className="flex flex-wrap gap-4 justify-center items-center text-center">
                            <div className="bg-slate-50 p-4 rounded-lg min-w-[120px]">
                                <p className="text-xs text-slate-500 uppercase">Tebar Awal</p>
                                <p className="text-xl font-bold text-slate-800">{cycleSummary.initialFish.toLocaleString()}</p>
                            </div>
                            <div className="text-slate-400">→</div>
                            <div className={`p-4 rounded-lg min-w-[120px] ${cycleSummary.adjustmentNet < 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                                <p className="text-xs text-slate-500 uppercase">Koreksi/Mati</p>
                                <p className={`text-xl font-bold ${cycleSummary.adjustmentNet < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                                    {cycleSummary.adjustmentNet > 0 ? '+' : ''}{cycleSummary.adjustmentNet.toLocaleString()}
                                </p>
                            </div>
                            <div className="text-slate-400">→</div>
                            <div className="bg-green-50 p-4 rounded-lg min-w-[120px]">
                                <p className="text-xs text-green-600 uppercase">Panen Total</p>
                                <p className="text-xl font-bold text-green-700">{cycleSummary.finalFish.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={() => {
                            setEditFishCount('0');
                            setIsEditFishOpen(true);
                            setEditReason('Tebar Bibit Baru');
                            // Prompt for new cycle start
                        }}
                        className="btn btn-primary px-8"
                    >
                        Mulai Siklus Baru
                    </button>
                </div>

                {/* Reuse existing modals for starting new cycle/corrections */}
                <Modal
                    isOpen={isEditFishOpen}
                    onClose={() => setIsEditFishOpen(false)}
                    title="Mulai Siklus Baru?"
                >
                    <div className="p-4">
                        <p className="mb-4">Untuk memulai siklus baru, silakan gunakan fitur <strong>Tebar Bibit</strong> di halaman Dashboard atau Kolam Utama.</p>
                        <Link href="/kolam" className="btn btn-primary w-full block text-center">
                            Ke Menu Tebar Bibit
                        </Link>
                    </div>
                </Modal>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-8">
                <Link href="/kolam" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
                    <ArrowLeftIcon />
                    Kembali ke Daftar Kolam
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">{kolam.nama}</h1>
                        <p className="text-slate-500 mt-1">Tebar: {kolam.tanggalTebar ? new Date(kolam.tanggalTebar).toLocaleDateString('id-ID') : '-'} • {kolam.panjang}m × {kolam.lebar}m × {kolam.kedalaman}m</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={() => setIsHistoryOpen(true)}
                            className="btn btn-outline flex items-center gap-2"
                        >
                            <HistoryIcon />
                            Riwayat Siklus
                        </button>
                        <span className={`badge ${displayStatus === 'aman' ? 'badge-success' : displayStatus === 'waspada' ? 'badge-warning' : 'badge-danger'}`}>
                            {statusLabels[displayStatus]}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="stat-card">
                    <p className="stat-label">Luas</p>
                    <p className="stat-value">{luas}<span className="text-lg text-slate-400"> m²</span></p>
                </div>
                <div className="stat-card">
                    <p className="stat-label">Volume</p>
                    <p className="stat-value">{parseFloat(volume.toFixed(1))}<span className="text-lg text-slate-400"> m³</span></p>
                </div>
                <div className="stat-card relative group">
                    <button
                        onClick={() => {
                            setEditFishCount(kolam.jumlahIkan.toString());
                            setIsEditFishOpen(true);
                        }}
                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Edit Jumlah Ikan"
                    >
                        <EditIcon />
                    </button>
                    <p className="stat-label">Jumlah Ikan</p>
                    <p className="stat-value">{kolam.jumlahIkan.toLocaleString('id-ID')}</p>
                </div>
                <div className="stat-card">
                    <p className="stat-label">Kepadatan (Ekor)</p>
                    <p className={`stat-value ${kolam.status === 'aman' ? 'text-green-600' : kolam.status === 'waspada' ? 'text-amber-600' : 'text-red-600'}`}>
                        {parseFloat(kepadatan.toFixed(1))}<span className="text-lg text-slate-400"> /m³</span>
                    </p>
                </div>
            </div>

            {/* Biomass Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                <div className="stat-card relative group bg-indigo-50 border-indigo-100">
                    <button
                        onClick={() => {
                            if (averageWeight > 0) {
                                setSamplingInputUnit('berat'); // Default to grams view
                                setSamplingValue((averageWeight * 1000).toFixed(0));
                            } else {
                                setSamplingValue('');
                            }
                            setIsSamplingOpen(true);
                        }}
                        className="absolute top-2 right-2 p-1 text-indigo-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Input Sampling (Ukuran Ikan)"
                    >
                        <EditIcon />
                    </button>
                    <p className="stat-label text-indigo-600">Sampling Terakhir</p>
                    <p className="stat-value text-indigo-900 flex flex-col">
                        <span>
                            {averageWeight > 0 ? `${(averageWeight * 1000).toFixed(0)}` : '-'}
                            <span className="text-lg text-indigo-400"> gram/ekor</span>
                        </span>
                        {averageWeight > 0 && (
                            <span className="text-sm text-indigo-500 font-normal -mt-1">
                                (Isi {Math.round(1 / averageWeight)} /kg)
                            </span>
                        )}
                    </p>
                </div>
                <div className="stat-card bg-indigo-50 border-indigo-100">
                    <p className="stat-label text-indigo-600">Total Biomassa</p>
                    <p className="stat-value text-indigo-900">
                        {totalBiomass > 0 ? totalBiomass.toLocaleString('id-ID', { maximumFractionDigits: 1 }) : '-'}<span className="text-lg text-indigo-400"> kg</span>
                    </p>
                </div>
                <div className="stat-card bg-indigo-50 border-indigo-100">
                    <p className="stat-label text-indigo-600">Kepadatan (Berat)</p>
                    <p className={`stat-value ${unifiedStatus.source === 'berat' ? (displayStatus === 'aman' ? 'text-green-600' : displayStatus === 'waspada' ? 'text-amber-600' : 'text-red-600') : 'text-indigo-900'}`}>
                        {biomassDensity > 0 ? parseFloat(biomassDensity.toFixed(2)) : '-'}<span className="text-lg text-indigo-400"> kg/m³</span>
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pond Visualization */}
                <div className="lg:col-span-2 card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-900">Denah Tambak ({unifiedStatus.source === 'berat' ? 'Berdasarkan Biomassa' : 'Berdasarkan Populasi'})</h2>
                        <span className={`badge ${displayStatus === 'aman' ? 'badge-success' : displayStatus === 'waspada' ? 'badge-warning' : 'badge-danger'}`}>
                            {statusLabels[displayStatus]}
                        </span>
                    </div>

                    {/* Visual Pond Map */}
                    <div className="bg-gradient-to-b from-slate-100 to-slate-200 rounded-xl p-6 relative overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10" style={{
                            backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }} />

                        {/* Pond Container */}
                        <div className="relative mx-auto" style={{
                            maxWidth: '400px',
                            aspectRatio: `${kolam.panjang} / ${kolam.lebar}`
                        }}>
                            {/* Pond Shape */}
                            <div
                                className={`w-full h-full rounded-xl shadow-lg border-4 flex flex-col items-center justify-center transition-all relative overflow-hidden ${displayStatus === 'aman'
                                    ? 'bg-gradient-to-br from-cyan-400 to-teal-500 border-cyan-600'
                                    : displayStatus === 'waspada'
                                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-600'
                                        : 'bg-gradient-to-br from-red-400 to-rose-500 border-red-600'
                                    }`}
                                style={{ minHeight: '200px' }}
                            >
                                {/* Water Ripple Effect */}
                                <div className="absolute inset-0 opacity-20">
                                    <div className="absolute w-32 h-32 bg-white/30 rounded-full -top-16 -left-16 animate-pulse" />
                                    <div className="absolute w-24 h-24 bg-white/20 rounded-full bottom-10 right-10 animate-pulse" style={{ animationDelay: '0.5s' }} />
                                    <div className="absolute w-16 h-16 bg-white/25 rounded-full top-1/2 left-1/3 animate-pulse" style={{ animationDelay: '1s' }} />
                                </div>

                                {/* Pond Info */}
                                <div className="relative z-10 text-center text-white">
                                    <div className="text-4xl mb-2">🐟</div>
                                    <h3 className="text-2xl font-bold drop-shadow-md">{kolam.nama}</h3>
                                    <p className="text-white/90 text-lg font-medium mt-1">
                                        {kolam.jumlahIkan.toLocaleString('id-ID')} ekor
                                    </p>
                                    <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
                                        <span className="text-sm font-medium">
                                            Kepadatan: {unifiedStatus.source === 'berat' ? `${parseFloat(unifiedStatus.kepadatanBerat.toFixed(2))} kg/m³` : `${parseFloat(unifiedStatus.kepadatanEkor.toFixed(1))} /m³`}
                                        </span>
                                    </div>
                                </div>

                                {/* Fish Icons Animation */}
                                <div className="absolute bottom-4 left-4 text-2xl opacity-60 animate-bounce" style={{ animationDelay: '0.2s' }}>🐟</div>
                                <div className="absolute bottom-8 right-6 text-xl opacity-50 animate-bounce" style={{ animationDelay: '0.4s' }}>🐟</div>
                                <div className="absolute top-6 right-8 text-lg opacity-40 animate-bounce" style={{ animationDelay: '0.6s' }}>🐟</div>
                            </div>

                            {/* Dimension Labels */}
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-medium text-slate-600 flex items-center gap-1">
                                <span>↔ {kolam.panjang}m</span>
                            </div>
                            <div className="absolute -right-12 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-600 flex items-center gap-1" style={{ writingMode: 'vertical-rl' }}>
                                <span>↕ {kolam.lebar}m</span>
                            </div>
                        </div>

                        {/* Pond Details Below */}
                        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
                            <div className="bg-white/80 backdrop-blur rounded-lg p-3">
                                <p className="text-xs text-slate-500 uppercase font-medium">Panjang</p>
                                <p className="text-lg font-bold text-slate-900">{kolam.panjang}m</p>
                            </div>
                            <div className="bg-white/80 backdrop-blur rounded-lg p-3">
                                <p className="text-xs text-slate-500 uppercase font-medium">Lebar</p>
                                <p className="text-lg font-bold text-slate-900">{kolam.lebar}m</p>
                            </div>
                            <div className="bg-white/80 backdrop-blur rounded-lg p-3">
                                <p className="text-xs text-slate-500 uppercase font-medium">Kedalaman</p>
                                <p className="text-lg font-bold text-slate-900">{kolam.kedalaman}m</p>
                            </div>
                        </div>
                    </div>

                    {/* Status Recommendation */}
                    <div className={`mt-4 p-4 rounded-lg ${displayStatus === 'aman' ? 'bg-green-50 border border-green-200' :
                        displayStatus === 'waspada' ? 'bg-amber-50 border border-amber-200' :
                            'bg-red-50 border border-red-200'
                        }`}>
                        <p className={`text-sm ${displayStatus === 'aman' ? 'text-green-700' :
                            displayStatus === 'waspada' ? 'text-amber-700' :
                                'text-red-700'
                            }`}>
                            <strong>Rekomendasi:</strong> {rekomendasi[displayStatus]}
                        </p>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Hovered Cell Info */}
                    {hoveredCell && (
                        <div className="card p-4 border-l-4 border-teal-500">
                            <h3 className="font-semibold text-slate-900 mb-3">Detail Area</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Posisi</span>
                                    <span className="font-medium">Baris {hoveredCell.row + 1}, Kolom {hoveredCell.col + 1}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Luas Area</span>
                                    <span className="font-medium">{gridScale} m²</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Volume</span>
                                    <span className="font-medium">{parseFloat((gridScale * kolam.kedalaman).toFixed(1))} m³</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Est. Ikan</span>
                                    <span className="font-medium">{Math.round(hoveredCell.kepadatan * gridScale * kolam.kedalaman)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Kepadatan</span>
                                    <span className={`font-medium ${hoveredCell.status === 'aman' ? 'text-green-600' : hoveredCell.status === 'waspada' ? 'text-amber-600' : 'text-red-600'}`}>
                                        {parseFloat(hoveredCell.kepadatan.toFixed(1))}{unifiedStatus.source === 'berat' ? ' kg/m³' : '/m³'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Status</span>
                                    <span className={`badge ${hoveredCell.status === 'aman' ? 'badge-success' : hoveredCell.status === 'waspada' ? 'badge-warning' : 'badge-danger'}`}>
                                        {statusLabels[hoveredCell.status]}
                                    </span>
                                </div>
                                <div className="pt-2 border-t">
                                    <p className="text-slate-600">{rekomendasi[hoveredCell.status]}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pinned Cells */}
                    {pinnedCells.length > 0 && (
                        <div className="card p-4">
                            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <PinIcon /> Pinned ({pinnedCells.length}/3)
                            </h3>
                            <div className="space-y-3">
                                {pinnedCells.map((cell, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                                        <div>
                                            <p className="font-medium text-slate-900">R{cell.row + 1} C{cell.col + 1}</p>
                                            <p className={`text-sm ${cell.status === 'aman' ? 'text-green-600' : cell.status === 'waspada' ? 'text-amber-600' : 'text-red-600'}`}>
                                                {parseFloat(cell.kepadatan.toFixed(1))}{unifiedStatus.source === 'berat' ? ' kg/m³' : '/m³'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removePinnedCell(cell)}
                                            className="p-1 hover:bg-slate-200 rounded"
                                        >
                                            <CloseIcon />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Pakan */}
                    <div className="card p-4">
                        <h3 className="font-semibold text-slate-900 mb-3">Riwayat Pakan (Siklus Ini)</h3>
                        {filteredPakan.length === 0 ? (
                            <p className="text-sm text-slate-500">Belum ada data pakan di siklus ini</p>
                        ) : (
                            <div className="space-y-2">
                                {filteredPakan.slice(0, 3).map(p => (
                                    <div key={p.id} className="flex justify-between text-sm">
                                        <span className="text-slate-500">{new Date(p.tanggal).toLocaleDateString('id-ID')}</span>
                                        <span className="font-medium">{p.jumlahKg} kg</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Link href="/pakan" className="text-sm text-teal-600 hover:text-teal-700 mt-3 block">
                            Input Pakan →
                        </Link>
                    </div>

                    {/* Kondisi Air */}
                    <div className="card p-4">
                        <h3 className="font-semibold text-slate-900 mb-3">Kondisi Air Terakhir</h3>
                        {filteredKondisiAir.length === 0 ? (
                            <p className="text-sm text-slate-500">Belum ada data kondisi air siklus ini</p>
                        ) : (
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Warna</span>
                                    <span className="font-medium">{filteredKondisiAir[0].warna}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Bau</span>
                                    <span className="font-medium">{filteredKondisiAir[0].bau}</span>
                                </div>
                                {filteredKondisiAir[0].ph && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">pH</span>
                                        <span className="font-medium">{filteredKondisiAir[0].ph}</span>
                                    </div>
                                )}
                            </div>
                        )}
                        <Link href="/kualitas-air" className="text-sm text-teal-600 hover:text-teal-700 mt-3 block">
                            Cek Kualitas Air →
                        </Link>
                    </div>

                    {/* Riwayat Jumlah Ikan */}
                    <div className="card p-4">
                        <h3 className="font-semibold text-slate-900 mb-3">Riwayat Perubahan (Siklus Ini)</h3>
                        {filteredRiwayatIkan.length === 0 ? (
                            <p className="text-sm text-slate-500">Belum ada riwayat perubahan</p>
                        ) : (
                            <div className="space-y-3">
                                {filteredRiwayatIkan.slice(0, 5).map(r => (
                                    <div key={r.id} className="text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-slate-500">{new Date(r.tanggal).toLocaleDateString('id-ID')}</span>
                                            <span className={`font-semibold ${r.jumlahPerubahan > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {r.jumlahPerubahan > 0 ? '+' : ''}{r.jumlahPerubahan.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">{r.keterangan}</span>
                                            <span className="text-slate-400 text-xs">Total: {r.jumlahAkhir.toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Edit Fish Modal */}
            <Modal
                isOpen={isEditFishOpen}
                onClose={() => setIsEditFishOpen(false)}
                title="Update Jumlah Ikan"
            >
                <form onSubmit={handleUpdateFish} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Jumlah Ikan Saat Ini</label>
                        <input
                            type="text"
                            value={formatCurrencyInput(editFishCount)}
                            onChange={(e) => setEditFishCount(parseCurrencyInput(e.target.value))}
                            className="input border-slate-300"
                            placeholder="Contoh: 5.000"
                            required
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            Masukkan jumlah ikan terbaru (misal setelah ada kematian atau penambahan).
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Alasan Perubahan</label>
                        <select
                            value={editReason}
                            onChange={(e) => setEditReason(e.target.value)}
                            className="input w-full"
                        >
                            <option value="Koreksi / Hitung Ulang">Koreksi / Hitung Ulang</option>
                            <option value="Kematian">Kematian</option>
                            <option value="Bibit Baru">Bibit Baru</option>
                            <option value="Pindah Kolam">Pindah Kolam</option>
                            <option value="Panen Parsial">Panen Parsial</option>
                        </select>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsEditFishOpen(false)}
                            className="btn btn-secondary flex-1"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary flex-1"
                        >
                            Simpan Perubahan
                        </button>
                    </div>
                </form>
            </Modal>
            {/* Sampling Modal */}
            {/* Sampling Modal */}
            <Modal
                isOpen={isSamplingOpen}
                onClose={() => setIsSamplingOpen(false)}
                title="Input Sampling Ikan"
            >
                <form onSubmit={handleInputSampling} className="space-y-4">
                    {/* Input Mode Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            type="button"
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${samplingInputUnit === 'berat' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => {
                                setSamplingInputUnit('berat');
                                // Convert value if exists
                                if (samplingValue) {
                                    const val = parseFloat(samplingValue);
                                    if (!isNaN(val) && val > 0) {
                                        // switching size (isi) -> berat (gram)
                                        // 1000 / isi = gram
                                        setSamplingValue((1000 / val).toFixed(0));
                                    }
                                }
                            }}
                        >
                            Berat (Gram/Ekor)
                        </button>
                        <button
                            type="button"
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${samplingInputUnit === 'size' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => {
                                setSamplingInputUnit('size');
                                // Convert value if exists
                                if (samplingValue) {
                                    const val = parseFloat(samplingValue);
                                    if (!isNaN(val) && val > 0) {
                                        // switching berat (gram) -> size (isi)
                                        // 1000 / gram = isi
                                        setSamplingValue(Math.round(1000 / val).toString());
                                    }
                                }
                            }}
                        >
                            Size (Isi/Kg)
                        </button>
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="block text-sm font-medium text-slate-700">
                                {samplingInputUnit === 'berat' ? 'Berat Rata-rata (Gram)' : 'Jumlah Ikan per Kg (Size)'}
                            </label>
                            {samplingValue && !isNaN(parseFloat(samplingValue)) && parseFloat(samplingValue) > 0 && (
                                <span className="text-xs text-indigo-600 font-medium">
                                    Konversi: {samplingInputUnit === 'berat'
                                        ? `~Isi ${parseFloat((1000 / parseFloat(samplingValue)).toFixed(1))} /kg`
                                        : `~${parseFloat((1000 / parseFloat(samplingValue)).toFixed(1))} gram/ekor`
                                    }
                                </span>
                            )}
                        </div>
                        <input
                            type="number"
                            value={samplingValue}
                            onChange={(e) => setSamplingValue(e.target.value)}
                            className="input border-slate-300 w-full text-lg"
                            placeholder={samplingInputUnit === 'berat' ? "Contoh: 100" : "Contoh: 10"}
                            min="1"
                            step="any"
                            required
                            autoFocus
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            {samplingInputUnit === 'berat'
                                ? "Masukkan berat rata-rata satu ekor ikan dalam satuan gram."
                                : "Masukkan jumlah ekor ikan dalam 1 kilogram (istilah 'Size' atau 'Isi')."
                            }
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Catatan (Opsional)</label>
                        <textarea
                            value={samplingCatatan}
                            onChange={(e) => setSamplingCatatan(e.target.value)}
                            className="input border-slate-300 w-full"
                            placeholder="Contoh: Ikan sehat, nafsu makan baik..."
                            rows={2}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsSamplingOpen(false)}
                            className="btn btn-secondary flex-1"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary flex-1 bg-indigo-600 hover:bg-indigo-700 border-indigo-600"
                        >
                            Simpan Sampling
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Cycle History Modal */}
            <Modal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                title="Riwayat Siklus Produksi"
            >
                <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    {cycleHistory.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">Belum ada riwayat siklus.</p>
                    ) : (
                        cycleHistory.map((cycle, idx) => (
                            <div key={idx} className={`border rounded-lg p-4 ${cycle.isActive ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-900">Siklus {new Date(cycle.startDate).toLocaleDateString('id-ID')}</h4>
                                            {cycle.isActive && <span className="badge badge-primary text-xs">Aktif</span>}
                                        </div>
                                        <p className="text-sm text-slate-500">
                                            {new Date(cycle.startDate).toLocaleDateString('id-ID')} - {cycle.isActive ? 'Sekarang' : new Date(cycle.endDate).toLocaleDateString('id-ID')} ({cycle.totalDays} hari)
                                        </p>
                                    </div>
                                    <div className={`text-right ${cycle.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        <p className="text-xs text-slate-500">Profit</p>
                                        <p className="font-bold">Rp {cycle.netProfit.toLocaleString('id-ID')}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-sm bg-white/50 p-2 rounded">
                                    <div>
                                        <p className="text-slate-500 text-xs">FCR</p>
                                        <p className="font-semibold">{cycle.fcr.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs">SR</p>
                                        <p className="font-semibold">{cycle.sr.toFixed(1)}%</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs">Panen</p>
                                        <p className="font-semibold text-slate-900">{cycle.totalHarvestKg.toLocaleString()} kg</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-4 border-t bg-slate-50 text-center">
                    <button
                        onClick={() => setIsHistoryOpen(false)}
                        className="btn btn-secondary w-full"
                    >
                        Tutup
                    </button>
                </div>
            </Modal>
        </DashboardLayout >
    );
}
