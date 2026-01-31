'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import { useState } from 'react';

import { PlusIcon, EditIcon, TrashIcon, EyeIcon, LoadingSpinner, ChevronLeftIcon, ChevronRightIcon, XIcon, CalendarIcon, DollarSignIcon, ScaleIcon } from '../components/ui/Icons';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal'; import PanenModal from '../components/modals/PanenModal'; import { useToast } from '../context/ToastContext'; // Import Toast
import { TipePembeli, CycleSummary } from '../context/AppContext';

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
        hargaPasarPerKg, getCycleHistory, riwayatPanen
    } = useApp();
    const { showToast } = useToast();
    const [deleteModal, setDeleteModal] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'status' | 'riwayat' | 'panen'>('status');

    // Cycle History Pagination & Modal State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedCycle, setSelectedCycle] = useState<CycleSummary | null>(null);
    const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);

    // Helper to get all cycle history sorted by date
    const getCycleHistoryForTable = () => {
        return kolam
            .flatMap(k => getCycleHistory(k.id))
            .filter(c => !c.isActive) // Filter out active cycles
            .sort((a, b) => {
                // Primary: Start Date (Newest first)
                const dateA = new Date(a.startDate).getTime();
                const dateB = new Date(b.startDate).getTime();
                if (dateB !== dateA) return dateB - dateA;

                // Secondary: Last Input Time (Newest input first)
                const timeA = a.lastInputTime ? new Date(a.lastInputTime).getTime() : dateA;
                const timeB = b.lastInputTime ? new Date(b.lastInputTime).getTime() : dateB;
                return timeB - timeA;
            });
    };

    const paginatedHistory = getCycleHistoryForTable().slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(getCycleHistoryForTable().length / itemsPerPage);

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
    const [selectedKolamId, setSelectedKolamId] = useState<string>('');

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
        if (isSubmitting) return;

        setIsSubmitting(true);
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
        } finally {
            setIsSubmitting(false);
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
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            addPakan({
                kolamId: feedForm.kolamId,
                tanggal: feedForm.tanggal,
                jumlahKg: parseFloat(feedForm.jumlahKg),
                jenisPakan: feedForm.jenisPakan || 'Pelet Hi-Pro',
            });

            showToast('Pemberian pakan berhasil dicatat', 'success');
            setIsFeedModalOpen(false);
        } finally {
            setIsSubmitting(false);
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

                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab('status')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'status'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Status Kolam
                    </button>
                    <button
                        onClick={() => setActiveTab('riwayat')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'riwayat'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Riwayat Siklus
                    </button>
                    <button
                        onClick={() => setActiveTab('panen')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'panen'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Riwayat Panen
                    </button>
                </div>

                {/* Status Tab Content */}
                {activeTab === 'status' && (
                    <>
                        {kolam.length === 0 ? (
                            <EmptyState
                                title="Belum Ada Kolam"
                                description="Mulai dengan menambahkan kolam pertama Anda"
                                icon="🐟"
                                action={{ label: "Tambah Kolam Baru", href: "/kolam/tambah" }}
                            />
                        ) : (
                            <div className="space-y-8">
                                {/* Siap Tebar Section */}
                                {kolam.filter(k => k.jumlahIkan === 0).length > 0 && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            Siap Ditebar
                                            <span className="badge bg-orange-500 text-white border-none badge-sm font-medium">
                                                {kolam.filter(k => k.jumlahIkan === 0).length}
                                            </span>
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {kolam.filter(k => k.jumlahIkan === 0).map(k => (
                                                <div key={k.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-2xl">
                                                            🐟
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-800">{k.nama}</h4>
                                                            <p className="text-xs text-slate-500 font-medium">
                                                                {k.panjang}x{k.lebar}m <span className="text-slate-300">•</span> {k.kedalaman}m tinggi
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleOpenTebar(k.id)}
                                                        className="btn btn-primary w-full shadow-sm shadow-emerald-200 active:scale-[0.98]"
                                                    >
                                                        <span className="text-lg mr-1">+</span> Mulai Siklus
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Active Ponds Grid */}
                                {kolam.filter(k => k.jumlahIkan > 0).length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            Kolam Aktif
                                            <span className="badge bg-blue-500 text-white border-none badge-sm font-medium">
                                                {kolam.filter(k => k.jumlahIkan > 0).length}
                                            </span>
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                                            {kolam.filter(k => k.jumlahIkan > 0).map(k => {
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
                                                                            setSelectedKolamId(k.id);
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
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* History Tab Content */}
                {activeTab === 'riwayat' && (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="table w-full">
                                <thead>
                                    <tr>
                                        <th>Kolam</th>
                                        <th>Siklus</th>
                                        <th>Periode</th>
                                        <th>Selesai</th>
                                        <th>Durasi</th>
                                        <th>Tebar</th>
                                        <th>Panen</th>
                                        <th>FCR</th>
                                        <th>SR</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getCycleHistoryForTable().length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="text-center py-8 text-slate-400">
                                                Belum ada riwayat siklus yang selesai.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedHistory.map((cycle, idx) => {
                                            const kolamInfo = kolam.find(k => k.id === cycle.kolamId);
                                            const updateTime = cycle.lastInputTime ? new Date(cycle.lastInputTime) : new Date(cycle.startDate);

                                            return (
                                                <tr key={idx} className={cycle.isActive ? 'bg-slate-50' : ''}>
                                                    <td className="font-medium text-slate-900">
                                                        {kolamInfo?.nama || 'Unknown'}
                                                        {cycle.isActive && <span className="ml-2 badge badge-xs badge-neutral">Aktif</span>}
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-sm badge-ghost font-medium">#{cycle.cycleNumber}</span>
                                                    </td>
                                                    <td className="text-slate-500">
                                                        {new Date(cycle.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                        {' - '}
                                                        {cycle.isActive ? 'Sekarang' : new Date(cycle.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                    </td>
                                                    <td className="text-slate-500 text-xs">
                                                        <div className="font-medium text-slate-700">
                                                            {updateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                        <div className="text-[10px]">
                                                            {updateTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                        </div>
                                                    </td>
                                                    <td className="text-slate-600">{cycle.totalDays} hari</td>
                                                    <td className="text-slate-600">{cycle.initialFish.toLocaleString()} ekor</td>
                                                    <td className="text-slate-600">
                                                        {cycle.finalFish.toLocaleString()} ekor
                                                        <span className="text-xs text-slate-400 block">{cycle.totalHarvestKg.toFixed(1)} kg</span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge badge-sm ${cycle.fcr <= 1.2 ? 'badge-success' : cycle.fcr <= 1.5 ? 'badge-warning' : 'badge-danger'}`}>
                                                            {cycle.fcr.toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`font-medium ${cycle.sr >= 90 ? 'text-green-600' : cycle.sr >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                                                            {cycle.sr.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCycle(cycle);
                                                                setIsCycleModalOpen(true);
                                                            }}
                                                            className="btn btn-sm btn-ghost text-slate-500 hover:text-primary-600"
                                                        >
                                                            <EyeIcon className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
                                <div className="text-sm text-slate-500">
                                    Halaman <span className="font-medium">{currentPage}</span> dari <span className="font-medium">{totalPages}</span>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent"
                                    >
                                        <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent"
                                    >
                                        <ChevronRightIcon className="w-5 h-5 text-slate-600" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Harvest History Tab Content */}
                {activeTab === 'panen' && (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="table w-full">
                                <thead>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>Kolam</th>
                                        <th>Tipe</th>
                                        <th className="text-right">Berat (Kg)</th>
                                        <th className="text-right">Jumlah (Ekor)</th>
                                        <th className="text-right">Harga/Kg</th>
                                        <th className="text-right">Total Pendapatan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {riwayatPanen.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-8 text-slate-400">
                                                Belum ada data panen.
                                            </td>
                                        </tr>
                                    ) : (
                                        [...riwayatPanen].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).map((p) => {
                                            const kolamName = kolam.find(k => k.id === p.kolamId)?.nama || 'Unknown';
                                            const totalPendapatan = p.beratTotalKg * p.hargaPerKg;
                                            return (
                                                <tr key={p.id} className="hover:bg-slate-50">
                                                    <td className="text-slate-500">
                                                        {new Date(p.tanggal).toLocaleDateString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                        <div className="text-[10px] text-slate-400">
                                                            {new Date(p.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </td>
                                                    <td className="font-medium text-slate-900">{kolamName}</td>
                                                    <td>
                                                        <span className={`badge badge-sm ${p.tipe === 'TOTAL' ? 'badge-primary' : 'badge-ghost'}`}>
                                                            {p.tipe}
                                                        </span>
                                                    </td>
                                                    <td className="text-right text-slate-700">{p.beratTotalKg.toLocaleString('id-ID')}</td>
                                                    <td className="text-right text-slate-700">{p.jumlahEkor.toLocaleString('id-ID')}</td>
                                                    <td className="text-right text-slate-700">Rp{p.hargaPerKg.toLocaleString('id-ID')}</td>
                                                    <td className="text-right">
                                                        <span className="font-medium text-green-600">
                                                            Rp{totalPendapatan.toLocaleString('id-ID')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Cycle Modal */}
            <Modal
                isOpen={isCycleModalOpen}
                onClose={() => setIsCycleModalOpen(false)}
                title="Detail Siklus Kolam"
                size="lg"
            >
                {selectedCycle && (
                    <div className="space-y-6">
                        {/* Header Summary */}
                        <div className="p-4 bg-slate-50 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    {kolam.find(k => k.id === selectedCycle.kolamId)?.nama}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                    <CalendarIcon className="w-4 h-4" />
                                    <span>
                                        {new Date(selectedCycle.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        {' - '}
                                        {selectedCycle.isActive
                                            ? 'Sekarang'
                                            : new Date(selectedCycle.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                        }
                                    </span>
                                    <span className="bg-slate-200 px-2 py-0.5 rounded-full text-xs font-medium text-slate-600">
                                        {selectedCycle.totalDays} Hari
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-500 mb-1">Profit Bersih</p>
                                <p className={`text-2xl font-bold ${selectedCycle.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {selectedCycle.netProfit >= 0 ? '+' : ''}Rp{Math.abs(selectedCycle.netProfit).toLocaleString('id-ID')}
                                </p>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm">
                                <div className="flex items-center gap-2 text-slate-500 mb-2">
                                    <ScaleIcon className="w-4 h-4" />
                                    <span className="text-xs font-semibold uppercase">FCR</span>
                                </div>
                                <p className={`text-xl font-bold ${selectedCycle.fcr <= 1.2 ? 'text-emerald-600' : selectedCycle.fcr <= 1.5 ? 'text-amber-600' : 'text-red-500'}`}>
                                    {selectedCycle.fcr.toFixed(2)}
                                </p>
                            </div>
                            <div className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm">
                                <div className="flex items-center gap-2 text-slate-500 mb-2">
                                    <span className="text-xs font-semibold uppercase">Surv. Rate</span>
                                </div>
                                <p className={`text-xl font-bold ${selectedCycle.sr >= 90 ? 'text-emerald-600' : selectedCycle.sr >= 80 ? 'text-amber-600' : 'text-red-500'}`}>
                                    {selectedCycle.sr.toFixed(1)}%
                                </p>
                            </div>
                            <div className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm">
                                <div className="flex items-center gap-2 text-slate-500 mb-2">
                                    <span className="text-xs font-semibold uppercase">Panen Total</span>
                                </div>
                                <p className="text-xl font-bold text-slate-900">
                                    {selectedCycle.totalHarvestKg.toFixed(1)} <span className="text-sm font-normal text-slate-500">kg</span>
                                </p>
                            </div>
                            <div className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm">
                                <div className="flex items-center gap-2 text-slate-500 mb-2">
                                    <span className="text-xs font-semibold uppercase">Harga Rata-rata</span>
                                </div>
                                <p className="text-xl font-bold text-slate-900">
                                    Rp{selectedCycle.totalHarvestKg > 0 ? (selectedCycle.totalHarvestRevenue / selectedCycle.totalHarvestKg).toLocaleString('id-ID', { maximumFractionDigits: 0 }) : 0}
                                </p>
                            </div>
                        </div>

                        {/* Financial Breakdown */}
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3">Rincian Keuangan</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-600">Total Pendapatan Panen</span>
                                    <span className="font-semibold text-slate-900">Rp{selectedCycle.totalHarvestRevenue.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                                    <span className="text-red-700">Biaya Pakan ({selectedCycle.totalFeedKg.toFixed(1)} kg)</span>
                                    <span className="font-semibold text-red-700">-Rp{selectedCycle.totalFeedCost.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                                    <span className="text-red-700">Biaya Operasional Lain</span>
                                    <span className="font-semibold text-red-700">-Rp{selectedCycle.totalExpenses.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="border-t border-slate-200 my-2 pt-2 flex justify-between items-center">
                                    <span className="font-bold text-slate-900">Net Profit</span>
                                    <span className={`font-bold ${selectedCycle.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        Rp{selectedCycle.netProfit.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Biological Breakdown */}
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3">Data Populasi</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <span className="block text-slate-500 mb-1">Tebar Awal</span>
                                    <span className="font-semibold text-slate-900">{selectedCycle.initialFish.toLocaleString()} ekor</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <span className="block text-slate-500 mb-1">Panen Akhir</span>
                                    <span className="font-semibold text-slate-900">{selectedCycle.finalFish.toLocaleString()} ekor</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

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
                        <button type="button" onClick={() => setIsFeedModalOpen(false)} className="btn btn-secondary" disabled={isSubmitting}>Batal</button>
                        <button type="submit" form="feed-form" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? <LoadingSpinner className="w-5 h-5" /> : 'Simpan'}
                        </button>
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
            <PanenModal
                isOpen={isPanenModalOpen}
                onClose={() => setIsPanenModalOpen(false)}
                defaultKolamId={selectedKolamId}
            />
            {/* TEBAR MODAL */}
            <Modal
                isOpen={isTebarModalOpen}
                onClose={() => setIsTebarModalOpen(false)}
                title="Tebar Bibit Baru"
                footer={
                    <>
                        <button type="button" onClick={() => setIsTebarModalOpen(false)} className="btn btn-secondary" disabled={isSubmitting}>Batal</button>
                        <button type="submit" form="tebar-form" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? <LoadingSpinner className="w-5 h-5" /> : 'Simpan'}
                        </button>
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
