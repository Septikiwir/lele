'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import { useState } from 'react';
import { useApp, TipePembeli, KategoriPengeluaran } from '../context/AppContext';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils';

import { PlusIcon, TrashIcon, LoadingSpinner } from '../components/ui/Icons';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import PanenModal from '../components/modals/PanenModal';

const tipePembeliOptions: { value: TipePembeli; label: string; emoji: string }[] = [
    { value: 'TENGKULAK', label: 'Tengkulak', emoji: '🚛' },
    { value: 'PASAR', label: 'Pasar', emoji: '🏪' },
    { value: 'RESTORAN', label: 'Restoran', emoji: '🍽️' },
    { value: 'LAINNYA', label: 'Lainnya', emoji: '📦' },
];

const tipePembeliColors: Record<TipePembeli, string> = {
    TENGKULAK: 'badge-cyan',
    PASAR: 'badge-success',
    RESTORAN: 'badge-purple',
    LAINNYA: 'badge-neutral',
};

const kategoriOptions: { value: KategoriPengeluaran; label: string; emoji: string }[] = [
    { value: 'BIBIT', label: 'Bibit / Benih', emoji: '🐟' },
    { value: 'PAKAN', label: 'Pakan', emoji: '🍚' },
    { value: 'OBAT', label: 'Obat & Probiotik', emoji: '💊' },
    { value: 'LISTRIK', label: 'Listrik', emoji: '⚡' },
    { value: 'TENAGA_KERJA', label: 'Tenaga Kerja', emoji: '👷' },
    { value: 'LAINNYA', label: 'Lainnya', emoji: '📦' },
];

const kategoriColors: Record<KategoriPengeluaran, string> = {
    BIBIT: 'badge-cyan',
    PAKAN: 'badge-warning',
    OBAT: 'badge-purple',
    LISTRIK: 'badge-warning',
    TENAGA_KERJA: 'badge-success',
    LAINNYA: 'badge-neutral',
};

const kategoriThemes: Record<KategoriPengeluaran, { bg: string; border: string; bar: string; iconBg: string; text: string }> = {
    BIBIT: { bg: 'hover:bg-cyan-50/30', border: 'hover:border-cyan-200', bar: 'bg-cyan-500', iconBg: 'bg-cyan-50', text: 'text-cyan-700' },
    PAKAN: { bg: 'hover:bg-amber-50/30', border: 'hover:border-amber-200', bar: 'bg-amber-500', iconBg: 'bg-amber-50', text: 'text-amber-700' },
    OBAT: { bg: 'hover:bg-purple-50/30', border: 'hover:border-purple-200', bar: 'bg-purple-500', iconBg: 'bg-purple-50', text: 'text-purple-700' },
    LISTRIK: { bg: 'hover:bg-blue-50/30', border: 'hover:border-blue-200', bar: 'bg-blue-500', iconBg: 'bg-blue-50', text: 'text-blue-700' },
    TENAGA_KERJA: { bg: 'hover:bg-emerald-50/30', border: 'hover:border-emerald-200', bar: 'bg-emerald-500', iconBg: 'bg-emerald-50', text: 'text-emerald-700' },
    LAINNYA: { bg: 'hover:bg-slate-50/30', border: 'hover:border-slate-200', bar: 'bg-slate-500', iconBg: 'bg-slate-50', text: 'text-slate-700' },
};

