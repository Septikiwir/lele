'use client';

import { use, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { notFound } from 'next/navigation';

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
    const { getKolamById, calculateKepadatan, getPakanByKolam, getKondisiAirByKolam } = useApp();
    const kolam = getKolamById(resolvedParams.id);

    const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);
    const [pinnedCells, setPinnedCells] = useState<GridCell[]>([]);
    const [gridScale, setGridScale] = useState<number>(1);
    const [showTooltip, setShowTooltip] = useState<{ x: number; y: number } | null>(null);

    if (!kolam) {
        notFound();
    }

    const kepadatan = calculateKepadatan(kolam);
    const volume = kolam.panjang * kolam.lebar * kolam.kedalaman;
    const luas = kolam.panjang * kolam.lebar;
    const pakan = getPakanByKolam(kolam.id);
    const kondisiAir = getKondisiAirByKolam(kolam.id);

    // Generate grid cells
    const cols = Math.ceil(kolam.panjang / gridScale);
    const rows = Math.ceil(kolam.lebar / gridScale);

    const generateCellData = (row: number, col: number): GridCell => {
        // Simulate varying kepadatan across the pond with some randomness
        const baseKepadatan = kepadatan;
        const variation = (Math.sin(row * 0.5) + Math.cos(col * 0.7)) * 15;
        const cellKepadatan = Math.max(0, baseKepadatan + variation);

        let status: 'aman' | 'waspada' | 'berisiko';
        if (cellKepadatan <= 50) status = 'aman';
        else if (cellKepadatan <= 100) status = 'waspada';
        else status = 'berisiko';

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
                    <span className={`badge ${kolam.status === 'aman' ? 'badge-success' : kolam.status === 'waspada' ? 'badge-warning' : 'badge-danger'}`}>
                        {statusLabels[kolam.status]}
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
                <div className="stat-card">
                    <p className="stat-label">Jumlah Ikan</p>
                    <p className="stat-value">{kolam.jumlahIkan.toLocaleString('id-ID')}</p>
                </div>
                <div className="stat-card">
                    <p className="stat-label">Kepadatan</p>
                    <p className={`stat-value ${kolam.status === 'aman' ? 'text-green-600' : kolam.status === 'waspada' ? 'text-amber-600' : 'text-red-600'}`}>
                        {kepadatan.toFixed(1)}<span className="text-lg text-slate-400"> /m³</span>
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pond Visualization */}
                <div className="lg:col-span-2 card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-900">Denah Tambak</h2>
                        <span className={`badge ${kolam.status === 'aman' ? 'badge-success' : kolam.status === 'waspada' ? 'badge-warning' : 'badge-danger'}`}>
                            {statusLabels[kolam.status]}
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
                                className={`w-full h-full rounded-xl shadow-lg border-4 flex flex-col items-center justify-center transition-all relative overflow-hidden ${kolam.status === 'aman'
                                    ? 'bg-gradient-to-br from-cyan-400 to-teal-500 border-cyan-600'
                                    : kolam.status === 'waspada'
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
                                        <span className="text-sm font-medium">Kepadatan: {kepadatan.toFixed(1)} /m³</span>
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
                    <div className={`mt-4 p-4 rounded-lg ${kolam.status === 'aman' ? 'bg-green-50 border border-green-200' :
                        kolam.status === 'waspada' ? 'bg-amber-50 border border-amber-200' :
                            'bg-red-50 border border-red-200'
                        }`}>
                        <p className={`text-sm ${kolam.status === 'aman' ? 'text-green-700' :
                            kolam.status === 'waspada' ? 'text-amber-700' :
                                'text-red-700'
                            }`}>
                            <strong>Rekomendasi:</strong> {rekomendasi[kolam.status]}
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
                                        {hoveredCell.kepadatan.toFixed(1)}/m³
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
                                                {cell.kepadatan.toFixed(1)}/m³
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
                </div>
            </div>
        </DashboardLayout >
    );
}
