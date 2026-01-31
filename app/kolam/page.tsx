'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import { useState } from 'react';

import { PlusIcon, EditIcon, TrashIcon, EyeIcon, LoadingSpinner, ChevronLeftIcon, ChevronRightIcon, XIcon, CalendarIcon, DollarSignIcon, ScaleIcon, KolamIcon, FishIcon } from '../components/ui/Icons';
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

    const totalKolam = kolam.length;
    const kolamAktif = kolam.filter(k => k.jumlahIkan > 0).length;
    const totalIkan = kolam.reduce((sum, k) => sum + k.jumlahIkan, 0);

    // Calculate Total Estimasi Aset
    const totalEstimasiAset = kolam.reduce((sum, k) => {
        if (k.jumlahIkan === 0) return sum;
        const latestSampling = getLatestSampling(k.id);
        const growth = 2; // g/day
        let currentWeight = 0;
        const today = new Date();

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
        return sum + ((k.jumlahIkan * currentWeight / 1000) * hargaPasarPerKg);
    }, 0);

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 sm:gap-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Kolam</h1>
                        <p className="text-slate-500 text-sm">Kelola operasional dan status budidaya setiap kolam.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/pakan" className="btn btn-secondary text-sm">
                            🍚 Input Pakan
                        </Link>
                        <Link href="/kolam/tambah" className="btn btn-primary text-sm">
                            <PlusIcon /> Tambah Kolam
                        </Link>
                    </div>
                </div>

                {/* Summary KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Total Kolam */}
                    <div className="stat-card p-6 bg-white border border-slate-100 hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Kolam</p>
                                <p className="text-2xl font-bold text-slate-900">{totalKolam}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    <span className="text-emerald-600 font-semibold">{kolamAktif}</span> Aktif <span className="text-slate-300 mx-1">•</span> <span className="text-slate-400">{totalKolam - kolamAktif}</span> Kosong
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                                <KolamIcon />
                            </div>
                        </div>
                    </div>

                    {/* Total Populasi */}
                    <div className="stat-card p-6 bg-white border border-slate-100 hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Populasi Ikan</p>
                                <p className="text-2xl font-bold text-slate-900">{totalIkan.toLocaleString('id-ID')}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Total ekor di seluruh kolam
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 group-hover:bg-cyan-100 transition-colors">
                                <FishIcon />
                            </div>
                        </div>
                    </div>

                    {/* Estimasi Aset */}
                    <div className="stat-card p-6 bg-white border border-slate-100 hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Estimasi Nilai Aset</p>
                                <p className="text-2xl font-bold text-slate-900">Rp{totalEstimasiAset.toLocaleString('id-ID')}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Berdasarkan berat estimasi & harga pasar
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                💰
                            </div>
                        </div>
                    </div>
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
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                Siap Ditebar
                                                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold uppercase tracking-wider">
                                                    {kolam.filter(k => k.jumlahIkan === 0).length} Kolam
                                                </span>
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                            {kolam.filter(k => k.jumlahIkan === 0).map(k => (
                                                <div key={k.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                                                    <div className="flex items-center gap-4 mb-5">
                                                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-2xl group-hover:bg-teal-50 transition-colors">
                                                            🐟
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900">{k.nama}</h4>
                                                            <p className="text-xs text-slate-500 font-medium">
                                                                {k.panjang}x{k.lebar}m <span className="text-slate-300 mx-1">•</span> {k.kedalaman}m tgi
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleOpenTebar(k.id)}
                                                        className="btn btn-primary w-full shadow-sm active:scale-[0.98] py-2.5 text-sm"
                                                    >
                                                        <PlusIcon className="w-4 h-4" /> Mulai Siklus
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Active Ponds Grid */}
                                {kolam.filter(k => k.jumlahIkan > 0).length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                Kolam Aktif
                                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider">
                                                    {kolam.filter(k => k.jumlahIkan > 0).length} Kolam
                                                </span>
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
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
                                                    <div key={k.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                                                        {/* Header */}
                                                        <div className="flex items-center justify-between mb-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">
                                                                    🐟
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-bold text-lg text-slate-900">{k.nama}</h3>
                                                                    {k.tanggalTebar && (
                                                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                                                                            Ditebar {new Date(k.tanggalTebar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className={`badge ${badgeClass} border-none font-bold uppercase tracking-widest text-[10px]`}>
                                                                {statusLabels[displayStatus as keyof typeof statusLabels]}
                                                            </span>
                                                        </div>

                                                        {/* Stats Grid */}
                                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                                            {/* Populasi */}
                                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Populasi</p>
                                                                <p className="text-lg font-bold text-slate-900">{k.jumlahIkan.toLocaleString('id-ID')}<span className="text-[10px] font-normal text-slate-400 ml-1">ekor</span></p>
                                                            </div>

                                                            {/* Estimasi Aset */}
                                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nilai Aset</p>
                                                                <p className="text-lg font-bold text-slate-900">Rp{(estimasiAset / 1000).toFixed(0)}k</p>
                                                            </div>

                                                            {/* Dimensi */}
                                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Dimensi</p>
                                                                <p className="text-sm font-bold text-slate-900">{k.panjang}x{k.lebar}x{k.kedalaman}<span className="text-[10px] font-normal text-slate-400 ml-1">m</span></p>
                                                            </div>

                                                            {/* Volume */}
                                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Volume</p>
                                                                <p className="text-sm font-bold text-slate-900">{volume.toFixed(1)}<span className="text-[10px] font-normal text-slate-400 ml-1">m³</span></p>
                                                            </div>

                                                            {/* Feed Rec Box */}
                                                            {feedRec && (
                                                                <div className="col-span-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-100">
                                                                    <div className="flex items-center justify-between">
                                                                        <div>
                                                                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Rekomendasi Pakan</p>
                                                                            <p className="text-sm font-bold text-amber-900">{feedRec.amount} kg/hari <span className="text-xs font-normal text-amber-700 ml-1">({feedRec.type})</span></p>
                                                                        </div>
                                                                        <div className="bg-white/80 rounded-lg px-2 py-1">
                                                                            <p className="text-[10px] text-amber-600 font-bold uppercase">{feedRec.ratePercent}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex flex-col gap-2">
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <button
                                                                    onClick={() => handleOpenFeed(k.id)}
                                                                    className="btn btn-primary text-sm py-2.5"
                                                                >
                                                                    🍚 Pakan
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedKolamId(k.id);
                                                                        setIsPanenModalOpen(true);
                                                                    }}
                                                                    className="btn btn-success text-sm py-2.5 text-white"
                                                                >
                                                                    🌾 Panen
                                                                </button>
                                                            </div>
                                                            <div className="flex gap-2 mt-2 pt-4 border-t border-slate-50">
                                                                <Link
                                                                    href={`/kolam/${k.id}`}
                                                                    className="flex-1 btn btn-secondary text-xs uppercase font-bold tracking-wider py-2"
                                                                >
                                                                    <EyeIcon className="w-4 h-4" /> Detail
                                                                </Link>
                                                                <Link
                                                                    href={`/kolam/${k.id}/edit`}
                                                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                                    title="Edit Kolam"
                                                                >
                                                                    <EditIcon className="w-5 h-5" />
                                                                </Link>
                                                                <button
                                                                    onClick={() => setDeleteModal(k.id)}
                                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Hapus Kolam"
                                                                >
                                                                    <TrashIcon className="w-5 h-5" />
                                                                </button>
                                                            </div>
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
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kolam</th>
                                        <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Siklus</th>
                                        <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Periode</th>
                                        <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Selesai</th>
                                        <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Durasi</th>
                                        <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tebar</th>
                                        <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Panen</th>
                                        <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">FCR</th>
                                        <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">SR</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {getCycleHistoryForTable().length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="text-3xl">📋</span>
                                                    <p className="text-sm">Belum ada riwayat siklus yang selesai.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedHistory.map((cycle, idx) => {
                                            const kolamInfo = kolam.find(k => k.id === cycle.kolamId);
                                            const updateTime = cycle.lastInputTime ? new Date(cycle.lastInputTime) : new Date(cycle.startDate);

                                            return (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <span className="font-bold text-slate-900 block">{kolamInfo?.nama || 'Unknown'}</span>
                                                        {cycle.isActive && <span className="mt-1 badge badge-neutral badge-xs uppercase tracking-tighter text-[9px] font-bold">Aktif</span>}
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                                                            #{cycle.cycleNumber}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="text-xs font-semibold text-slate-700">
                                                            {new Date(cycle.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                            <span className="mx-1 text-slate-300">→</span>
                                                            {cycle.isActive ? 'Sekarang' : new Date(cycle.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 mt-0.5">{new Date(cycle.startDate).getFullYear()}</div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="text-xs font-medium text-slate-700">
                                                            {updateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                                            {updateTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className="text-xs font-bold text-slate-700">{cycle.totalDays}</span>
                                                        <span className="text-[10px] text-slate-400 ml-1">hari</span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className="text-xs font-bold text-slate-700">{cycle.initialFish.toLocaleString('id-ID')}</span>
                                                        <span className="text-[10px] text-slate-400 ml-1 block mt-0.5">ekor</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-xs">
                                                        <span className="font-bold text-slate-700">{cycle.finalFish.toLocaleString('id-ID')}</span>
                                                        <span className="text-[10px] text-slate-400 ml-1">ekor</span>
                                                        <span className="text-[10px] text-slate-500 block font-medium mt-0.5">{cycle.totalHarvestKg.toFixed(1)} kg</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${cycle.fcr <= 1.2 ? 'bg-emerald-100 text-emerald-700' : cycle.fcr <= 1.5 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                            {cycle.fcr.toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className={`text-xs font-bold ${cycle.sr >= 90 ? 'text-emerald-600' : cycle.sr >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                                                            {cycle.sr.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCycle(cycle);
                                                                setIsCycleModalOpen(true);
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors group-hover:scale-110"
                                                            title="Lihat Detail Siklus"
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
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tanggal</th>
                                        <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kolam</th>
                                        <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Tipe</th>
                                        <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Berat</th>
                                        <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Jumlah</th>
                                        <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Harga/Kg</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Total Pendapatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {riwayatPanen.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="text-3xl">🌾</span>
                                                    <p className="text-sm">Belum ada data panen.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        [...riwayatPanen].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).map((p) => {
                                            const kolamName = kolam.find(k => k.id === p.kolamId)?.nama || 'Unknown';
                                            const totalPendapatan = p.beratTotalKg * p.hargaPerKg;
                                            return (
                                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs font-bold text-slate-700">
                                                            {new Date(p.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-tighter font-medium">
                                                            {new Date(p.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className="text-sm font-bold text-slate-900">{kolamName}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${p.tipe === 'TOTAL' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                            {p.tipe}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <span className="text-xs font-bold text-slate-700">{p.beratTotalKg.toLocaleString('id-ID')}</span>
                                                        <span className="text-[10px] text-slate-400 ml-1">kg</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <span className="text-xs font-bold text-slate-700">{p.jumlahEkor.toLocaleString('id-ID')}</span>
                                                        <span className="text-[10px] text-slate-400 ml-1">ekor</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <span className="text-[10px] text-slate-400 mr-1">Rp</span>
                                                        <span className="text-xs font-bold text-slate-700">{p.hargaPerKg.toLocaleString('id-ID')}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-sm font-bold text-emerald-600">
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
                        <div className="p-5 bg-slate-50 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-slate-100">
                                    🐟
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 leading-tight">
                                        {kolam.find(k => k.id === selectedCycle.kolamId)?.nama}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                                        <span className="flex items-center gap-1.5">
                                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                                            {new Date(selectedCycle.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                            <span className="text-slate-300">→</span>
                                            {selectedCycle.isActive
                                                ? 'Sekarang'
                                                : new Date(selectedCycle.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                                            }
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                                            {selectedCycle.totalDays} Hari
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-left md:text-right bg-white p-3 md:p-0 rounded-xl md:rounded-none border border-slate-200 md:border-0 w-full md:w-auto">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Profit Bersih</p>
                                <p className={`text-2xl font-black ${selectedCycle.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {selectedCycle.netProfit >= 0 ? '+' : ''}Rp{Math.abs(selectedCycle.netProfit).toLocaleString('id-ID')}
                                </p>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-4 border border-slate-100 rounded-2xl bg-white shadow-sm hover:border-teal-100 transition-colors">
                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                    <ScaleIcon className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">FCR</span>
                                </div>
                                <p className={`text-xl font-bold ${selectedCycle.fcr <= 1.2 ? 'text-emerald-600' : selectedCycle.fcr <= 1.5 ? 'text-amber-600' : 'text-red-500'}`}>
                                    {selectedCycle.fcr.toFixed(2)}
                                </p>
                            </div>
                            <div className="p-4 border border-slate-100 rounded-2xl bg-white shadow-sm hover:border-teal-100 transition-colors">
                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Surv. Rate</span>
                                </div>
                                <p className={`text-xl font-bold ${selectedCycle.sr >= 90 ? 'text-emerald-600' : selectedCycle.sr >= 80 ? 'text-amber-600' : 'text-red-500'}`}>
                                    {selectedCycle.sr.toFixed(1)}%
                                </p>
                            </div>
                            <div className="p-4 border border-slate-100 rounded-2xl bg-white shadow-sm hover:border-teal-100 transition-colors">
                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Panen Total</span>
                                </div>
                                <p className="text-xl font-bold text-slate-900">
                                    {selectedCycle.totalHarvestKg.toFixed(1)} <span className="text-xs font-normal text-slate-400">kg</span>
                                </p>
                            </div>
                            <div className="p-4 border border-slate-100 rounded-2xl bg-white shadow-sm hover:border-teal-100 transition-colors">
                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Avg Price</span>
                                </div>
                                <p className="text-xl font-bold text-slate-900 whitespace-nowrap">
                                    <span className="text-xs font-normal text-slate-400 mr-1">Rp</span>
                                    {selectedCycle.totalHarvestKg > 0 ? (selectedCycle.totalHarvestRevenue / selectedCycle.totalHarvestKg).toLocaleString('id-ID', { maximumFractionDigits: 0 }) : 0}
                                </p>
                            </div>
                        </div>

                        {/* Two Column Layout for Details */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Financial Breakdown */}
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Rincian Keuangan</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 font-medium">Pendapatan Panen</span>
                                        <span className="font-bold text-slate-900">Rp{selectedCycle.totalHarvestRevenue.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 font-medium">Biaya Pakan ({selectedCycle.totalFeedKg.toFixed(1)} kg)</span>
                                        <span className="font-bold text-red-600">-Rp{selectedCycle.totalFeedCost.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 font-medium">Biaya Operasional</span>
                                        <span className="font-bold text-red-600">-Rp{selectedCycle.totalExpenses.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="border-t border-slate-200 mt-4 pt-4 flex justify-between items-baseline">
                                        <span className="font-bold text-slate-900 uppercase tracking-widest text-[10px]">Net Profit</span>
                                        <span className={`text-xl font-black ${selectedCycle.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            Rp{selectedCycle.netProfit.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Biological Breakdown */}
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Data Populasi</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">
                                                IN
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tebar Awal</p>
                                                <p className="text-sm font-bold text-slate-900">{selectedCycle.initialFish.toLocaleString('id-ID')} ekor</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Berat Tebar</p>
                                            <p className="text-sm font-bold text-slate-900">5g<span className="text-[10px] font-normal ml-0.5">/ekor</span></p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-sm font-bold">
                                                OUT
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Panen Akhir</p>
                                                <p className="text-sm font-bold text-slate-900">{selectedCycle.finalFish.toLocaleString('id-ID')} ekor</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Berat Panen</p>
                                            <p className="text-sm font-bold text-slate-900">{(selectedCycle.totalHarvestKg * 1000 / selectedCycle.finalFish).toFixed(0)}g<span className="text-[10px] font-normal ml-0.5">/ekor</span></p>
                                        </div>
                                    </div>
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
