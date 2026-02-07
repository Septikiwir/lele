'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import { useState, useEffect } from 'react';
import { useApp, TipePembeli, KategoriPengeluaran } from '../context/AppContext';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils';
import { useToast } from '../context/ToastContext';

import { Plus, Trash2, Loader2, Banknote, Fish, Container, Pill, Zap, Users, Package, TrendingUp, Truck, Store, Utensils, PieChart, Wallet, Pencil, Check, X } from 'lucide-react';

import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import PanenModal from '../components/modals/PanenModal';

const tipePembeliOptions: { value: TipePembeli; label: string; icon: React.ReactNode }[] = [
    { value: 'TENGKULAK', label: 'Tengkulak', icon: <Truck className="w-4 h-4" /> },
    { value: 'PASAR', label: 'Pasar', icon: <Store className="w-4 h-4" /> },
    { value: 'RESTORAN', label: 'Restoran', icon: <Utensils className="w-4 h-4" /> },
    { value: 'LAINNYA', label: 'Lainnya', icon: <Package className="w-4 h-4" /> },
];

const tipePembeliColors: Record<TipePembeli, string> = {
    TENGKULAK: 'badge-cyan',
    PASAR: 'badge-success',
    RESTORAN: 'badge-purple',
    LAINNYA: 'badge-neutral',
};

const kategoriOptions: { value: KategoriPengeluaran; label: string; icon: React.ReactNode }[] = [
    { value: 'BIBIT', label: 'Bibit / Benih', icon: <Fish className="w-5 h-5" /> },
    { value: 'PAKAN', label: 'Pakan', icon: <Container className="w-5 h-5" /> },
    { value: 'OBAT', label: 'Obat & Probiotik', icon: <Pill className="w-5 h-5" /> },
    { value: 'LISTRIK', label: 'Listrik', icon: <Zap className="w-5 h-5" /> },
    { value: 'TENAGA_KERJA', label: 'Tenaga Kerja', icon: <Users className="w-5 h-5" /> },
    { value: 'MODAL', label: 'Penarikan Modal', icon: <Wallet className="w-5 h-5" /> },
    { value: 'LAINNYA', label: 'Lainnya', icon: <Package className="w-5 h-5" /> },
];

const kategoriColors: Record<KategoriPengeluaran, string> = {
    BIBIT: 'badge-cyan',
    PAKAN: 'badge-warning',
    OBAT: 'badge-purple',
    LISTRIK: 'badge-warning',
    TENAGA_KERJA: 'badge-success',
    LAINNYA: 'badge-neutral',
    MODAL: 'badge-purple',
};

const kategoriThemes: Record<KategoriPengeluaran, { bg: string; border: string; bar: string; iconBg: string; text: string }> = {
    BIBIT: { bg: 'hover:bg-cyan-50/30', border: 'hover:border-cyan-200', bar: 'bg-cyan-500', iconBg: 'bg-cyan-50', text: 'text-cyan-700' },
    PAKAN: { bg: 'hover:bg-amber-50/30', border: 'hover:border-amber-200', bar: 'bg-amber-500', iconBg: 'bg-amber-50', text: 'text-amber-700' },
    OBAT: { bg: 'hover:bg-purple-50/30', border: 'hover:border-purple-200', bar: 'bg-purple-500', iconBg: 'bg-purple-50', text: 'text-purple-700' },
    LISTRIK: { bg: 'hover:bg-blue-50/30', border: 'hover:border-blue-200', bar: 'bg-blue-500', iconBg: 'bg-blue-50', text: 'text-blue-700' },
    TENAGA_KERJA: { bg: 'hover:bg-emerald-50/30', border: 'hover:border-emerald-200', bar: 'bg-emerald-500', iconBg: 'bg-emerald-50', text: 'text-emerald-700' },
    LAINNYA: { bg: 'hover:bg-slate-50/30', border: 'hover:border-slate-200', bar: 'bg-slate-500', iconBg: 'bg-slate-50', text: 'text-slate-700' },
    MODAL: { bg: 'hover:bg-violet-50/30', border: 'hover:border-violet-200', bar: 'bg-violet-500', iconBg: 'bg-violet-50', text: 'text-violet-700' },
};

