'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import { useState } from 'react';
import { useApp, TipePembeli, KategoriPengeluaran } from '../context/AppContext';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils';

import { PlusIcon, TrashIcon } from '../components/ui/Icons';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';

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
    };

    const handlePembeliSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!pembeliForm.nama) return;

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
    };

    const handlePengeluaranSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!pengeluaranFormData.jumlah || !pengeluaranFormData.keterangan) return;

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

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Keuangan</h1>
                    <p className="text-slate-500 mt-1">Kelola pendapatan dan pengeluaran peternakan</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="card-highlight card-gradient-green">
                    <p className="label">Total Pendapatan</p>
                    <p className="value">Rp {totalPendapatan.toLocaleString('id-ID')}</p>
                    <p className="sub">{totalBerat} kg terjual</p>
                </div>
                <div className="card-highlight card-gradient-red">
                    <p className="label">Total Pengeluaran</p>
                    <p className="value">Rp {grandTotalPengeluaran.toLocaleString('id-ID')}</p>
                </div>
                <div className="card-highlight card-gradient-blue">
                    <p className="label">Biaya Umum (Non-Kolam)</p>
                    <p className="value">Rp {totalGeneralExpenses.toLocaleString('id-ID')}</p>
                </div>
            </div>

            {/* Content: Pendapatan */}
            <div>
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        <button onClick={() => setShowPembeliForm(true)} className="btn btn-secondary flex-1 sm:flex-none">
                            <PlusIcon />
                            Pembeli
                        </button>
                        <button onClick={() => setShowPenjualanForm(true)} className="btn btn-primary flex-1 sm:flex-none">
                            <PlusIcon />
                            Penjualan
                        </button>
                        <button onClick={() => setShowPengeluaranForm(true)} className="btn bg-red-600 text-white hover:bg-red-700 flex-1 sm:flex-none">
                            <PlusIcon />
                            Pengeluaran
                        </button>
                    </div>

                    {/* Kategori Summary Cards */}
                    <div className="card p-6 mb-8">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                            {kategoriTotals.map((k, idx) => {
                                const colors = [
                                    { from: 'blue-50', to: 'blue-100/50', border: 'blue-200/50', text: 'blue-600', value: 'blue-900' },
                                    { from: 'amber-50', to: 'amber-100/50', border: 'amber-200/50', text: 'amber-600', value: 'amber-900' },
                                    { from: 'purple-50', to: 'purple-100/50', border: 'purple-200/50', text: 'purple-600', value: 'purple-900' },
                                    { from: 'yellow-50', to: 'yellow-100/50', border: 'yellow-200/50', text: 'yellow-600', value: 'yellow-900' },
                                    { from: 'cyan-50', to: 'cyan-100/50', border: 'cyan-200/50', text: 'cyan-600', value: 'cyan-900' },
                                    { from: 'slate-50', to: 'slate-100/50', border: 'slate-200/50', text: 'slate-600', value: 'slate-900' },
                                ];
                                const color = colors[idx % colors.length];
                                return (
                                    <div key={k.value} className={`bg-gradient-to-br from-${color.from} to-${color.to} rounded-xl p-4 border border-${color.border}`}>
                                        <p className={`text-[11px] font-bold text-${color.text} uppercase tracking-wider mb-2`}>{k.emoji} {k.label}</p>
                                        <p className={`text-base font-semibold text-${color.value}`}>Rp {k.total.toLocaleString('id-ID')}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Profit Per Kolam */}
                    <div className="card p-6 mb-8">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Profit Per Kolam</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {kolam.map(k => {
                                const pendapatan = getTotalPenjualanByKolam(k.id);
                                const pengeluaranTotal = getTotalPengeluaranByKolam(k.id);
                                const profit = getProfitByKolam(k.id);
                                const isProfit = profit >= 0;

                                return (
                                    <div key={k.id} className="bg-slate-50 rounded-xl p-4">
                                        <h3 className="font-semibold text-slate-900 mb-3">{k.nama}</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">💰 Pendapatan</span>
                                                <span className="font-medium text-green-600">Rp {pendapatan.toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">💸 Pengeluaran</span>
                                                <span className="font-medium text-red-600">Rp {pengeluaranTotal.toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className="flex justify-between pt-2 border-t font-semibold">
                                                <span>{isProfit ? '📈 Profit' : '📉 Rugi'}</span>
                                                <span className={isProfit ? 'text-green-600' : 'text-red-600'}>
                                                    Rp {Math.abs(profit).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Data Pembeli */}
                    <div className="table-wrapper mb-8">
                        <div className="px-6 py-4 border-b border-slate-200 bg-white">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <span>📋</span>
                                <span>Data Pembeli</span>
                            </h2>
                        </div>
                        {pembeli.length === 0 ? (
                            <div className="p-6">
                                <EmptyState
                                    title="Belum Ada Pembeli"
                                    description="Belum ada data pembeli yang tercatat"
                                    icon="👤"
                                />
                            </div>
                        ) : (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Nama</th>
                                        <th>Tipe</th>
                                        <th>Kontak</th>
                                        <th>Alamat</th>
                                        <th className="text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pembeli.map(p => {
                                        const tipe = tipePembeliOptions.find(t => t.value === p.tipe);
                                        return (
                                            <tr key={p.id}>
                                                <td className="text-strong">{p.nama}</td>
                                                <td>
                                                    <span className={`badge ${tipePembeliColors[p.tipe]}`}>
                                                        {tipe?.emoji} {tipe?.label}
                                                    </span>
                                                </td>
                                                <td className="text-muted">{p.kontak || '-'}</td>
                                                <td className="text-muted">{p.alamat || '-'}</td>
                                                <td className="action-cell">
                                                    <button
                                                        onClick={() => setDeleteModal({ type: 'pembeli', id: p.id })}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Riwayat Transaksi (Combined) */}
                    <div className="table-wrapper">
                        <div className="px-6 py-4 border-b border-slate-200 bg-white">
                            <div className="flex flex-col gap-4">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <span>📊</span>
                                    <span>Riwayat Transaksi</span>
                                </h2>
                                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                                    {/* Pill Tabs */}
                                    <div className="inline-flex bg-slate-100 rounded-lg p-1 w-full sm:w-auto">
                                        <button
                                            onClick={() => setTransactionTab('penjualan')}
                                            className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                                transactionTab === 'penjualan'
                                                    ? 'bg-white text-teal-600 shadow-sm'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            Penjualan
                                        </button>
                                        <button
                                            onClick={() => setTransactionTab('pengeluaran')}
                                            className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                                transactionTab === 'pengeluaran'
                                                    ? 'bg-white text-red-600 shadow-sm'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            Pengeluaran
                                        </button>
                                    </div>
                                    {/* Filter */}
                                    <select
                                        value={transactionTab === 'penjualan' ? filterKolamPenjualan : filterKolamPengeluaran}
                                        onChange={(e) => transactionTab === 'penjualan' ? setFilterKolamPenjualan(e.target.value) : setFilterKolamPengeluaran(e.target.value)}
                                        className="input py-2 w-full sm:w-auto"
                                    >
                                        <option value="">Semua Kolam</option>
                                        {transactionTab === 'pengeluaran' && <option value="UMUM">Umum (Farm Level)</option>}
                                        {kolam.map(k => (
                                            <option key={k.id} value={k.id}>{k.nama}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        {/* Penjualan Table */}
                        {transactionTab === 'penjualan' && (
                            filteredPenjualan.length === 0 ? (
                                <div className="p-6">
                                    <EmptyState
                                        title="Belum Ada Penjualan"
                                        description="Belum ada data penjualan yang tercatat"
                                        icon="💵"
                                    />
                                </div>
                            ) : (
                                <>
                                <table className="table table-compact">
                                    <thead>
                                        <tr>
                                            <th>Tanggal</th>
                                            <th>Kolam</th>
                                            <th>Pembeli</th>
                                            <th className="text-right">Berat (kg)</th>
                                            <th className="text-right">Harga/kg</th>
                                            <th className="text-right">Total</th>
                                            <th>Keterangan</th>
                                            <th className="text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPenjualan.map(p => {
                                            const k = kolam.find(kol => kol.id === p.kolamId);
                                            const buyer = pembeli.find(b => b.id === p.pembeliId);
                                            const total = p.beratKg * p.hargaPerKg;
                                            return (
                                                <tr key={p.id}>
                                                    <td className="text-small">{p.tanggal}</td>
                                                    <td className="text-strong">{k?.nama || 'Unknown'}</td>
                                                    <td className="text-muted">{buyer?.nama || 'Unknown'}</td>
                                                    <td className="text-right text-small">{p.beratKg}</td>
                                                    <td className="text-right text-small">Rp {p.hargaPerKg.toLocaleString('id-ID')}</td>
                                                    <td className="text-right text-strong text-green-600">
                                                        Rp {total.toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="text-muted text-small">{p.keterangan || '-'}</td>
                                                    <td className="action-cell">
                                                        <button
                                                            onClick={() => setDeleteModal({ type: 'penjualan', id: p.id })}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <p className="text-sm text-slate-500">
                                        Menampilkan {filteredPenjualan.length} dari {filterKolamPenjualan ? penjualan.filter(p => p.kolamId === filterKolamPenjualan).length : penjualan.length} data
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-slate-600">Tampilkan:</label>
                                        <select 
                                            value={limitPenjualan} 
                                            onChange={(e) => setLimitPenjualan(Number(e.target.value))} 
                                            className="input py-1 px-2 text-sm"
                                        >
                                            <option value={10}>10</option>
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                            <option value={9999}>Semua</option>
                                        </select>
                                    </div>
                                </div>
                                </>
                            )
                        )}
                        
                        {/* Pengeluaran Table */}
                        {transactionTab === 'pengeluaran' && (
                            filteredPengeluaran.length === 0 ? (
                                <div className="p-6">
                                    <EmptyState
                                        title="Belum Ada Pengeluaran"
                                        description="Belum ada data pengeluaran yang tercatat."
                                        icon="💰"
                                    />
                                </div>
                            ) : (
                                <>
                                <table className="table table-compact">
                                    <thead>
                                        <tr>
                                            <th>Tanggal</th>
                                            <th>Kolam</th>
                                            <th>Kategori</th>
                                            <th>Keterangan</th>
                                            <th className="text-right">Jumlah</th>
                                            <th className="text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPengeluaran.map(p => {
                                            const k = kolam.find(kol => kol.id === p.kolamId);
                                            const cat = kategoriOptions.find(c => c.value === p.kategori);
                                            return (
                                                <tr key={p.id}>
                                                    <td className="text-small">{p.tanggal}</td>
                                                    <td className="text-strong">{p.kolamId ? k?.nama : 'Umum (Farm Level)'}</td>
                                                    <td>
                                                        <span className={`badge ${kategoriColors[p.kategori]}`}>
                                                            {cat?.emoji} {cat?.label}
                                                        </span>
                                                    </td>
                                                    <td className="text-muted text-small">{p.keterangan}</td>
                                                    <td className="text-right text-strong text-red-600">
                                                        Rp {p.jumlah.toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="action-cell">
                                                        <button
                                                            onClick={() => setDeleteModal({ type: 'pengeluaran', id: p.id })}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <p className="text-sm text-slate-500">
                                        Menampilkan {Math.min(limitPengeluaran, filteredPengeluaran.length)} dari {filterKolamPengeluaran ? pengeluaran.filter(p => p.kolamId === filterKolamPengeluaran).length : pengeluaran.length} data
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-slate-600">Tampilkan:</label>
                                        <select value={limitPengeluaran} onChange={(e) => setLimitPengeluaran(Number(e.target.value))} className="input py-1 px-2 text-sm">
                                            <option value={10}>10</option>
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                            <option value={9999}>Semua</option>
                                        </select>
                                    </div>
                                </div>
                                </>
                            )
                        )}
                    </div>
                </div>

            {/* Modals */}
            {/* Form Modal - Penjualan */}
            <Modal 
                isOpen={showPenjualanForm} 
                onClose={() => setShowPenjualanForm(false)} 
                title="Catat Penjualan Baru"
                footer={
                    <>
                        <button type="button" onClick={() => setShowPenjualanForm(false)} className="btn btn-secondary">Batal</button>
                        <button type="submit" form="form-penjualan" className="btn btn-primary">Simpan</button>
                    </>
                }
            >
                <form id="form-penjualan" onSubmit={handlePenjualanSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Kolam</label>
                            <select
                                value={penjualanForm.kolamId}
                                onChange={(e) => setPenjualanForm({ ...penjualanForm, kolamId: e.target.value })}
                                className="input"
                                required
                            >
                                <option value="">-- Pilih --</option>
                                {kolam.map(k => (
                                    <option key={k.id} value={k.id}>{k.nama}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Pembeli</label>
                            <select
                                value={penjualanForm.pembeliId}
                                onChange={(e) => setPenjualanForm({ ...penjualanForm, pembeliId: e.target.value })}
                                className="input"
                                required
                            >
                                <option value="">-- Pilih --</option>
                                {pembeli.map(p => (
                                    <option key={p.id} value={p.id}>{p.nama}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tanggal</label>
                        <input
                            type="date"
                            value={penjualanForm.tanggal}
                            onChange={(e) => setPenjualanForm({ ...penjualanForm, tanggal: e.target.value })}
                            className="input"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Berat (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={penjualanForm.beratKg}
                                onChange={(e) => setPenjualanForm({ ...penjualanForm, beratKg: e.target.value })}
                                placeholder="Contoh: 100"
                                className="input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Harga/kg (Rp)</label>
                            <input
                                type="text"
                                value={formatCurrencyInput(penjualanForm.hargaPerKg)}
                                onChange={(e) => setPenjualanForm({ ...penjualanForm, hargaPerKg: parseCurrencyInput(e.target.value) })}
                                placeholder="Contoh: 25.000"
                                className="input"
                                required
                            />
                        </div>
                    </div>

                    {penjualanForm.beratKg && penjualanForm.hargaPerKg && (
                        <div className="p-4 bg-green-50 rounded-xl">
                            <p className="text-sm text-green-700">Total: <span className="font-bold">Rp {(parseFloat(penjualanForm.beratKg) * parseFloat(penjualanForm.hargaPerKg)).toLocaleString('id-ID')}</span></p>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Jumlah Ikan (opsional)</label>
                        <input
                            type="number"
                            min="0"
                            value={penjualanForm.jumlahIkan}
                            onChange={(e) => setPenjualanForm({ ...penjualanForm, jumlahIkan: e.target.value })}
                            placeholder="Contoh: 500"
                            className="input"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Keterangan (opsional)</label>
                        <input
                            type="text"
                            value={penjualanForm.keterangan}
                            onChange={(e) => setPenjualanForm({ ...penjualanForm, keterangan: e.target.value })}
                            placeholder="Contoh: Panen parsial"
                            className="input"
                        />
                    </div>
                </form>
            </Modal>

            {/* Form Modal - Pembeli */}
            <Modal 
                isOpen={showPembeliForm} 
                onClose={() => setShowPembeliForm(false)} 
                title="Tambah Pembeli Baru"
                footer={
                    <>
                        <button type="button" onClick={() => setShowPembeliForm(false)} className="btn btn-secondary">Batal</button>
                        <button type="submit" form="form-pembeli" className="btn btn-primary">Simpan</button>
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
                        <button type="submit" form="pengeluaran-form" className="btn btn-primary">Simpan</button>
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
        </DashboardLayout>
    );
}
