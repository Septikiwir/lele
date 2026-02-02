'use client';

import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import Modal from '../../components/ui/Modal';
import { Edit, Loader2, Fish, ArrowLeft, Bookmark, X, Clock } from 'lucide-react';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils';

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
        calculateKepadatan,
        getUnifiedStatus,
        calculateBiomass,
        addRiwayatIkan,
        addRiwayatSampling,
        getCycleHistory,
        getFeedRecommendation,
    } = useApp();

    const [gridScale, setGridScale] = useState<number>(1);
    const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);
    const [pinnedCells, setPinnedCells] = useState<GridCell[]>([]);
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
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Use initialData as the kolam reference (already loaded from server)
    const kolam = initialData;
    const cycleHistory = getCycleHistory(kolam.id);

    const handleUpdateFish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!kolam || isSubmitting) return;

        setIsSubmitting(true);
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
                <Modal isOpen={isEditFishOpen} onClose={() => setIsEditFishOpen(false)} title="Update Jumlah Ikan">
                    <form onSubmit={handleUpdateFish} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Jumlah Ikan Terbaru</label>
                            <input
                                type="number"
                                value={editFishCount}
                                onChange={(e) => setEditFishCount(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Alasan</label>
                            <select
                                value={editReason}
                                onChange={(e) => setEditReason(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                            >
                                <option>Koreksi / Hitung Ulang</option>
                                <option>Kematian</option>
                                <option>Bibit Baru</option>
                                <option>Panen Parsial</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                        </button>
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
