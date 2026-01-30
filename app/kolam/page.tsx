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
    aman: 'badge-success',
    waspada: 'badge-warning',
    berisiko: 'badge-danger',
    kosong: 'badge-neutral',
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
        addPakan, addRiwayatPanen, addPenjualan, pembeli, getAllJenisPakan, tebarBibit,
        hargaPasarPerKg
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
        beratPerEkor: '5', // Default 5g
        hargaPerEkor: '' // Harga per ekor bibit
    });

    const handleTebarSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tebarForm.kolamId || !tebarForm.jumlah || !tebarForm.hargaPerEkor) return;

        try {
            // Execute tebarBibit
            await tebarBibit(tebarForm.kolamId, {
                tanggal: tebarForm.tanggal,
                jumlah: parseInt(tebarForm.jumlah),
                beratPerEkor: parseFloat(tebarForm.beratPerEkor),
                hargaPerEkor: parseFloat(tebarForm.hargaPerEkor)
            });
            showToast('Tebar bibit berhasil!', 'success');
            setIsTebarModalOpen(false);
            setTebarForm({ ...tebarForm, jumlah: '', beratPerEkor: '5', hargaPerEkor: '' });
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
            <div className="flex flex-col gap-6 sm:gap-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {kolam.map(k => {
                        const isEmpty = k.jumlahIkan === 0;
                        const unifiedStatus = getUnifiedStatus(k.id);
                        const displayStatus = isEmpty ? 'kosong' : unifiedStatus.status;

                        const volume = k.panjang * k.lebar * k.kedalaman;
                        const luas = k.panjang * k.lebar;
                        const badgeClass = statusColors[displayStatus as keyof typeof statusColors];

                        // Feed Rec Logic (Pre-calculated)
                        let feedRec = null;
                        let currentWeight = 0;
                        if (!isEmpty) {
                            const latestSampling = getLatestSampling(k.id);
                            const today = new Date();
                            const growth = 2; // Default 2g/day

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

                        // Estimasi Aset per kolam
                        const estimasiAset = isEmpty ? 0 : (k.jumlahIkan * currentWeight / 1000) * hargaPasarPerKg;

                        return (
                            <div key={k.id} className="card p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="icon-box icon-box-primary">
                                            🐟
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900">{k.nama}</h3>
                                            {k.tanggalTebar && (
                                                <p className="text-sm text-slate-500">
                                                    Tebar: {new Date(k.tanggalTebar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`badge ${badgeClass}`}>
                                        {statusLabels[displayStatus as keyof typeof statusLabels]}
                                    </span>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    {/* Dimensi */}
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50">
                                        <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-2">Dimensi</p>
                                        <p className="text-base font-semibold text-blue-900">{k.panjang} × {k.lebar} × {k.kedalaman}<span className="text-xs font-normal text-blue-700"> m</span></p>
                                    </div>
                                    
                                    {/* Luas & Volume */}
                                    <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 rounded-xl p-4 border border-cyan-200/50">
                                        <p className="text-[11px] font-bold text-cyan-600 uppercase tracking-wider mb-2">Luas & Volume</p>
                                        <p className="text-base font-semibold text-cyan-900">{parseFloat(luas.toFixed(1))}<span className="text-xs font-normal text-cyan-700"> m²</span> <span className="text-slate-400">|</span> {parseFloat(volume.toFixed(1))}<span className="text-xs font-normal text-cyan-700"> m³</span></p>
                                    </div>
                                    
                                    {/* Populasi */}
                                    <div className={`${isEmpty ? 'col-span-2' : ''} bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200/50`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Populasi</p>
                                                <p className="text-base font-semibold text-emerald-900">{k.jumlahIkan.toLocaleString('id-ID')}</p>
                                            </div>
                                            {isEmpty && (
                                                <span className="px-2 py-1 bg-emerald-200/50 text-emerald-700 text-xs font-semibold rounded-lg">Siap Tebar</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Estimasi Aset */}
                                    {!isEmpty && (
                                        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200/50">
                                            <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider mb-2">Estimasi Aset</p>
                                            <p className="text-base font-semibold text-purple-900">
                                                Rp{estimasiAset.toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    )}

                                    {/* Feed Rec Box */}
                                    {feedRec && (
                                        <div className="col-span-2 bg-gradient-to-br from-amber-50 to-orange-100/50 rounded-xl p-4 border border-amber-200/50">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-2">Rekomendasi Pakan</p>
                                                    <p className="text-xs text-amber-700 mb-2">{feedRec.type} ({feedRec.ratePercent})</p>
                                                    <p className="text-base font-semibold text-amber-900">{feedRec.amount} <span className="text-xs font-normal text-amber-700">kg/hari</span></p>
                                                </div>
                                                <div className="bg-white/60 rounded-lg px-3 py-2 text-right">
                                                    <p className="text-xs text-amber-600 font-semibold">Optimal</p>
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
                                            className="btn btn-primary w-full"
                                        >
                                            🐟 Tebar Bibit Baru
                                        </button>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => handleOpenFeed(k.id)}
                                                className="btn btn-primary"
                                            >
                                                🍽️ Beri Pakan
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setPanenForm(prev => ({ ...prev, kolamId: k.id }));
                                                    setIsPanenModalOpen(true);
                                                }}
                                                className="btn btn-success"
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
            </div>

            {/* Delete Modal */}
            <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} size="sm">
                <div className="text-center">
                    <div className="icon-box icon-box-lg icon-box-danger mx-auto mb-4">
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
            <Modal 
                isOpen={isFeedModalOpen} 
                onClose={() => setIsFeedModalOpen(false)} 
                title="Catat Pemberian Pakan"
                footer={
                    <>
                        <button type="button" onClick={() => setIsFeedModalOpen(false)} className="btn btn-secondary">Batal</button>
                        <button type="submit" form="feed-form" className="btn btn-primary">Simpan</button>
                    </>
                }
            >
                <form id="feed-form" onSubmit={handleFeedSubmit} className="space-y-4">
                    <div className="form-group">
                        <label className="form-label">Kolam</label>
                        <select
                            className="input bg-slate-100"
                            value={feedForm.kolamId}
                            disabled
                        >
                            {kolam.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tanggal</label>
                        <input
                            type="date"
                            className="input"
                            value={feedForm.tanggal}
                            onChange={(e) => setFeedForm({ ...feedForm, tanggal: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Jenis Pakan</label>
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
                    <div className="form-group">
                        <label className="form-label">Jumlah (kg)</label>
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
                </form>
            </Modal>

            {/* HARVEST MODAL */}
            <Modal 
                isOpen={isPanenModalOpen} 
                onClose={() => setIsPanenModalOpen(false)} 
                title="Form Panen Cepat"
                size="lg"
                footer={
                    <>
                        <button type="button" onClick={() => setIsPanenModalOpen(false)} className="btn btn-secondary">Batal</button>
                        <button type="submit" form="panen-form" className="btn btn-primary">Simpan Panen</button>
                    </>
                }
            >
                <form id="panen-form" onSubmit={handlePanenSubmit} className="space-y-4">
                    <div className="form-group">
                        <label className="form-label">Kolam</label>
                        <select
                            className="input bg-slate-100"
                            value={panenForm.kolamId}
                            disabled
                        >
                            {kolam.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Tipe Panen</label>
                            <select
                                className="input"
                                value={panenForm.tipe}
                                onChange={(e) => setPanenForm({ ...panenForm, tipe: e.target.value as any })}
                            >
                                <option value="PARSIAL">Parsial (Sebagian)</option>
                                <option value="TOTAL">Total (Panen Raya)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tanggal</label>
                            <input
                                type="date"
                                className="input"
                                value={panenForm.tanggal}
                                onChange={(e) => setPanenForm({ ...panenForm, tanggal: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Pembeli</label>
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
                        <div className="form-group">
                            <label className="form-label">Jumlah Ekor</label>
                            <input
                                type="number"
                                className="input"
                                value={panenForm.jumlahEkor}
                                onChange={(e) => {
                                    const count = parseInt(e.target.value);
                                    let estimatedWeight = panenForm.beratTotalKg;

                                    if (count > 0 && panenForm.kolamId) {
                                        const latestSampling = getLatestSampling(panenForm.kolamId);
                                        if (latestSampling && latestSampling.jumlahIkanPerKg > 0) {
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
                        <div className="form-group">
                            <label className="form-label">Berat Total (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                className="input"
                                value={panenForm.beratTotalKg}
                                onChange={(e) => {
                                    const totalWeight = parseFloat(e.target.value);
                                    let estimatedCount = panenForm.jumlahEkor;

                                    if (totalWeight > 0 && panenForm.kolamId) {
                                        const latestSampling = getLatestSampling(panenForm.kolamId);
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

                    <div className="form-group">
                        <label className="form-label">Harga Per Kg</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">Rp</span>
                            <input
                                type="number"
                                className="input"
                                style={{ paddingLeft: '42px' }}
                                value={panenForm.hargaPerKg}
                                onChange={(e) => setPanenForm({ ...panenForm, hargaPerKg: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Catatan (Opsional)</label>
                        <input
                            type="text"
                            className="input"
                            value={panenForm.catatan}
                            onChange={(e) => setPanenForm({ ...panenForm, catatan: e.target.value })}
                        />
                    </div>
                </form>
            </Modal>
            {/* TEBAR MODAL */}
            <Modal 
                isOpen={isTebarModalOpen} 
                onClose={() => setIsTebarModalOpen(false)} 
                title="Tebar Bibit Baru"
                footer={
                    <>
                        <button type="button" onClick={() => setIsTebarModalOpen(false)} className="btn btn-secondary">Batal</button>
                        <button type="submit" form="tebar-form" className="btn btn-primary">Simpan</button>
                    </>
                }
            >
                <form id="tebar-form" onSubmit={handleTebarSubmit} className="space-y-4">
                    <div className="form-group">
                        <label className="form-label">Kolam</label>
                        <select
                            className="input bg-slate-100"
                            value={tebarForm.kolamId}
                            disabled
                        >
                            {kolam.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tanggal Tebar</label>
                        <input
                            type="date"
                            className="input"
                            value={tebarForm.tanggal}
                            onChange={(e) => setTebarForm({ ...tebarForm, tanggal: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Jumlah Bibit (ekor)</label>
                        <input
                            type="number"
                            className="input"
                            value={tebarForm.jumlah}
                            onChange={(e) => setTebarForm({ ...tebarForm, jumlah: e.target.value })}
                            placeholder="Contoh: 1000"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Berat Rata-rata (gram/ekor)</label>
                        <input
                            type="number"
                            step="0.1"
                            className="input"
                            value={tebarForm.beratPerEkor}
                            onChange={(e) => setTebarForm({ ...tebarForm, beratPerEkor: e.target.value })}
                            placeholder="Default: 5"
                        />
                        <p className="form-hint">Biarkan 5g jika tidak ditimbang</p>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Harga Per Ekor <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rp</span>
                            <input
                                type="number"
                                className="input"
                                style={{ paddingLeft: '42px' }}
                                value={tebarForm.hargaPerEkor}
                                onChange={(e) => setTebarForm({ ...tebarForm, hargaPerEkor: e.target.value })}
                                placeholder="Contoh: 250"
                                required
                            />
                        </div>
                        <p className="form-hint">Harga pembelian bibit per ekor</p>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
