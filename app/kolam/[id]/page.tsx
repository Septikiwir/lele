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
                {/* Grid Visualization */}
                <div className="lg:col-span-2 card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-900">Visualisasi Grid 2D</h2>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-500">Skala:</label>
                            <select
                                value={gridScale}
                                onChange={(e) => setGridScale(parseFloat(e.target.value))}
                                className="input py-1 px-2 w-24"
                            >
                                <option value="0.5">0.5 m²</option>
                                <option value="1">1 m²</option>
                                <option value="2">2 m²</option>
                            </select>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded grid-cell-aman"></div>
                            <span className="text-slate-600">Aman (≤50/m³)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded grid-cell-waspada"></div>
                            <span className="text-slate-600">Waspada (51-100/m³)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded grid-cell-berisiko"></div>
                            <span className="text-slate-600">Berisiko (&gt;100/m³)</span>
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="overflow-auto bg-slate-50 rounded-xl p-4">
                        <div
                            className="grid gap-1 mx-auto"
                            style={{
                                gridTemplateColumns: `repeat(${cols}, minmax(32px, 1fr))`,
                                maxWidth: `${cols * 40}px`,
                            }}
                        >
                            {Array.from({ length: rows }).map((_, rowIndex) =>
                                Array.from({ length: cols }).map((_, colIndex) => {
                                    const cell = generateCellData(rowIndex, colIndex);
                                    const isPinned = pinnedCells.some(p => p.row === rowIndex && p.col === colIndex);

                                    return (
                                        <div
                                            key={`${rowIndex}-${colIndex}`}
                                            className={`grid-cell aspect-square flex items-center justify-center text-xs font-medium ${statusColors[cell.status]} ${isPinned ? 'ring-2 ring-blue-500' : ''}`}
                                            onMouseEnter={(e) => handleCellHover(cell, e)}
                                            onMouseLeave={() => { setHoveredCell(null); setShowTooltip(null); }}
                                            onClick={(e) => handleCellClick(cell, e)}
                                        >
                                            {cell.kepadatan.toFixed(0)}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <p className="text-xs text-slate-400 mt-2 text-center">
                        Klik pada sel untuk pin tooltip (maks 3). Hover untuk melihat detail.
                    </p>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Hovered Cell Info */}
                    {hoveredCell && (
                        <div className="card p-4 border-l-4 border-blue-500">
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
                        <Link href="/pakan" className="text-sm text-blue-600 hover:text-blue-700 mt-3 block">
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
                        <Link href="/kualitas-air" className="text-sm text-blue-600 hover:text-blue-700 mt-3 block">
                            Cek Kualitas Air →
                        </Link>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