export default function KeuanganPage() {
    const {
        kolam, pembeli, penjualan, pengeluaran,
        addPembeli, deletePembeli,
        addPenjualan, deletePenjualan,
        addPengeluaran, deletePengeluaran,
        getTotalPenjualan, getTotalPenjualanByKolam, getProfitByKolam,
        getTotalPengeluaranByKolam, getTotalPengeluaranByKategori,
        farm, updateFarm, getAvailableFunds
    } = useApp();
    const { showToast } = useToast();

    // Transaction tab state
    // Capital editing states
    const [isModalEditOpen, setIsModalEditOpen] = useState(false);
    const [isModalConfirmOpen, setIsModalConfirmOpen] = useState(false);
    const [tempModal, setTempModal] = useState<number>(0);
    const [isSubmittingCapital, setIsSubmittingCapital] = useState(false);
    const [transactionTab, setTransactionTab] = useState<'penjualan' | 'pengeluaran'>('penjualan');

    const totalAvailable = getAvailableFunds();


    // Penjualan state
    const [showPenjualanForm, setShowPenjualanForm] = useState(false);
    const [showPembeliForm, setShowPembeliForm] = useState(false);
    const [filterKolamPenjualan, setFilterKolamPenjualan] = useState('');
    const [limitPenjualan, setLimitPenjualan] = useState(10);

    // Pengeluaran state
    const [showPengeluaranForm, setShowPengeluaranForm] = useState(false);
    const [filterKolamPengeluaran, setFilterKolamPengeluaran] = useState('');
    const [limitPengeluaran, setLimitPengeluaran] = useState(10);

    const [deleteModal, setDeleteModal] = useState<{ type: 'penjualan' | 'pembeli' | 'pengeluaran'; id: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [penjualanForm, setPenjualanForm] = useState({
        kolamId: '',
        pembeliId: '',
        tanggal: new Date().toLocaleDateString('en-CA'),
        beratKg: '',
        hargaPerKg: '',
        jumlahIkan: '',
        keterangan: '',
    });

    const [pembeliForm, setPembeliForm] = useState({
        nama: '',
        tipe: 'TENGKULAK' as TipePembeli,
        kontak: '',
        alamat: '',
    });

    const [pengeluaranFormData, setPengeluaranFormData] = useState({
        kolamId: '',
        tanggal: new Date().toLocaleDateString('en-CA'),
        kategori: 'LAINNYA' as KategoriPengeluaran,
        keterangan: '',
        jumlah: '',
    });

    const handlePenjualanSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!penjualanForm.kolamId || !penjualanForm.pembeliId || !penjualanForm.beratKg || !penjualanForm.hargaPerKg) return;
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            addPenjualan({
                kolamId: penjualanForm.kolamId,
                pembeliId: penjualanForm.pembeliId,
                tanggal: penjualanForm.tanggal,
                beratKg: parseFloat(penjualanForm.beratKg),
                hargaPerKg: parseFloat(penjualanForm.hargaPerKg),
                jumlahIkan: penjualanForm.jumlahIkan ? parseInt(penjualanForm.jumlahIkan) : undefined,
                keterangan: penjualanForm.keterangan || undefined,
            });

            setPenjualanForm({
                kolamId: '',
                pembeliId: '',
                tanggal: new Date().toLocaleDateString('en-CA'),
                beratKg: '',
                hargaPerKg: '',
                jumlahIkan: '',
                keterangan: '',
            });
            setShowPenjualanForm(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePembeliSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!pembeliForm.nama) return;
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            addPembeli({
                nama: pembeliForm.nama,
                tipe: pembeliForm.tipe,
                kontak: pembeliForm.kontak || undefined,
                alamat: pembeliForm.alamat || undefined,
            });

            setPembeliForm({
                nama: '',
                tipe: 'TENGKULAK',
                kontak: '',
                alamat: '',
            });
            setShowPembeliForm(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePengeluaranSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pengeluaranFormData.jumlah || !pengeluaranFormData.keterangan) return;
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await addPengeluaran({
                kolamId: pengeluaranFormData.kolamId || null,
                tanggal: pengeluaranFormData.tanggal,
                kategori: pengeluaranFormData.kategori,
                keterangan: pengeluaranFormData.keterangan,
                jumlah: parseFloat(pengeluaranFormData.jumlah),
            });

            setPengeluaranFormData({
                kolamId: '',
                tanggal: new Date().toLocaleDateString('en-CA'),
                kategori: 'LAINNYA',
                keterangan: '',
                jumlah: '',
            });
            setShowPengeluaranForm(false);
            showToast('Pengeluaran berhasil dicatat', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Gagal mencatat pengeluaran', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!deleteModal) return;
        if (deleteModal.type === 'penjualan') {
            deletePenjualan(deleteModal.id);
        } else if (deleteModal.type === 'pembeli') {
            deletePembeli(deleteModal.id);
        } else {
            deletePengeluaran(deleteModal.id);
        }
        setDeleteModal(null);
    };

    // Calculate totals
    const totalPendapatan = getTotalPenjualan();
    const totalBerat = penjualan.reduce((sum, p) => sum + p.beratKg, 0);

    const totalFeedCostAllKolam = kolam.reduce((sum, k) => sum + getTotalPengeluaranByKolam(k.id), 0);
    const totalGeneralExpenses = pengeluaran.filter(p => !p.kolamId).reduce((sum, p) => sum + p.jumlah, 0);
    const grandTotalPengeluaran = totalFeedCostAllKolam + totalGeneralExpenses;

    const netProfit = totalPendapatan - grandTotalPengeluaran;

    // Format currency: convert to "jt" if >= 1,000,000, else "k" if >= 1,000
    const formatCurrency = (value: number) => {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'jt';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'k';
        }
        return value.toLocaleString('id-ID');
    };

    const filteredPenjualan = (filterKolamPenjualan
        ? penjualan.filter(p => p.kolamId === filterKolamPenjualan)
        : penjualan)
        .sort((a, b) => {
            const dateCompare = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
            if (dateCompare !== 0) return dateCompare;
            return b.id.localeCompare(a.id);
        })
        .slice(0, limitPenjualan);

    const filteredPengeluaran = (filterKolamPengeluaran === 'UMUM'
        ? pengeluaran.filter(p => !p.kolamId)
        : filterKolamPengeluaran
            ? pengeluaran.filter(p => p.kolamId === filterKolamPengeluaran)
            : pengeluaran)
        .filter(p => p.kategori !== 'MODAL')
        .sort((a, b) => {
            const dateCompare = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
            if (dateCompare !== 0) return dateCompare;
            return b.id.localeCompare(a.id);
        })
        .slice(0, limitPengeluaran);

    const kategoriTotals = kategoriOptions.map(k => {
        const targetKat = k.value.toUpperCase();
        const knownCategories = kategoriOptions.filter(ko => ko.value !== 'LAINNYA').map(ko => ko.value.toUpperCase());

        const totalFromKolams = kolam.reduce((sum, col) => sum + getTotalPengeluaranByKategori(col.id, k.value), 0);
        const totalGeneral = pengeluaran
            .filter(p => {
                if (p.kolamId) return false;
                const pKat = p.kategori.toUpperCase();
                if (targetKat === 'LAINNYA') {
                    return !knownCategories.includes(pKat);
                }
                return pKat === targetKat;
            })
            .reduce((sum, p) => sum + p.jumlah, 0);

        return {
            ...k,
            total: totalFromKolams + totalGeneral,
        };
    });

    // Sort logic for display
    const sortedKolamProfit = [...kolam].map(k => {
        const profit = getProfitByKolam(k.id);
        return { ...k, profit };
    }).sort((a, b) => b.profit - a.profit); // Highest profit first

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8">
                {/* Header & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Keuangan</h1>
                        <p className="text-slate-500 text-sm">Analisis profitabilitas dan arus kas.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setShowPembeliForm(true)}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 font-medium text-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Pembeli
                        </button>
                        <button
                            onClick={() => setShowPengeluaranForm(true)}
                            className="px-4 py-2 bg-white border border-red-100 rounded-lg text-red-600 font-medium text-sm hover:bg-red-50 hover:border-red-200 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Pengeluaran
                        </button>
                        <button
                            onClick={() => setShowPenjualanForm(true)}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium text-sm hover:bg-teal-700 shadow-sm shadow-teal-200 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Penjualan
                        </button>
                    </div>
                </div>
                {/* KPI Cards Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {/* 0. Uang Tersedia */}
                    <div className="block p-4 sm:p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-start justify-between mb-4 gap-2">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-violet-50 flex-shrink-0 flex items-center justify-center text-violet-600">
                                    <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest leading-tight">Uang Tersedia</p>
                            </div>

                            {!isModalEditOpen ? (
                                <button
                                    onClick={() => {
                                        setTempModal(totalAvailable);
                                        setIsModalEditOpen(true);
                                    }}
                                    className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors flex-shrink-0"
                                    title="Sesuaikan Modal"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            ) : null}
                        </div>

                        <div className="flex items-center gap-1 mb-2">
                            <span className="text-lg sm:text-2xl font-semibold text-slate-400">Rp</span>
                            <span className="text-lg sm:text-2xl font-semibold tracking-tight text-slate-900">
                                {formatCurrencyInput(totalAvailable)}
                            </span>
                        </div>
                        <p className="mb-3 text-xs sm:text-sm text-slate-600">
                            (Modal: Rp {farm?.modalAwal.toLocaleString('id-ID')} {netProfit >= 0 ? '+' : '-'} {netProfit >= 0 ? 'Profit' : 'Defisit'}: Rp {Math.abs(netProfit).toLocaleString('id-ID')})
                        </p>
                    </div>

                    {/* 1. Pendapatan Bersih */}
                    <div className="block p-4 sm:p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                <Banknote className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Pendapatan Bersih</p>
                        </div>
                        <h5 className={`mb-2 text-lg sm:text-2xl font-semibold tracking-tight ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {netProfit >= 0 ? '+' : '-'}Rp {formatCurrency(Math.abs(netProfit))}
                        </h5>
                        <p className="mb-3 text-sm text-slate-600">
                            {netProfit >= 0 ? 'Profit bersih saat ini' : 'Defisit (Pengeluaran > Pendapatan)'}
                        </p>
                    </div>

                    {/* 2. Total Pendapatan */}
                    <div className="block p-4 sm:p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Total Pendapatan</p>
                        </div>
                        <h5 className="mb-2 text-lg sm:text-2xl font-semibold tracking-tight text-slate-900">Rp {formatCurrency(totalPendapatan)}</h5>
                        <p className="mb-3 text-sm text-slate-600">
                            {totalBerat.toLocaleString('id-ID')} kg ikan terjual
                        </p>
                    </div>

                    {/* 3. Total Pengeluaran */}
                    <div className="block p-4 sm:p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                <Banknote className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Total Pengeluaran</p>
                        </div>
                        <h5 className="mb-2 text-lg sm:text-2xl font-semibold tracking-tight text-slate-900">Rp {formatCurrency(grandTotalPengeluaran)}</h5>
                        <p className="mb-3 text-sm text-slate-600">
                            Termasuk biaya operasional & umum
                        </p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="space-y-6">

                    {/* Section: Expense Composition - Horizontal */}
                    <div className="block p-6 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <PieChart className="w-6 h-6" />
                            </div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Komposisi Pengeluaran</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {kategoriTotals.filter(k => k.value !== 'MODAL').sort((a, b) => b.total - a.total).map((k) => {
                                const percentage = grandTotalPengeluaran > 0 ? (k.total / grandTotalPengeluaran) * 100 : 0;
                                const theme = kategoriThemes[k.value];
                                return (
                                    <div key={k.value} className={`p-4 rounded-lg border transition-all bg-white border-slate-200 ${theme.bg} ${theme.border}`}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${theme.iconBg}`}>
                                                {k.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold text-slate-800 truncate">{k.label}</h4>
                                                <span className="text-xs text-slate-500">{percentage.toFixed(1)}%</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-semibold text-slate-900 block">Rp {k.total.toLocaleString('id-ID')}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                                                <div
                                                    className={`h-1.5 rounded-full ${theme.bar}`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Profit & Buyer Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                        {/* LEFT COLUMN */}
                        <div className="lg:col-span-2 h-full">
                            <div className="block p-6 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                        <Banknote className="w-6 h-6" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        Profitabilitas Kolam
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {sortedKolamProfit.map(k => {
                                        const pendapatan = getTotalPenjualanByKolam(k.id);
                                        const pengeluaranTotal = getTotalPengeluaranByKolam(k.id);
                                        const profit = k.profit;
                                        const isProfit = profit >= 0;

                                        return (
                                            <div
                                                key={k.id}
                                                className="p-4 rounded-lg border border-slate-200 bg-white"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <h4 className="font-bold text-slate-900">{k.nama}</h4>
                                                    <span
                                                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isProfit
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-red-100 text-red-700'
                                                            }`}
                                                    >
                                                        {isProfit ? 'Profit' : 'Rugi'}
                                                    </span>
                                                </div>

                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">Pendapatan</span>
                                                        <span className="font-medium text-emerald-600">
                                                            +Rp {pendapatan.toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">Pengeluaran</span>
                                                        <span className="font-medium text-red-600">
                                                            -Rp {pengeluaranTotal.toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                    <div className="pt-2 border-t border-slate-50 flex justify-between">
                                                        <span className="font-semibold text-slate-700">Net</span>
                                                        <span
                                                            className={`font-bold ${isProfit ? 'text-slate-900' : 'text-red-600'
                                                                }`}
                                                        >
                                                            Rp {Math.abs(profit).toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="h-full">
                            <div className="block p-6 bg-white border border-slate-200 rounded-lg shadow-sm
                    h-full flex flex-col">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${netProfit >= 0
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : 'bg-red-50 text-red-600'
                                                }`}
                                        >
                                            <Banknote className="w-6 h-6" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            Daftar Pembeli
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => setShowPembeliForm(true)}
                                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg
                     text-slate-600 font-medium text-sm hover:bg-slate-50"
                                    >
                                        <Plus className="w-4 h-4 inline" /> Pembeli
                                    </button>
                                </div>

                                {/* List (scroll) */}
                                <div className="flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
                                    {pembeli.length === 0 ? (
                                        <div className="p-6 text-center text-slate-400">
                                            Belum ada pembeli.
                                        </div>
                                    ) : (
                                        pembeli.map(p => {
                                            const tipe = tipePembeliOptions.find(t => t.value === p.tipe);
                                            return (
                                                <div
                                                    key={p.id}
                                                    className="p-4 rounded-lg border border-slate-200 bg-white
                           flex items-center justify-between hover:bg-slate-50"
                                                >
                                                    <div>
                                                        <h4 className="font-medium text-slate-900 text-sm">{p.nama}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                {tipe?.icon} {tipe?.label}
                                                            </span>
                                                            {p.kontak && <span className="text-xs text-slate-400">• {p.kontak}</span>}
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() =>
                                                            setDeleteModal({ type: 'pembeli', id: p.id })
                                                        }
                                                        className="text-slate-300 hover:text-red-500"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Section: Tabbed Transaction History */}
                <div className="block p-6 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                <Banknote className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Riwayat Transaksi</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <div className="inline-flex bg-slate-100 sm:bg-transparent rounded-lg p-1 sm:p-0">
                                <button
                                    onClick={() => setTransactionTab('penjualan')}
                                    className={`flex-1 sm:flex-none px-4 py-2 font-medium text-sm flex items-center justify-center gap-2${transactionTab === 'penjualan'
                                        ? 'bg-white text-emerald-700 shadow-sm border-slate-200 rounded-md sm:bg-emerald-50 sm:text-emerald-700 sm:border sm:rounded-lg'
                                        : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                >
                                    Penjualan
                                </button>
                                <button
                                    onClick={() => setTransactionTab('pengeluaran')}
                                    className={`flex-1 sm:flex-none px-4 py-2 font-medium text-sm flex items-center justify-center gap-2${transactionTab === 'pengeluaran'
                                        ? 'bg-white text-red-700 shadow-sm border-slate-200 rounded-md sm:bg-red-50 sm:text-red-700 sm:border sm:rounded-lg'
                                        : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                >
                                    Pengeluaran
                                </button>
                            </div>
                            <select
                                value={transactionTab === 'penjualan' ? filterKolamPenjualan : filterKolamPengeluaran}
                                onChange={(e) => transactionTab === 'penjualan' ? setFilterKolamPenjualan(e.target.value) : setFilterKolamPengeluaran(e.target.value)}
                                className="bg-white border border-slate-200 text-xs rounded-lg px-2 py-2 sm:py-1 focus:ring-0 focus:border-slate-300 w-full sm:w-[150px]"
                            >
                                <option value="">Semua Kolam</option>
                                {transactionTab === 'pengeluaran' && <option value="UMUM">Umum (Farm Level)</option>}
                                {kolam.map(k => (
                                    <option key={k.id} value={k.id}>{k.nama}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Penjualan Table */}
                    {transactionTab === 'penjualan' && (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th className="pl-6 text-left w-[15%]">Tanggal</th>
                                        <th className="text-left w-[20%]">Kolam</th>
                                        <th className="text-left w-[30%]">Pembeli</th>
                                        <th className="text-right w-[20%]">Nilai</th>
                                        <th className="pr-6 text-right w-[15%]">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPenjualan.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="table-empty text-center py-8 text-slate-500">
                                                Belum ada data penjualan.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPenjualan.map(p => {
                                            const k = kolam.find(kol => kol.id === p.kolamId);
                                            const buyer = pembeli.find(b => b.id === p.pembeliId);
                                            const total = p.beratKg * p.hargaPerKg;
                                            return (
                                                <tr key={p.id}>
                                                    <td className="text-body pl-6">{p.tanggal}</td>
                                                    <td className="font-medium text-heading">{k?.nama}</td>
                                                    <td className="text-body">{buyer?.nama || '-'}</td>
                                                    <td className="text-right font-medium text-emerald-600">
                                                        Rp {total.toLocaleString('id-ID')}
                                                        <div className="text-xs font-normal text-slate-400">
                                                            {p.beratKg} kg @ {p.hargaPerKg.toLocaleString('id-ID')}
                                                        </div>
                                                    </td>
                                                    <td className="text-right pr-6">
                                                        <button onClick={() => setDeleteModal({ type: 'penjualan', id: p.id })} className="text-slate-300 hover:text-red-500 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pengeluaran Table */}
                    {transactionTab === 'pengeluaran' && (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th className="pl-6 text-left w-[15%]">Tanggal</th>
                                        <th className="text-left w-[20%]">Kategori</th>
                                        <th className="text-left w-[30%]">Detail</th>
                                        <th className="text-right w-[20%]">Jumlah</th>
                                        <th className="pr-6 text-right w-[15%]">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPengeluaran.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="table-empty text-center py-8 text-slate-500">
                                                Belum ada data pengeluaran.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPengeluaran.map(p => {
                                            const cat = kategoriOptions.find(c => c.value === p.kategori);
                                            return (
                                                <tr key={p.id}>
                                                    <td className="text-body pl-6">{p.tanggal}</td>
                                                    <td>
                                                        <span className={`badge ${kategoriColors[p.kategori]} flex flex-row items-center gap-1.5 w-fit whitespace-nowrap [&>svg]:w-3.5 [&>svg]:h-3.5`}>
                                                            {cat?.icon} {cat?.label}
                                                        </span>
                                                    </td>
                                                    <td className="text-body max-w-xs truncate">
                                                        {p.keterangan}
                                                        {p.kolamId && <span className="ml-1 text-xs text-slate-400">({kolam.find(k => k.id === p.kolamId)?.nama})</span>}
                                                    </td>
                                                    <td className="text-right font-medium text-red-600">
                                                        Rp {p.jumlah.toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="text-right pr-6">
                                                        <button onClick={() => setDeleteModal({ type: 'pengeluaran', id: p.id })} className="text-slate-300 hover:text-red-500 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
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
            </div>

            {/* Panen Modal - Reusable Component */}
            <PanenModal
                isOpen={showPenjualanForm}
                onClose={() => setShowPenjualanForm(false)}
            />

            {/* Form Modal - Pembeli */}
            <Modal
                isOpen={showPembeliForm}
                onClose={() => setShowPembeliForm(false)}
                title="Tambah Pembeli Baru"
                footer={
                    <>
                        <button type="button" onClick={() => setShowPembeliForm(false)} className="btn btn-secondary">Batal</button>
                        <button type="submit" form="form-pembeli" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 me-1.5 -ms-0.5 animate-spin" /> : null}
                            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </>
                }
            >
                <form id="form-pembeli" onSubmit={handlePembeliSubmit} className="space-y-4">
                    <div className="form-group">
                        <label className="form-label">Nama Pembeli</label>
                        <input
                            type="text"
                            value={pembeliForm.nama}
                            onChange={(e) => setPembeliForm({ ...pembeliForm, nama: e.target.value })}
                            placeholder="Contoh: Pak Joko"
                            className="input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tipe Pembeli</label>
                        <div className="grid grid-cols-4 gap-2">
                            {tipePembeliOptions.map(t => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setPembeliForm({ ...pembeliForm, tipe: t.value })}
                                    className={`p-3 rounded-xl border-2 text-center transition-all ${pembeliForm.tipe === t.value
                                        ? 'border-teal-500 bg-teal-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="mb-1 flex items-center justify-center">{t.icon}</div>
                                    <div className="text-xs font-medium">{t.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Kontak (opsional)</label>
                        <input
                            type="text"
                            value={pembeliForm.kontak}
                            onChange={(e) => setPembeliForm({ ...pembeliForm, kontak: e.target.value })}
                            placeholder="Contoh: 081234567890"
                            className="input"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Alamat (opsional)</label>
                        <input
                            type="text"
                            value={pembeliForm.alamat}
                            onChange={(e) => setPembeliForm({ ...pembeliForm, alamat: e.target.value })}
                            placeholder="Contoh: Pasar Induk"
                            className="input"
                        />
                    </div>
                </form>
            </Modal>

            {/* Form Modal - Pengeluaran */}
            <Modal
                isOpen={showPengeluaranForm}
                onClose={() => setShowPengeluaranForm(false)}
                title="Tambah Pengeluaran"
                footer={
                    <>
                        <button type="button" onClick={() => setShowPengeluaranForm(false)} className="btn btn-secondary">Batal</button>
                        <button type="submit" form="pengeluaran-form" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 me-1.5 -ms-0.5 animate-spin" /> : null}
                            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </>
                }
            >
                <form id="pengeluaran-form" onSubmit={handlePengeluaranSubmit} className="space-y-4">
                    {/* Available Funds Display */}
                    <div className="p-3 bg-blue-50 rounded-xl mb-4">
                        <p className="text-xs text-blue-600 mb-1">Uang Tersedia</p>
                        <p className="text-lg font-bold text-blue-900">
                            Rp {getAvailableFunds().toLocaleString('id-ID')}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Kolam</label>
                            <select
                                value={pengeluaranFormData.kolamId}
                                onChange={(e) => setPengeluaranFormData({ ...pengeluaranFormData, kolamId: e.target.value })}
                                className="input"
                            >
                                <option value="">-- Pilih Kolam (Opsional) --</option>
                                {kolam.map(k => (
                                    <option key={k.id} value={k.id}>{k.nama}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tanggal</label>
                            <input
                                type="date"
                                value={pengeluaranFormData.tanggal}
                                onChange={(e) => setPengeluaranFormData({ ...pengeluaranFormData, tanggal: e.target.value })}
                                className="input"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Kategori</label>
                        <div className="grid grid-cols-2 gap-2">
                            {kategoriOptions.filter(k => k.value !== 'BIBIT' && k.value !== 'PAKAN' && k.value !== 'MODAL').map(k => {
                                const isSelected = pengeluaranFormData.kategori === k.value;
                                let activeClass = '';
                                let iconColor = '';

                                switch (k.value) {
                                    case 'OBAT':
                                        activeClass = 'border-purple-500 bg-purple-50 text-purple-700';
                                        iconColor = 'text-purple-600';
                                        break;
                                    case 'LISTRIK':
                                        activeClass = 'border-blue-500 bg-blue-50 text-blue-700';
                                        iconColor = 'text-blue-600';
                                        break;
                                    case 'TENAGA_KERJA':
                                        activeClass = 'border-emerald-500 bg-emerald-50 text-emerald-700';
                                        iconColor = 'text-emerald-600';
                                        break;
                                    case 'LAINNYA':
                                        activeClass = 'border-slate-500 bg-slate-50 text-slate-700';
                                        iconColor = 'text-slate-600';
                                        break;
                                    default:
                                        activeClass = 'border-teal-500 bg-teal-50 text-teal-700';
                                        iconColor = 'text-teal-600';
                                }

                                return (
                                    <button
                                        key={k.value}
                                        type="button"
                                        onClick={() => setPengeluaranFormData({ ...pengeluaranFormData, kategori: k.value })}
                                        className={`p-3 rounded-xl border-2 text-center transition-all ${isSelected
                                            ? activeClass
                                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-500'
                                            }`}
                                    >
                                        <div className={`mb-1 flex items-center justify-center ${isSelected ? iconColor : 'text-slate-400'}`}>
                                            {k.icon}
                                        </div>
                                        <div className="text-xs font-medium">{k.label}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Keterangan</label>
                        <input
                            type="text"
                            value={pengeluaranFormData.keterangan}
                            onChange={(e) => setPengeluaranFormData({ ...pengeluaranFormData, keterangan: e.target.value })}
                            placeholder="Contoh: Bibit lele 5000 ekor @Rp100"
                            className="input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Jumlah (Rp)</label>
                        <input
                            type="text"
                            value={formatCurrencyInput(pengeluaranFormData.jumlah)}
                            onChange={(e) => setPengeluaranFormData({ ...pengeluaranFormData, jumlah: parseCurrencyInput(e.target.value) })}
                            placeholder="Contoh: 500.000"
                            className="input"
                            required
                        />
                    </div>
                    {/* Expense Total Display */}
                    {pengeluaranFormData.jumlah && parseFloat(pengeluaranFormData.jumlah) > 0 && (
                        <div className="p-4 bg-orange-50 rounded-xl space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-orange-700">Total Pengeluaran:</span>
                                <span className="font-bold text-orange-900">
                                    Rp {parseFloat(pengeluaranFormData.jumlah).toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t border-orange-200">
                                <span className="text-orange-700">Sisa Dana:</span>
                                <span className={`font-bold ${getAvailableFunds() >= parseFloat(pengeluaranFormData.jumlah) ? 'text-green-600' : 'text-red-600'}`}>
                                    Rp {(getAvailableFunds() - parseFloat(pengeluaranFormData.jumlah)).toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>
                    )}
                </form>
            </Modal>

            {/* Modal Edit Modal Awal */}
            <Modal
                isOpen={isModalEditOpen}
                onClose={() => setIsModalEditOpen(false)}
                title="Sesuaikan Modal Awal"
                footer={
                    <>
                        <button type="button" onClick={() => setIsModalEditOpen(false)} className="btn btn-secondary">Batal</button>
                        <button
                            type="button"
                            onClick={() => {
                                if (tempModal < 0) {
                                    showToast('Modal tidak boleh negatif', 'error');
                                    return;
                                }
                                setIsModalConfirmOpen(true);
                            }}
                            className="btn btn-primary"
                        >
                            Lanjut
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="p-4 bg-violet-50 rounded-xl mb-4 border border-violet-100">
                        <p className="text-xs text-violet-600 mb-1 font-bold uppercase tracking-wider">Uang Tersedia</p>
                        <p className="text-2xl font-bold text-violet-900">
                            Rp {totalAvailable.toLocaleString('id-ID')}
                        </p>
                    </div>

                    <div className="form-group">
                        <label className="form-label font-bold text-slate-700">Penyesuaian Modal Baru (Tanpa Profit)</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formatCurrencyInput(tempModal)}
                                onChange={(e) => {
                                    const val = parseCurrencyInput(e.target.value);
                                    if (val === '' || /^\d+$/.test(val)) {
                                        setTempModal(Number(val));
                                    }
                                }}
                                className="input w-full text-lg font-semibold"
                                placeholder="Contoh: 15.000.000"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                            Masukkan total modal awal baru. Sistem akan otomatis mencatat selisihnya sebagai transaksi setoran/penarikan modal agar saldo akhir sesuai.
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Modal Konfirmasi Penyesuaian */}
            <Modal
                isOpen={isModalConfirmOpen}
                onClose={() => setIsModalConfirmOpen(false)}
                title="Konfirmasi Perubahan"
                footer={
                    <>
                        <button type="button" onClick={() => setIsModalConfirmOpen(false)} className="btn btn-secondary" disabled={isSubmittingCapital}>Batal</button>
                        <button
                            type="button"
                            onClick={async () => {
                                if (addPengeluaran) {
                                    setIsSubmittingCapital(true);
                                    try {
                                        const currentAvailable = getAvailableFunds();
                                        const diff = currentAvailable - tempModal;

                                        if (diff === 0) {
                                            setIsModalConfirmOpen(false);
                                            setIsModalEditOpen(false);
                                            return;
                                        }

                                        await addPengeluaran({
                                            tanggal: new Date().toISOString(),
                                            kategori: 'MODAL',
                                            keterangan: diff > 0 ? 'Penarikan Modal (Withdraw)' : 'Setoran Modal (Deposit)',
                                            jumlah: diff,
                                            kolamId: null
                                        });

                                        setIsModalConfirmOpen(false);
                                        setIsModalEditOpen(false);
                                        showToast('Kapasitas dana berhasil diperbarui', 'success');
                                    } catch (error) {
                                        showToast('Gagal memperbarui dana', 'error');
                                    } finally {
                                        setIsSubmittingCapital(false);
                                    }
                                }
                            }}
                            className="btn btn-primary"
                            disabled={isSubmittingCapital}
                        >
                            {isSubmittingCapital ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
                            {isSubmittingCapital ? 'Memproses...' : 'Ya, Perbarui Modal'}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-slate-600">Apakah Anda yakin ingin mengubah modal awal?</p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Sebelumnya</p>
                            <p className="font-bold text-slate-700">Rp {totalAvailable.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                            <p className="text-[10px] text-emerald-600 uppercase font-bold mb-1">Menjadi</p>
                            <p className="font-bold text-emerald-700">Rp {tempModal.toLocaleString('id-ID')}</p>
                        </div>
                    </div>

                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex gap-3">
                        <PieChart className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                            Aksi ini akan mencatat transaksi penyesuaian modal sebesar <strong>Rp {Math.abs(getAvailableFunds() - tempModal).toLocaleString('id-ID')}</strong> untuk menyeimbangkan saldo kas.
                        </p>
                    </div>
                </div>
            </Modal>
            <Modal
                isOpen={!!deleteModal}
                onClose={() => setDeleteModal(null)}
                title={`Hapus ${deleteModal?.type === 'penjualan' ? 'Penjualan' : deleteModal?.type === 'pembeli' ? 'Pembeli' : 'Pengeluaran'}?`}
            >
                <p className="text-slate-600 mb-6">Data akan dihapus permanen.</p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteModal(null)} className="flex-1 btn btn-secondary">
                        Batal
                    </button>
                    <button onClick={handleDelete} className="flex-1 btn bg-red-600 text-white hover:bg-red-700">
                        Hapus
                    </button>
                </div>
            </Modal>
        </DashboardLayout >
    );
}