export default function KeuanganPage() {
    const {
        kolam, pembeli, penjualan, pengeluaran,
        addPembeli, deletePembeli,
        addPenjualan, deletePenjualan,
        addPengeluaran, deletePengeluaran,
        getTotalPenjualan, getTotalPenjualanByKolam, getProfitByKolam,
        getTotalPengeluaranByKolam, getTotalPengeluaranByKategori
    } = useApp();

    // Transaction tab state
    const [transactionTab, setTransactionTab] = useState<'penjualan' | 'pengeluaran'>('penjualan');

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
        tanggal: new Date().toISOString().split('T')[0],
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
        tanggal: new Date().toISOString().split('T')[0],
        kategori: 'BIBIT' as KategoriPengeluaran,
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
                tanggal: new Date().toISOString().split('T')[0],
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

    const handlePengeluaranSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!pengeluaranFormData.jumlah || !pengeluaranFormData.keterangan) return;
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            addPengeluaran({
                kolamId: pengeluaranFormData.kolamId || null,
                tanggal: pengeluaranFormData.tanggal,
                kategori: pengeluaranFormData.kategori,
                keterangan: pengeluaranFormData.keterangan,
                jumlah: parseFloat(pengeluaranFormData.jumlah),
            });

            setPengeluaranFormData({
                kolamId: '',
                tanggal: new Date().toISOString().split('T')[0],
                kategori: 'BIBIT',
                keterangan: '',
                jumlah: '',
            });
            setShowPengeluaranForm(false);
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
        .sort((a, b) => {
            const dateCompare = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
            if (dateCompare !== 0) return dateCompare;
            return b.id.localeCompare(a.id);
        })
        .slice(0, limitPengeluaran);

    const kategoriTotals = kategoriOptions.map(k => {
        const totalFromKolams = kolam.reduce((sum, col) => sum + getTotalPengeluaranByKategori(col.id, k.value), 0);
        const totalGeneral = pengeluaran
            .filter(p => !p.kolamId && p.kategori === k.value)
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Keuangan</h1>
                        <p className="text-slate-500 text-sm">Analisis profitabilitas dan arus kas.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowPembeliForm(true)}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 font-medium text-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2"
                        >
                            <PlusIcon /> Pembeli
                        </button>
                        <button
                            onClick={() => setShowPengeluaranForm(true)}
                            className="px-4 py-2 bg-white border border-red-100 rounded-lg text-red-600 font-medium text-sm hover:bg-red-50 hover:border-red-200 transition-all flex items-center gap-2"
                        >
                            <PlusIcon /> Pengeluaran
                        </button>
                        <button
                            onClick={() => setShowPenjualanForm(true)}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium text-sm hover:bg-teal-700 shadow-sm shadow-teal-200 transition-all flex items-center gap-2"
                        >
                            <PlusIcon /> Penjualan
                        </button>
                    </div>
                </div>

                {/* KPI Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    {/* 1. Net Profit */}
                    <div className="stat-card p-6 bg-white border border-slate-100 rounded-2xl group relative overflow-hidden hover:shadow-md transition-all">
                        <div className="flex items-start justify-between z-10 relative">
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Net Profit</p>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        Rp {Math.abs(netProfit).toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' : 'bg-red-50 text-red-600 group-hover:bg-red-100'}`}>
                                <span className="text-xl">💰</span>
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-slate-500">
                            {netProfit >= 0 ? 'Profit bersih saat ini' : 'Defisit (Pengeluaran > Pendapatan)'}
                        </div>
                    </div>

                    {/* 2. Total Pendapatan */}
                    <div className="stat-card p-6 bg-white border border-slate-100 rounded-2xl group relative overflow-hidden hover:shadow-md transition-all">
                        <div className="flex items-start justify-between z-10 relative">
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Pendapatan</p>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <p className="text-2xl font-bold text-slate-900">Rp {totalPendapatan.toLocaleString('id-ID')}</p>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                                <span className="text-xl">📈</span>
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-slate-500">
                            {totalBerat.toLocaleString('id-ID')} kg ikan terjual
                        </div>
                    </div>

                    {/* 3. Total Pengeluaran */}
                    <div className="stat-card p-6 bg-white border border-slate-100 rounded-2xl group relative overflow-hidden hover:shadow-md transition-all">
                        <div className="flex items-start justify-between z-10 relative">
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Pengeluaran</p>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <p className="text-2xl font-bold text-slate-900">Rp {grandTotalPengeluaran.toLocaleString('id-ID')}</p>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-100 transition-colors">
                                <span className="text-xl">💸</span>
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-slate-500">
                            Termasuk biaya operasional & umum
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT COLUMN (2/3) - Profit & History */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Section: Profit Per Kolam */}
                        <div className="bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                    <span>📊</span> Profitabilitas Kolam
                                </h3>
                            </div>
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {sortedKolamProfit.map(k => {
                                    const pendapatan = getTotalPenjualanByKolam(k.id);
                                    const pengeluaranTotal = getTotalPengeluaranByKolam(k.id);
                                    const profit = k.profit;
                                    const isProfit = profit >= 0;

                                    return (
                                        <div key={k.id} className="p-4 rounded-xl border border-slate-100 hover:border-slate-300 transition-all bg-white relative group">
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-bold text-slate-900">{k.nama}</h4>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isProfit ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                    {isProfit ? 'Profit' : 'Rugi'}
                                                </span>
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Pendapatan</span>
                                                    <span className="font-medium text-emerald-600">+Rp {pendapatan.toLocaleString('id-ID')}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Pengeluaran</span>
                                                    <span className="font-medium text-red-600">-Rp {pengeluaranTotal.toLocaleString('id-ID')}</span>
                                                </div>
                                                <div className="pt-2 border-t border-slate-50 flex justify-between items-center">
                                                    <span className="font-semibold text-slate-700">Net</span>
                                                    <span className={`font-bold ${isProfit ? 'text-slate-900' : 'text-red-600'}`}>
                                                        Rp {Math.abs(profit).toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section: Tabbed Transaction History */}
                        <div className="bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                                <h3 className="font-semibold text-slate-800">Riwayat Transaksi</h3>

                                <div className="flex gap-2">
                                    <div className="inline-flex bg-white border border-slate-200 rounded-lg p-1">
                                        <button
                                            onClick={() => setTransactionTab('penjualan')}
                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${transactionTab === 'penjualan'
                                                ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800'
                                                }`}
                                        >
                                            Penjualan
                                        </button>
                                        <button
                                            onClick={() => setTransactionTab('pengeluaran')}
                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${transactionTab === 'pengeluaran'
                                                ? 'bg-red-50 text-red-700 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800'
                                                }`}
                                        >
                                            Pengeluaran
                                        </button>
                                    </div>
                                    <select
                                        value={transactionTab === 'penjualan' ? filterKolamPenjualan : filterKolamPengeluaran}
                                        onChange={(e) => transactionTab === 'penjualan' ? setFilterKolamPenjualan(e.target.value) : setFilterKolamPengeluaran(e.target.value)}
                                        className="bg-white border border-slate-200 text-xs rounded-lg px-2 py-1 focus:ring-0 focus:border-slate-300"
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
                                <div className="overflow-x-auto">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Tanggal</th>
                                                <th>Kolam</th>
                                                <th>Pembeli</th>
                                                <th className="text-right">Nilai</th>
                                                <th className="text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPenjualan.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center text-slate-400 py-8">
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
                                                            <td className="text-slate-500">{p.tanggal}</td>
                                                            <td className="font-medium text-slate-900">{k?.nama}</td>
                                                            <td className="text-slate-600">{buyer?.nama || '-'}</td>
                                                            <td className="text-right font-medium text-emerald-600">
                                                                Rp {total.toLocaleString('id-ID')}
                                                                <div className="text-xs font-normal text-slate-400">
                                                                    {p.beratKg} kg @ {p.hargaPerKg.toLocaleString('id-ID')}
                                                                </div>
                                                            </td>
                                                            <td className="text-right">
                                                                <button onClick={() => setDeleteModal({ type: 'penjualan', id: p.id })} className="text-slate-300 hover:text-red-500 transition-colors">
                                                                    <TrashIcon />
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
                                <div className="overflow-x-auto">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Tanggal</th>
                                                <th>Kategori</th>
                                                <th>Detail</th>
                                                <th className="text-right">Jumlah</th>
                                                <th className="text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPengeluaran.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center text-slate-400 py-8">
                                                        Belum ada data pengeluaran.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredPengeluaran.map(p => {
                                                    const cat = kategoriOptions.find(c => c.value === p.kategori);
                                                    return (
                                                        <tr key={p.id}>
                                                            <td className="text-slate-500">{p.tanggal}</td>
                                                            <td>
                                                                <span className={`badge ${kategoriColors[p.kategori]}`}>
                                                                    {cat?.emoji} {cat?.label}
                                                                </span>
                                                            </td>
                                                            <td className="text-slate-600 max-w-xs truncate">
                                                                {p.keterangan}
                                                                {p.kolamId && <span className="ml-1 text-xs text-slate-400">({kolam.find(k => k.id === p.kolamId)?.nama})</span>}
                                                            </td>
                                                            <td className="text-right font-medium text-red-600">
                                                                Rp {p.jumlah.toLocaleString('id-ID')}
                                                            </td>
                                                            <td className="text-right">
                                                                <button onClick={() => setDeleteModal({ type: 'pengeluaran', id: p.id })} className="text-slate-300 hover:text-red-500 transition-colors">
                                                                    <TrashIcon />
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
                            <div className="px-6 py-4 border-t border-slate-100 flex justify-end items-center bg-slate-50/50">
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span>Tampilkan</span>
                                    <select
                                        value={transactionTab === 'penjualan' ? limitPenjualan : limitPengeluaran}
                                        onChange={(e) => transactionTab === 'penjualan' ? setLimitPenjualan(Number(e.target.value)) : setLimitPengeluaran(Number(e.target.value))}
                                        className="bg-white border border-slate-200 text-xs rounded-lg px-2 py-1 focus:ring-slate-200 focus:border-slate-300 cursor-pointer font-medium outline-none"
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                    </select>
                                    <span>Item</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN (1/3) - Categories & Buyers */}
                    <div className="space-y-6">

                        {/* Section: Expense Breakdown */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-md transition-all">
                            <div className="mb-4">
                                <h3 className="font-semibold text-slate-800">Komposisi Pengeluaran</h3>
                            </div>
                            <div className="space-y-3">
                                {kategoriTotals.sort((a, b) => b.total - a.total).map((k) => {
                                    const percentage = grandTotalPengeluaran > 0 ? (k.total / grandTotalPengeluaran) * 100 : 0;
                                    const theme = kategoriThemes[k.value];
                                    return (
                                        <div key={k.value} className={`p-3 rounded-xl border transition-all bg-white border-slate-100 ${theme.bg} ${theme.border}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${theme.iconBg}`}>
                                                        {k.emoji}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-slate-800">{k.label}</h4>
                                                        <span className="text-xs text-slate-500">{percentage.toFixed(1)}%</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-medium text-slate-900 block">Rp {k.total.toLocaleString('id-ID')}</span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                                                <div
                                                    className={`h-1.5 rounded-full ${theme.bar}`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section: Buyer List */}
                        <div className="bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h3 className="font-semibold text-slate-800">Daftar Pembeli</h3>
                                <button onClick={() => setShowPembeliForm(true)} className="text-xs text-primary-600 font-medium hover:underline">
                                    + Baru
                                </button>
                            </div>
                            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                                {pembeli.length === 0 ? (
                                    <div className="p-6 text-center text-slate-400">Belum ada pembeli.</div>
                                ) : (
                                    pembeli.map(p => {
                                        const tipe = tipePembeliOptions.find(t => t.value === p.tipe);
                                        return (
                                            <div key={p.id} className="p-4 flex items-start justify-between hover:bg-slate-50 group">
                                                <div>
                                                    <h4 className="font-medium text-slate-900 text-sm">{p.nama}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                            {tipe?.emoji} {tipe?.label}
                                                        </span>
                                                        {p.kontak && <span className="text-xs text-slate-400">• {p.kontak}</span>}
                                                    </div>
                                                </div>
                                                <button onClick={() => setDeleteModal({ type: 'pembeli', id: p.id })} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all px-2">
                                                    <TrashIcon />
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

            {/* Modals */}
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
                            {isSubmitting ? <LoadingSpinner className="w-5 h-5" /> : 'Simpan'}
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
                                    <div className="text-xl mb-1">{t.emoji}</div>
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
                            {isSubmitting ? <LoadingSpinner className="w-5 h-5" /> : 'Simpan'}
                        </button>
                    </>
                }
            >
                <form id="pengeluaran-form" onSubmit={handlePengeluaranSubmit} className="space-y-4">
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
                        <div className="grid grid-cols-3 gap-2">
                            {kategoriOptions.map(k => (
                                <button
                                    key={k.value}
                                    type="button"
                                    onClick={() => setPengeluaranFormData({ ...pengeluaranFormData, kategori: k.value })}
                                    className={`p-3 rounded-xl border-2 text-center transition-all ${pengeluaranFormData.kategori === k.value
                                        ? 'border-teal-500 bg-teal-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="text-xl mb-1">{k.emoji}</div>
                                    <div className="text-xs font-medium">{k.label}</div>
                                </button>
                            ))}
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
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
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
