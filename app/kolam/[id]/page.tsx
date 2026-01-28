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
    const { getKolamById, calculateKepadatan, getPakanByKolam, getKondisiAirByKolam, addRiwayatIkan, getRiwayatIkanByKolam, getUnifiedStatus, calculateBiomass, addRiwayatSampling, isLoading } = useApp();
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
                        <p className="text-slate-500 mt-1">Tebar: {kolam.tanggalTebar} • {kolam.panjang}m × {kolam.lebar}m × {kolam.kedalaman}m</p>
                    </div>
                    <span className={`badge ${displayStatus === 'aman' ? 'badge-success' : displayStatus === 'waspada' ? 'badge-warning' : 'badge-danger'}`}>
                        {statusLabels[displayStatus]}
                    </span>
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
                    <p className="stat-value">{volume.toFixed(1)}<span className="text-lg text-slate-400"> m³</span></p>
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
                        {kepadatan.toFixed(1)}<span className="text-lg text-slate-400"> /m³</span>
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
                        {biomassDensity > 0 ? biomassDensity.toFixed(2) : '-'}<span className="text-lg text-indigo-400"> kg/m³</span>
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
                                            Kepadatan: {unifiedStatus.source === 'berat' ? `${unifiedStatus.kepadatanBerat.toFixed(2)} kg/m³` : `${unifiedStatus.kepadatanEkor.toFixed(1)} /m³`}
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
                                    <span className="font-medium">{(gridScale * kolam.kedalaman).toFixed(1)} m³</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Est. Ikan</span>
                                    <span className="font-medium">{Math.round(hoveredCell.kepadatan * gridScale * kolam.kedalaman)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Kepadatan</span>
                                    <span className={`font-medium ${hoveredCell.status === 'aman' ? 'text-green-600' : hoveredCell.status === 'waspada' ? 'text-amber-600' : 'text-red-600'}`}>
                                        {hoveredCell.kepadatan.toFixed(1)}{unifiedStatus.source === 'berat' ? ' kg/m³' : '/m³'}
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
                                                {cell.kepadatan.toFixed(1)}{unifiedStatus.source === 'berat' ? ' kg/m³' : '/m³'}
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
                        <h3 className="font-semibold text-slate-900 mb-3">Riwayat Pakan</h3>
                        {pakan.length === 0 ? (
                            <p className="text-sm text-slate-500">Belum ada data pakan</p>
                        ) : (
                            <div className="space-y-2">
                                {pakan.slice(0, 3).map(p => (
                                    <div key={p.id} className="flex justify-between text-sm">
                                        <span className="text-slate-500">{p.tanggal}</span>
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
                        {kondisiAir.length === 0 ? (
                            <p className="text-sm text-slate-500">Belum ada data kondisi air</p>
                        ) : (
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Warna</span>
                                    <span className="font-medium">{kondisiAir[0].warna}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Bau</span>
                                    <span className="font-medium">{kondisiAir[0].bau}</span>
                                </div>
                                {kondisiAir[0].ph && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">pH</span>
                                        <span className="font-medium">{kondisiAir[0].ph}</span>
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
                        <h3 className="font-semibold text-slate-900 mb-3">Riwayat Jumlah Ikan</h3>
                        {riwayatIkan.length === 0 ? (
                            <p className="text-sm text-slate-500">Belum ada riwayat perubahan</p>
                        ) : (
                            <div className="space-y-3">
                                {riwayatIkan.slice(0, 5).map(r => (
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
                                        ? `~Isi ${(1000 / parseFloat(samplingValue)).toFixed(1)} /kg`
                                        : `~${(1000 / parseFloat(samplingValue)).toFixed(1)} gram/ekor`
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
        </DashboardLayout >
    );
}
