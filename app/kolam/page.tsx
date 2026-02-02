'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import { useState } from 'react';

import { Plus, Edit, Trash2, Eye, Loader2, ChevronLeft, ChevronRight, X, Calendar, DollarSign, Scale, Box, Fish, Container, Banknote, ShoppingCart, ClipboardList, AlertTriangle } from 'lucide-react';
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

    // Format currency: convert to "jt" if >= 1,000,000, else "k" if >= 1,000
    const formatCurrency = (value: number) => {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'jt';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'k';
        }
        return value.toLocaleString('id-ID');
    };

    // Calculate Total Estimasi Aset
    const totalEstimasiAset = kolam.reduce((sum, k) => {
        if (k.jumlahIkan === 0) return sum;
        const latestSampling = getLatestSampling(k.id);
        const GROWTH_RATE_PER_DAY_GRAMS = 2;
        let currentWeight = 0;
        const today = new Date();

        if (latestSampling && latestSampling.jumlahIkanPerKg > 0) {
            let baseWeightGram = 0;
            if (latestSampling.bobotGram) {
                baseWeightGram = latestSampling.bobotGram;
            } else {
                baseWeightGram = 1000 / latestSampling.jumlahIkanPerKg;
            }
            const samplingDate = new Date(latestSampling.tanggal);
            const daysSinceSampling = Math.max(0, Math.floor((today.getTime() - samplingDate.getTime()) / (1000 * 60 * 60 * 24)));
            currentWeight = baseWeightGram + (daysSinceSampling * GROWTH_RATE_PER_DAY_GRAMS);
        } else {
            const tebarDate = k.tanggalTebar ? new Date(k.tanggalTebar) : new Date();
            const daysPassed = Math.max(0, Math.floor((today.getTime() - tebarDate.getTime()) / (1000 * 60 * 60 * 24)));
            currentWeight = 5 + (daysPassed * GROWTH_RATE_PER_DAY_GRAMS);
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
                            <Container className="w-4 h-4" /> Input Pakan
                        </Link>
                        <Link href="/kolam/tambah" className="btn btn-primary text-sm">
                            <Plus className="w-4 h-4" /> Tambah Kolam
                        </Link>
                    </div>
                </div>

                {/* Summary KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {/* Total Kolam */}
                    <div className="w-full p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Box className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Kolam</p>
                        </div>
                        <h5 className="mb-2 text-2xl font-semibold tracking-tight text-slate-900">{totalKolam}</h5>
                        <p className="mb-3 text-sm text-slate-600">
                            <span className="text-emerald-600 font-semibold">{kolamAktif}</span> Aktif <span className="text-slate-300 mx-1">•</span> <span className="text-slate-400">{totalKolam - kolamAktif}</span> Kosong
                        </p>
                        <Link href="/kolam" className="inline-flex font-medium items-center text-blue-600 hover:underline text-sm">
                            Lihat Detail
                            <svg className="w-3 h-3 ms-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </Link>
                    </div>

                    {/* Total Populasi */}
                    <div className="w-full p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
                                <Fish className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Populasi</p>
                        </div>
                        <h5 className="mb-2 text-2xl font-semibold tracking-tight text-slate-900">{totalIkan.toLocaleString('id-ID')} <span className="text-sm font-normal text-slate-500">ekor</span></h5>
                        <p className="mb-3 text-sm text-slate-600">
                            Tersebar di {kolamAktif} kolam aktif
                        </p>
                        <Link href="/kolam" className="inline-flex font-medium items-center text-blue-600 hover:underline text-sm">
                            Detail
                            <svg className="w-3 h-3 ms-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </Link>
                    </div>

                    {/* Estimasi Aset */}
                    <div className="w-full p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <Banknote className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Estimasi Aset</p>
                        </div>
                        <h5 className="mb-2 text-2xl font-semibold tracking-tight text-slate-900">Rp {formatCurrency(totalEstimasiAset)}</h5>
                        <p className="mb-3 text-sm text-slate-600">
                            Berdasarkan berat estimasi & harga pasar saat ini
                        </p>
                        <Link href="/keuangan" className="inline-flex font-medium items-center text-blue-600 hover:underline text-sm">
                            Lihat Rincian
                            <svg className="w-3 h-3 ms-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </Link>
                    </div>

                    {/* Pakan Hari Ini */}
                    <div className="w-full p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                <Container className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pakan Hari Ini</p>
                        </div>
                        <h5 className="mb-2 text-2xl font-semibold tracking-tight text-slate-900">0.0 <span className="text-sm font-normal text-slate-500">kg</span></h5>
                        <p className="mb-3 text-sm text-slate-600">
                            Total pakan yang diberikan hari ini
                        </p>
                        <Link href="/pakan" className="inline-flex font-medium items-center text-blue-600 hover:underline text-sm">
                            Input Pakan
                            <svg className="w-3 h-3 ms-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </Link>
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
                                icon={<Fish className="w-12 h-12 text-slate-300" />}
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
                                                <div key={k.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 group">
                                                    <div className="flex items-center gap-4 mb-5">
                                                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-teal-600 group-hover:bg-teal-50 transition-colors">
                                                            <Fish className="w-6 h-6" />
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
                                                        <Plus className="w-4 h-4" /> Mulai Siklus
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
                                                    const GROWTH_RATE_PER_DAY_GRAMS = 2;

                                                    if (latestSampling && latestSampling.jumlahIkanPerKg > 0) {
                                                        let baseWeightGram = 0;
                                                        if (latestSampling.bobotGram) {
                                                            baseWeightGram = latestSampling.bobotGram;
                                                        } else {
                                                            baseWeightGram = 1000 / latestSampling.jumlahIkanPerKg;
                                                        }
                                                        const samplingDate = new Date(latestSampling.tanggal);
                                                        const daysSinceSampling = Math.max(0, Math.floor((today.getTime() - samplingDate.getTime()) / (1000 * 60 * 60 * 24)));
                                                        currentWeight = baseWeightGram + (daysSinceSampling * GROWTH_RATE_PER_DAY_GRAMS);
                                                    } else {
                                                        const tebarDate = k.tanggalTebar ? new Date(k.tanggalTebar) : new Date();
                                                        const daysPassed = Math.max(0, Math.floor((today.getTime() - tebarDate.getTime()) / (1000 * 60 * 60 * 24)));
                                                        currentWeight = 5 + (daysPassed * GROWTH_RATE_PER_DAY_GRAMS);
                                                    }
                                                    const totalBiomass = (k.jumlahIkan * currentWeight) / 1000;
                                                    feedRec = getFeedRecommendation(currentWeight, totalBiomass);
                                                }

                                                // Estimasi Aset per kolam
                                                const estimasiAset = isEmpty ? 0 : (k.jumlahIkan * currentWeight / 1000) * hargaPasarPerKg;

                                                return (
                                                    <div key={k.id} className="w-full p-4 sm:p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                                                        {/* Header */}
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                                                    <Fish className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <h5 className="text-base md:text-lg font-semibold text-slate-900">{k.nama}</h5>
                                                                    {k.tanggalTebar && (
                                                                        <p className="text-sm text-slate-500">
                                                                            Ditebar {new Date(k.tanggalTebar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className={`badge ${badgeClass} border-none text-xs font-medium px-1.5 py-0.5`}>
                                                                {statusLabels[displayStatus as keyof typeof statusLabels]}
                                                            </span>
                                                        </div>

                                                        {/* Stats List */}
                                                        <ul className="my-4 space-y-3">
                                                            {/* Populasi & Nilai Aset - Side by Side */}
                                                            <li className="grid grid-cols-2 gap-2">
                                                                <div className="flex items-center p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                                                                    <div className="flex-1">
                                                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Populasi</p>
                                                                        <p className="text-base font-semibold text-slate-900 mt-1">{k.jumlahIkan.toLocaleString('id-ID')} <span className="text-sm font-normal text-slate-500">ekor</span></p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                                                                    <div className="flex-1">
                                                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nilai Aset</p>
                                                                        <p className="text-base font-semibold text-slate-900 mt-1">Rp{formatCurrency(estimasiAset)}</p>
                                                                    </div>
                                                                </div>
                                                            </li>

                                                            {/* Dimensi & Volume */}
                                                            <li>
                                                                <div className="flex items-center p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                                                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                                                        <div>
                                                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Dimensi</p>
                                                                            <p className="text-base font-semibold text-slate-900 mt-1">{k.panjang}x{k.lebar}x{k.kedalaman}<span className="text-xs font-normal text-slate-500 ml-1">m</span></p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Volume</p>
                                                                            <p className="text-base font-semibold text-slate-900 mt-1">{volume.toFixed(1)}<span className="text-xs font-normal text-slate-500 ml-1">m³</span></p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </li>

                                                            {/* Feed Rec Box */}
                                                            {feedRec && (
                                                                <li>
                                                                    <div className="flex items-center p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 hover:from-amber-100 hover:to-orange-100 transition-colors">
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center justify-between">
                                                                                <div>
                                                                                    <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">Rekomendasi Pakan</p>
                                                                                    <p className="text-base font-semibold text-amber-900 mt-1">{feedRec.amount} kg/hari <span className="text-xs font-normal text-amber-700">({feedRec.type})</span></p>
                                                                                </div>
                                                                                <span className="bg-amber-100 border border-amber-200 text-amber-700 text-xs font-medium px-1.5 py-0.5 rounded-sm">{feedRec.ratePercent}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </li>
                                                            )}
                                                        </ul>

                                                        {/* Action Buttons */}
                                                        <div className="space-y-2">
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <button
                                                                    onClick={() => handleOpenFeed(k.id)}
                                                                    className="inline-flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 box-border border border-transparent focus:ring-4 focus:ring-blue-300 shadow-xs font-medium leading-5 rounded-lg text-sm px-4 py-2.5 focus:outline-none"
                                                                >
                                                                    <Container className="w-4 h-4 me-1.5 -ms-0.5" /> Pakan
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedKolamId(k.id);
                                                                        setIsPanenModalOpen(true);
                                                                    }}
                                                                    className="inline-flex items-center justify-center text-white bg-emerald-600 hover:bg-emerald-700 box-border border border-transparent focus:ring-4 focus:ring-emerald-300 shadow-xs font-medium leading-5 rounded-lg text-sm px-4 py-2.5 focus:outline-none"
                                                                >
                                                                    <ShoppingCart className="w-4 h-4 me-1.5 -ms-0.5" /> Panen
                                                                </button>
                                                            </div>
                                                            <div className="flex gap-2 pt-2 border-t border-slate-100">
                                                                <Link
                                                                    href={`/kolam/${k.id}`}
                                                                    className="flex-1 inline-flex items-center justify-center text-sm text-slate-600 hover:underline font-medium tracking-normal"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5 me-1.5" /> Lihat Detail
                                                                </Link>
                                                                <Link
                                                                    href={`/kolam/${k.id}/edit`}
                                                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                                    title="Edit Kolam"
                                                                >
                                                                    <Edit className="w-5 h-5" />
                                                                </Link>
                                                                <button
                                                                    onClick={() => setDeleteModal(k.id)}
                                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Hapus Kolam"
                                                                >
                                                                    <Trash2 className="w-5 h-5" />
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
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th scope="col" className="p-4">
                                        <div className="flex items-center">
                                            <input id="kolam-siklus-checkbox-header" type="checkbox" className="w-4 h-4 border border-default-medium rounded bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                                            <label htmlFor="kolam-siklus-checkbox-header" className="sr-only">Select all</label>
                                        </div>
                                    </th>
                                    <th>Kolam</th>
                                    <th className="text-center">Siklus</th>
                                    <th>Periode</th>
                                    <th>Selesai</th>
                                    <th>Durasi</th>
                                    <th>Tebar</th>
                                    <th>Panen</th>
                                    <th className="text-center">FCR</th>
                                    <th className="text-center">SR</th>
                                    <th className="text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getCycleHistoryForTable().length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="table-empty">
                                            <div className="flex flex-col items-center gap-2">
                                                <ClipboardList className="w-12 h-12" />
                                                <p className="text-sm">Belum ada riwayat siklus yang selesai.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedHistory.map((cycle, idx) => {
                                        const kolamInfo = kolam.find(k => k.id === cycle.kolamId);
                                        const updateTime = cycle.lastInputTime ? new Date(cycle.lastInputTime) : new Date(cycle.startDate);

                                        return (
                                            <tr key={idx}>
                                                <td className="w-4 p-4">
                                                    <div className="flex items-center">
                                                        <input id={`kolam-siklus-checkbox-${idx}`} type="checkbox" className="w-4 h-4 border border-default-medium rounded bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                                                        <label htmlFor={`kolam-siklus-checkbox-${idx}`} className="sr-only">Checkbox</label>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="font-bold text-heading block">{kolamInfo?.nama || 'Unknown'}</span>
                                                    {cycle.isActive && <span className="mt-1 badge badge-neutral badge-xs uppercase tracking-tighter text-[9px] font-bold">Aktif</span>}
                                                </td>
                                                <td className="text-center">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                                                        #{cycle.cycleNumber}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="text-xs font-semibold text-body">
                                                        {new Date(cycle.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                        <span className="mx-1 text-slate-300">→</span>
                                                        {cycle.isActive ? 'Sekarang' : new Date(cycle.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">{new Date(cycle.startDate).getFullYear()}</div>
                                                </td>
                                                <td>
                                                    <div className="text-xs font-medium text-body">
                                                        {updateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                                        {updateTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="text-xs font-bold text-body">{cycle.totalDays}</span>
                                                    <span className="text-[10px] text-slate-400 ml-1">hari</span>
                                                </td>
                                                <td>
                                                    <span className="text-xs font-bold text-body">{cycle.initialFish.toLocaleString('id-ID')}</span>
                                                    <span className="text-[10px] text-slate-400 ml-1 block mt-0.5">ekor</span>
                                                </td>
                                                <td className="text-xs">
                                                    <span className="font-bold text-body">{cycle.finalFish.toLocaleString('id-ID')}</span>
                                                    <span className="text-[10px] text-slate-400 ml-1">ekor</span>
                                                    <span className="text-[10px] text-slate-500 block font-medium mt-0.5">{cycle.totalHarvestKg.toFixed(1)} kg</span>
                                                </td>
                                                <td className="text-center">
                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${cycle.fcr <= 1.2 ? 'bg-emerald-100 text-emerald-700' : cycle.fcr <= 1.5 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                        {cycle.fcr.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <span className={`text-xs font-bold ${cycle.sr >= 90 ? 'text-emerald-600' : cycle.sr >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                                                        {cycle.sr.toFixed(1)}%
                                                    </span>
                                                    </td>
                                                    <td className="text-right">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCycle(cycle);
                                                                setIsCycleModalOpen(true);
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors group-hover:scale-110"
                                                            title="Lihat Detail Siklus"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>

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
                                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent"
                                    >
                                        <ChevronRight className="w-5 h-5 text-slate-600" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Harvest History Tab Content */}
                {activeTab === 'panen' && (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th scope="col" className="p-4">
                                        <input id="kolam-panen-checkbox-header" type="checkbox" className="w-4 h-4 border border-default-medium rounded bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                                        <label htmlFor="kolam-panen-checkbox-header" className="sr-only">Select all</label>
                                    </th>
                                    <th>Tanggal</th>
                                    <th>Kolam</th>
                                    <th className="text-center">Tipe</th>
                                    <th className="text-right">Berat</th>
                                    <th className="text-right">Jumlah</th>
                                    <th className="text-right">Harga/Kg</th>
                                    <th className="text-right">Total Pendapatan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {riwayatPanen.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="table-empty">
                                            <div className="flex flex-col items-center gap-2">
                                                <ShoppingCart className="w-12 h-12" />
                                                <p className="text-sm">Belum ada data panen.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    [...riwayatPanen].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).map((p) => {
                                        const kolamName = kolam.find(k => k.id === p.kolamId)?.nama || 'Unknown';
                                        const totalPendapatan = p.beratTotalKg * p.hargaPerKg;
                                        return (
                                            <tr key={p.id}>
                                                <td className="w-4 p-4">
                                                    <input id={`kolam-panen-checkbox-${p.id}`} type="checkbox" className="w-4 h-4 border border-default-medium rounded bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                                                    <label htmlFor={`kolam-panen-checkbox-${p.id}`} className="sr-only">Select row</label>
                                                </td>
                                                <td>
                                                    <div className="text-xs font-bold text-body">
                                                        {new Date(p.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-tighter font-medium">
                                                        {new Date(p.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="text-sm font-bold text-heading">{kolamName}</span>
                                                </td>
                                                <td className="text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${p.tipe === 'TOTAL' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                        {p.tipe}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <span className="text-xs font-bold text-body">{p.beratTotalKg.toLocaleString('id-ID')}</span>
                                                    <span className="text-[10px] text-slate-400 ml-1">kg</span>
                                                </td>
                                                <td className="text-right">
                                                    <span className="text-xs font-bold text-body">{p.jumlahEkor.toLocaleString('id-ID')}</span>
                                                    <span className="text-[10px] text-slate-400 ml-1">ekor</span>
                                                </td>
                                                <td className="text-right">
                                                    <span className="text-[10px] text-slate-400 mr-1">Rp</span>
                                                    <span className="text-xs font-bold text-body">{p.hargaPerKg.toLocaleString('id-ID')}</span>
                                                </td>
                                                <td className="text-right">
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
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                                    <Fish className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 leading-tight">
                                        {kolam.find(k => k.id === selectedCycle.kolamId)?.nama}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
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
                                    <Scale className="w-4 h-4" />
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
                        <AlertTriangle className="w-8 h-8 text-red-600" />
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
                    <>  <button type="button" onClick={() => setIsFeedModalOpen(false)} className="btn btn-secondary" disabled={isSubmitting}>Batal</button>
                        <button type="submit" form="feed-form" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 me-1.5 -ms-0.5 animate-spin" /> : null}
                            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
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
                            {isSubmitting ? <Loader2 className="w-4 h-4 me-1.5 -ms-0.5 animate-spin" /> : null}
                            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
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
