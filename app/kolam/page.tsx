'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import { useState } from 'react';

import { PlusIcon, EditIcon, TrashIcon, EyeIcon } from '../components/ui/Icons';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext'; // Import Toast
import { TipePembeli } from '../context/AppContext';

const statusColors = {
    aman: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    waspada: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    berisiko: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    kosong: { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' },
};

const statusLabels = {
    aman: 'Aman',
    waspada: 'Waspada',
    berisiko: 'Berisiko',
    kosong: 'Kosong',
};

export default function KolamPage() {
    const {
        kolam, deleteKolam, calculateKepadatan, getUnifiedStatus,
        getLatestSampling, getFeedRecommendation,
        addPakan, addRiwayatPanen, addPenjualan, pembeli, getAllJenisPakan, tebarBibit
    } = useApp();
    const { showToast } = useToast();
    const [deleteModal, setDeleteModal] = useState<string | null>(null);

    // Feed Modal State
    const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
    const [feedForm, setFeedForm] = useState({
        kolamId: '',
        tanggal: new Date().toISOString().split('T')[0],
        jumlahKg: '',
        jenisPakan: '',
    });

    // Harvest Modal State
    const [isPanenModalOpen, setIsPanenModalOpen] = useState(false);
    const [panenForm, setPanenForm] = useState({
        kolamId: '',
        pembeliId: '',
        tanggal: new Date().toISOString().split('T')[0],
        beratTotalKg: '',
        jumlahEkor: '',
        hargaPerKg: '25000',
        tipe: 'PARSIAL' as 'PARSIAL' | 'TOTAL',
        catatan: ''
    });

    // Tebar Modal State
    const [isTebarModalOpen, setIsTebarModalOpen] = useState(false);
    const [tebarForm, setTebarForm] = useState({
        kolamId: '',
        tanggal: new Date().toISOString().split('T')[0],
        jumlah: '',
        beratPerEkor: '5' // Default 5g
    });

    const handleTebarSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tebarForm.kolamId || !tebarForm.jumlah) return;

        try {
            // Execute tebarBibit
            await tebarBibit(tebarForm.kolamId, {
                tanggal: tebarForm.tanggal,
                jumlah: parseInt(tebarForm.jumlah),
                beratPerEkor: parseFloat(tebarForm.beratPerEkor) || 5, // Default 5g if empty/invalid
            });
            showToast('Tebar bibit berhasil!', 'success');
            setIsTebarModalOpen(false);
        } catch (error) {
            console.error(error);
            showToast('Gagal tebar bibit', 'error');
        }
    };

    // Handlers
    const handleOpenTebar = (kolamId: string) => {
        setTebarForm(prev => ({ ...prev, kolamId }));
        setIsTebarModalOpen(true);
    };

    const handleOpenFeed = (kolamId: string) => {
        // Pre-fill logic can go here (e.g. get recommendation)
        // We'll calculate rec on the fly inside the modal or pass it
        // For now just basic open handles
        setFeedForm(prev => ({
            ...prev,
            kolamId,
            tanggal: new Date().toISOString().split('T')[0],
            jumlahKg: '',
            jenisPakan: '' // Could pre-fill if we had shared logic easily accessible here without rendering
        }));
        setIsFeedModalOpen(true);
    };

    const handleFeedSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedForm.kolamId || !feedForm.jumlahKg) return;

        addPakan({
            kolamId: feedForm.kolamId,
            tanggal: feedForm.tanggal,
            jumlahKg: parseFloat(feedForm.jumlahKg),
            jenisPakan: feedForm.jenisPakan || 'Pelet Hi-Pro',
        });

        showToast('Pemberian pakan berhasil dicatat', 'success');
        setIsFeedModalOpen(false);
    };

    const handlePanenSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!panenForm.pembeliId) {
                showToast('Harap pilih pembeli!', 'error');
                return;
            }

            // 1. Add Harvest Record
            await addRiwayatPanen({
                kolamId: panenForm.kolamId,
                tanggal: panenForm.tanggal,
                beratTotalKg: parseFloat(panenForm.beratTotalKg),
                jumlahEkor: parseInt(panenForm.jumlahEkor),
                hargaPerKg: parseFloat(panenForm.hargaPerKg),
                tipe: panenForm.tipe,
                catatan: panenForm.catatan,
            });

            // 2. Add Sales Record
            const totalPendapatan = parseFloat(panenForm.beratTotalKg) * parseFloat(panenForm.hargaPerKg);

            addPenjualan({
                kolamId: panenForm.kolamId,
                pembeliId: panenForm.pembeliId,
                tanggal: panenForm.tanggal,
                beratKg: parseFloat(panenForm.beratTotalKg),
                hargaPerKg: parseFloat(panenForm.hargaPerKg),
                // Note: Penjualan interface doesn't have catatan field
            });

            showToast('Panen & Penjualan berhasil dicatat!', 'success');
            setIsPanenModalOpen(false);

            // Reset form
            setPanenForm({
                kolamId: '',
                pembeliId: '',
                tanggal: new Date().toISOString().split('T')[0],
                beratTotalKg: '',
                jumlahEkor: '',
                hargaPerKg: '25000',
                tipe: 'PARSIAL',
                catatan: ''
            });

        } catch (error) {
            console.error(error);
            showToast('Gagal mencatat panen', 'error');
        }
    };

    const handleDelete = (id: string) => {
        deleteKolam(id);
        setDeleteModal(null);
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Manajemen Kolam</h1>
                    <p className="text-slate-500 mt-1">Kelola semua kolam peternakan Anda</p>
                </div>
                <Link href="/kolam/tambah" className="btn btn-primary">
                    <PlusIcon />
                    Tambah Kolam
                </Link>
            </div>

            {/* Kolam Grid */}
            {kolam.length === 0 ? (
                <EmptyState
                    title="Belum Ada Kolam"
                    description="Mulai dengan menambahkan kolam pertama Anda"
                    icon="🐟"
                    action={{ label: "Tambah Kolam Baru", href: "/kolam/tambah" }}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {kolam.map(k => {
                        const isEmpty = k.jumlahIkan === 0;
                        const unifiedStatus = getUnifiedStatus(k.id);
                        const displayStatus = isEmpty ? 'kosong' : unifiedStatus.status;

                        const volume = k.panjang * k.lebar * k.kedalaman;
                        const luas = k.panjang * k.lebar;
                        const colors = statusColors[displayStatus as keyof typeof statusColors];

                        // Feed Rec Logic (Pre-calculated)
                        let feedRec = null;
                        if (!isEmpty) {
                            const latestSampling = getLatestSampling(k.id);
                            const today = new Date();
                            const growth = 2; // Default 2g/day
                            let currentWeight = 0;

                            if (latestSampling && latestSampling.jumlahIkanPerKg > 0) {
                                const lastWeight = 1000 / latestSampling.jumlahIkanPerKg;
                                const samplingDate = new Date(latestSampling.tanggal);
                                const daysSinceSampling = Math.max(0, Math.floor((today.getTime() - samplingDate.getTime()) / (1000 * 60 * 60 * 24)));
                                currentWeight = lastWeight + (daysSinceSampling * growth);
                            } else {
                                const tebarDate = k.tanggalTebar ? new Date(k.tanggalTebar) : new Date();
                                const daysPassed = Math.max(0, Math.floor((today.getTime() - tebarDate.getTime()) / (1000 * 60 * 60 * 24)));
                                currentWeight = 5 + (daysPassed * growth);
                            }
                            const totalBiomass = (k.jumlahIkan * currentWeight) / 1000;
                            feedRec = getFeedRecommendation(currentWeight, totalBiomass);
                        }

                        return (
                            <div key={k.id} className={`card p-6 border-l-4 ${colors.border}`}>
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center text-2xl`}>
                                            🐟
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900">{k.nama}</h3>
                                            <span className={`badge ${colors.bg} ${colors.text}`}>
                                                {statusLabels[displayStatus as keyof typeof statusLabels]}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <p className="text-xs text-slate-500 uppercase tracking-wide">Dimensi (m)</p>
                                        <p className="font-semibold text-slate-900">{k.panjang} × {k.lebar} × {k.kedalaman}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <p className="text-xs text-slate-500 uppercase tracking-wide">Luas & Vol</p>
                                        <p className="font-semibold text-slate-900">{parseFloat(luas.toFixed(1))} m² <span className="text-slate-400">|</span> {parseFloat(volume.toFixed(1))} m³</p>
                                    </div>
                                    <div className={`${isEmpty ? 'col-span-2' : ''} bg-slate-50 rounded-lg p-3 flex justify-between items-center`}>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wide">Populasi</p>
                                            <p className="font-semibold text-slate-900 text-lg">{k.jumlahIkan.toLocaleString('id-ID')}</p>
                                        </div>
                                        {isEmpty && (
                                            <span className="text-xs text-slate-400 italic">Siap ditebar</span>
                                        )}
                                    </div>

                                    {/* Feed Rec Box */}
                                    {feedRec && (
                                        <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 flex flex-col justify-center">
                                            <p className="text-[10px] uppercase font-bold text-amber-700 tracking-wider mb-1">Pakan ({feedRec.type.split(' ')[0]}) ({feedRec.ratePercent})</p>
                                            <div className="flex flex-col">
                                                <div className="flex items-baseline justify-between">
                                                    <p className="font-bold text-amber-900 text-lg leading-none">{feedRec.amount} <span className="text-xs font-normal">/ hari</span></p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="mb-4">
                                    {isEmpty ? (
                                        <button
                                            onClick={() => handleOpenTebar(k.id)}
                                            className="w-full btn bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200 border-none flex items-center justify-center gap-2 py-2.5 font-semibold"
                                        >
                                            🐟 Tebar Bibit Baru
                                        </button>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => handleOpenFeed(k.id)}
                                                className="btn bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-200 border-none flex items-center justify-center gap-2 py-2.5 font-semibold"
                                            >
                                                🍽️ Beri Pakan
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setPanenForm(prev => ({ ...prev, kolamId: k.id }));
                                                    setIsPanenModalOpen(true);
                                                }}
                                                className="btn bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200 border-none flex items-center justify-center gap-2 py-2.5 font-semibold"
                                            >
                                                🌾 Panen
                                            </button>
                                        </div>
                                    )}
                                </div>



                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Link
                                        href={`/kolam/${k.id}`}
                                        className="flex-1 btn btn-secondary text-sm"
                                    >
                                        <EyeIcon /> Detail
                                    </Link>
                                    <Link
                                        href={`/kolam/${k.id}/edit`}
                                        className="btn btn-ghost text-sm"
                                    >
                                        <EditIcon />
                                    </Link>
                                    <button
                                        onClick={() => setDeleteModal(k.id)}
                                        className="btn btn-ghost text-red-600 hover:bg-red-50 text-sm"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Delete Modal */}
            {/* Delete Modal */}
            <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)}>
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center text-3xl">
                        ⚠️
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Hapus Kolam?</h3>
                    <p className="text-slate-500 mb-6">
                        Semua data terkait kolam ini (pakan, kondisi air) akan ikut terhapus. Aksi ini tidak dapat dibatalkan.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setDeleteModal(null)}
                            className="flex-1 btn btn-secondary"
                        >
                            Batal
                        </button>
                        <button
                            onClick={() => handleDelete(deleteModal!)}
                            className="flex-1 btn btn-danger"
                        >
                            Ya, Hapus
                        </button>
                    </div>
                </div>
            </Modal>

            {/* FEED MODAL */}
            <Modal isOpen={isFeedModalOpen} onClose={() => setIsFeedModalOpen(false)} title="Catat Pemberian Pakan">
                <form onSubmit={handleFeedSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Kolam</label>
                        <select
                            className="input bg-slate-100"
                            value={feedForm.kolamId}
                            disabled
                        >
                            {kolam.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal</label>
                        <input
                            type="date"
                            className="input"
                            value={feedForm.tanggal}
                            onChange={(e) => setFeedForm({ ...feedForm, tanggal: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Pakan</label>
                        <select
                            className="input"
                            value={feedForm.jenisPakan}
                            onChange={(e) => setFeedForm({ ...feedForm, jenisPakan: e.target.value })}
                        >
                            <option value="">-- Pilih Jenis --</option>
                            {(getAllJenisPakan() || []).map(j => (
                                <option key={j} value={j}>{j}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Jumlah (kg)</label>
                        <input
                            type="number"
                            step="0.1"
                            className="input"
                            value={feedForm.jumlahKg}
                            onChange={(e) => setFeedForm({ ...feedForm, jumlahKg: e.target.value })}
                            placeholder="Contoh: 2.5"
                            required
                        />
                    </div>
                    <div className="pt-4 flex gap-2">
                        <button type="button" onClick={() => setIsFeedModalOpen(false)} className="btn btn-secondary flex-1">Batal</button>
                        <button type="submit" className="btn btn-primary flex-1">Simpan</button>
                    </div>
                </form>
            </Modal>

            {/* HARVEST MODAL */}
            <Modal isOpen={isPanenModalOpen} onClose={() => setIsPanenModalOpen(false)} title="Form Panen Cepat">
                <form onSubmit={handlePanenSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Kolam</label>
                        <select
                            className="input bg-slate-100"
                            value={panenForm.kolamId}
                            disabled
                        >
                            {kolam.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tipe Panen</label>
                            <select
                                className="input"
                                value={panenForm.tipe}
                                onChange={(e) => setPanenForm({ ...panenForm, tipe: e.target.value as any })}
                            >
                                <option value="PARSIAL">Parsial (Sebagian)</option>
                                <option value="TOTAL">Total (Panen Raya)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal</label>
                            <input
                                type="date"
                                className="input"
                                value={panenForm.tanggal}
                                onChange={(e) => setPanenForm({ ...panenForm, tanggal: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Pembeli</label>
                        <select
                            className="input"
                            value={panenForm.pembeliId}
                            onChange={(e) => setPanenForm({ ...panenForm, pembeliId: e.target.value })}
                            required
                        >
                            <option value="">-- Pilih Pembeli --</option>
                            {pembeli.map(p => (
                                <option key={p.id} value={p.id}>{p.nama} ({p.tipe})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Jumlah Ekor</label>
                            <input
                                type="number"
                                className="input"
                                value={panenForm.jumlahEkor}
                                onChange={(e) => {
                                    const count = parseInt(e.target.value);
                                    let estimatedWeight = panenForm.beratTotalKg;

                                    // Auto-calculate logic (Reverse)
                                    if (count > 0 && panenForm.kolamId) {
                                        const latestSampling = getLatestSampling(panenForm.kolamId);
                                        if (latestSampling && latestSampling.jumlahIkanPerKg > 0) {
                                            // Weight = Count / FishPerKg
                                            estimatedWeight = (count / latestSampling.jumlahIkanPerKg).toFixed(1);
                                        }
                                    }

                                    setPanenForm({
                                        ...panenForm,
                                        jumlahEkor: e.target.value,
                                        beratTotalKg: estimatedWeight
                                    });
                                }}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Berat Total (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                className="input"
                                value={panenForm.beratTotalKg}
                                onChange={(e) => {
                                    const totalWeight = parseFloat(e.target.value);
                                    let estimatedCount = panenForm.jumlahEkor;

                                    // Auto-calculate logic
                                    if (totalWeight > 0 && panenForm.kolamId) {
                                        const latestSampling = getLatestSampling(panenForm.kolamId);
                                        // Use sampling if available, else default to assumption (e.g. 100g/fish or 10 fish/kg)
                                        // If sampling exists: jumlahIkanPerKg is available
                                        if (latestSampling && latestSampling.jumlahIkanPerKg > 0) {
                                            estimatedCount = Math.round(totalWeight * latestSampling.jumlahIkanPerKg).toString();
                                        }
                                    }

                                    setPanenForm({
                                        ...panenForm,
                                        beratTotalKg: e.target.value,
                                        jumlahEkor: estimatedCount
                                    });
                                }}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Harga Per Kg</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">Rp</span>
                            <input
                                type="number"
                                className="input pl-10"
                                value={panenForm.hargaPerKg}
                                onChange={(e) => setPanenForm({ ...panenForm, hargaPerKg: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Catatan (Opsional)</label>
                        <input
                            type="text"
                            className="input"
                            value={panenForm.catatan}
                            onChange={(e) => setPanenForm({ ...panenForm, catatan: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex gap-2">
                        <button type="button" onClick={() => setIsPanenModalOpen(false)} className="btn btn-secondary flex-1">Batal</button>
                        <button type="submit" className="btn btn-primary flex-1">Simpan Panen</button>
                    </div>
                </form>
            </Modal>
            {/* TEBAR MODAL */}
            <Modal isOpen={isTebarModalOpen} onClose={() => setIsTebarModalOpen(false)} title="Tebar Bibit Baru">
                <form onSubmit={handleTebarSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Kolam</label>
                        <select
                            className="input bg-slate-100"
                            value={tebarForm.kolamId}
                            disabled
                        >
                            {kolam.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal Tebar</label>
                        <input
                            type="date"
                            className="input"
                            value={tebarForm.tanggal}
                            onChange={(e) => setTebarForm({ ...tebarForm, tanggal: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Jumlah Bibit (ekor)</label>
                        <input
                            type="number"
                            className="input"
                            value={tebarForm.jumlah}
                            onChange={(e) => setTebarForm({ ...tebarForm, jumlah: e.target.value })}
                            placeholder="Contoh: 1000"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Berat Rata-rata (gram/ekor)</label>
                        <input
                            type="number"
                            step="0.1"
                            className="input"
                            value={tebarForm.beratPerEkor}
                            onChange={(e) => setTebarForm({ ...tebarForm, beratPerEkor: e.target.value })}
                            placeholder="Default: 5"
                        />
                        <p className="text-xs text-slate-500 mt-1">Biarkan 5g jika tidak ditimbang</p>
                    </div>
                    <div className="pt-4 flex gap-2">
                        <button type="button" onClick={() => setIsTebarModalOpen(false)} className="btn btn-secondary flex-1">Batal</button>
                        <button type="submit" className="btn btn-primary flex-1">Simpan</button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
