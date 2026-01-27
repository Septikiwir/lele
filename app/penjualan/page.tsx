'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import { useState } from 'react';
import { useApp, TipePembeli } from '../context/AppContext';

const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const tipePembeliOptions: { value: TipePembeli; label: string; emoji: string }[] = [
    { value: 'tengkulak', label: 'Tengkulak', emoji: '🚛' },
    { value: 'pasar', label: 'Pasar', emoji: '🏪' },
    { value: 'restoran', label: 'Restoran', emoji: '🍽️' },
    { value: 'lainnya', label: 'Lainnya', emoji: '📦' },
];

const tipePembeliColors: Record<TipePembeli, string> = {
    tengkulak: 'bg-blue-100 text-blue-700',
    pasar: 'bg-green-100 text-green-700',
    restoran: 'bg-purple-100 text-purple-700',
    lainnya: 'bg-slate-100 text-slate-700',
};

export default function PenjualanPage() {
    const {
        kolam, pembeli, penjualan,
        addPembeli, deletePembeli,
        addPenjualan, deletePenjualan,
        getTotalPenjualan, getTotalPenjualanByKolam, getProfitByKolam,
        getTotalPengeluaranByKolam
    } = useApp();

    const [showPenjualanForm, setShowPenjualanForm] = useState(false);
    const [showPembeliForm, setShowPembeliForm] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ type: 'penjualan' | 'pembeli'; id: string } | null>(null);
    const [filterKolam, setFilterKolam] = useState('');

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
        tipe: 'tengkulak' as TipePembeli,
        kontak: '',
        alamat: '',
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
            tipe: 'tengkulak',
            kontak: '',
            alamat: '',
        });
        setShowPembeliForm(false);
    };

    const handleDelete = () => {
        if (!deleteModal) return;
        if (deleteModal.type === 'penjualan') {
            deletePenjualan(deleteModal.id);
        } else {
            deletePembeli(deleteModal.id);
        }
        setDeleteModal(null);
    };

    // Calculate totals
    const totalPendapatan = getTotalPenjualan();
    const filteredPenjualan = filterKolam
        ? penjualan.filter(p => p.kolamId === filterKolam)
        : penjualan;
    const totalBerat = penjualan.reduce((sum, p) => sum + p.beratKg, 0);

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Penjualan / Pendapatan</h1>
                    <p className="text-slate-500 mt-1">Catat semua penjualan ikan dan data pembeli</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowPembeliForm(true)} className="btn btn-secondary">
                        <PlusIcon />
                        Pembeli
                    </button>
                    <button onClick={() => setShowPenjualanForm(true)} className="btn btn-primary">
                        <PlusIcon />
                        Penjualan
                    </button>
                </div>
            </div>

            {/* Total Summary */}
            <div className="card-highlight card-gradient-green">
                <p className="label">Total Pendapatan</p>
                <p className="value">Rp {totalPendapatan.toLocaleString('id-ID')}</p>
                <p className="sub">{totalBerat} kg terjual</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="card p-4">
                    <p className="text-xs text-slate-500">Total Transaksi</p>
                    <p className="text-2xl font-bold text-slate-900">{penjualan.length}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-slate-500">Rata-rata/Transaksi</p>
                    <p className="text-2xl font-bold text-slate-900">
                        Rp {penjualan.length > 0 ? Math.round(totalPendapatan / penjualan.length).toLocaleString('id-ID') : 0}
                    </p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-slate-500">Total Pembeli</p>
                    <p className="text-2xl font-bold text-slate-900">{pembeli.length}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-slate-500">Rata-rata Harga/kg</p>
                    <p className="text-2xl font-bold text-slate-900">
                        Rp {totalBerat > 0 ? Math.round(totalPendapatan / totalBerat).toLocaleString('id-ID') : 0}
                    </p>
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
            <div className="card overflow-hidden mb-8">
                <div className="p-6 border-b">
                    <h2 className="text-lg font-semibold text-slate-900">📋 Data Pembeli</h2>
                </div>
                {pembeli.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center text-3xl">
                            👤
                        </div>
                        <p className="text-slate-500">Belum ada data pembeli</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Nama</th>
                                    <th>Tipe</th>
                                    <th>Kontak</th>
                                    <th>Alamat</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {pembeli.map(p => {
                                    const tipe = tipePembeliOptions.find(t => t.value === p.tipe);
                                    return (
                                        <tr key={p.id}>
                                            <td className="font-medium">{p.nama}</td>
                                            <td>
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${tipePembeliColors[p.tipe]}`}>
                                                    {tipe?.emoji} {tipe?.label}
                                                </span>
                                            </td>
                                            <td className="text-slate-600">{p.kontak || '-'}</td>
                                            <td className="text-slate-600">{p.alamat || '-'}</td>
                                            <td>
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
                    </div>
                )}
            </div>

            {/* Riwayat Penjualan */}
            <div className="card overflow-hidden">
                <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-slate-900">📊 Riwayat Penjualan</h2>
                    <select
                        value={filterKolam}
                        onChange={(e) => setFilterKolam(e.target.value)}
                        className="input py-2 w-48"
                    >
                        <option value="">Semua Kolam</option>
                        {kolam.map(k => (
                            <option key={k.id} value={k.id}>{k.nama}</option>
                        ))}
                    </select>
                </div>
                {filteredPenjualan.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center text-3xl">
                            💵
                        </div>
                        <p className="text-slate-500">Belum ada data penjualan</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Kolam</th>
                                    <th>Pembeli</th>
                                    <th className="text-right">Berat (kg)</th>
                                    <th className="text-right">Harga/kg</th>
                                    <th className="text-right">Total</th>
                                    <th>Keterangan</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPenjualan.map(p => {
                                    const k = kolam.find(kol => kol.id === p.kolamId);
                                    const buyer = pembeli.find(b => b.id === p.pembeliId);
                                    const total = p.beratKg * p.hargaPerKg;
                                    return (
                                        <tr key={p.id}>
                                            <td>{p.tanggal}</td>
                                            <td className="font-medium">{k?.nama || 'Unknown'}</td>
                                            <td>{buyer?.nama || 'Unknown'}</td>
                                            <td className="text-right">{p.beratKg}</td>
                                            <td className="text-right">Rp {p.hargaPerKg.toLocaleString('id-ID')}</td>
                                            <td className="text-right font-semibold text-green-600">
                                                Rp {total.toLocaleString('id-ID')}
                                            </td>
                                            <td className="text-slate-600">{p.keterangan || '-'}</td>
                                            <td>
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
                    </div>
                )}
            </div>

            {/* Form Modal - Penjualan */}
            {showPenjualanForm && (
                <div className="modal-overlay" onClick={() => setShowPenjualanForm(false)}>
                    <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Catat Penjualan Baru</h3>
                        <form onSubmit={handlePenjualanSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Kolam</label>
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
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Pembeli</label>
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

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal</label>
                                <input
                                    type="date"
                                    value={penjualanForm.tanggal}
                                    onChange={(e) => setPenjualanForm({ ...penjualanForm, tanggal: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Berat (kg)</label>
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
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Harga/kg (Rp)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={penjualanForm.hargaPerKg}
                                        onChange={(e) => setPenjualanForm({ ...penjualanForm, hargaPerKg: e.target.value })}
                                        placeholder="Contoh: 25000"
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

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Jumlah Ikan (opsional)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={penjualanForm.jumlahIkan}
                                    onChange={(e) => setPenjualanForm({ ...penjualanForm, jumlahIkan: e.target.value })}
                                    placeholder="Contoh: 500"
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Keterangan (opsional)</label>
                                <input
                                    type="text"
                                    value={penjualanForm.keterangan}
                                    onChange={(e) => setPenjualanForm({ ...penjualanForm, keterangan: e.target.value })}
                                    placeholder="Contoh: Panen parsial"
                                    className="input"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPenjualanForm(false)}
                                    className="flex-1 btn btn-secondary"
                                >
                                    Batal
                                </button>
                                <button type="submit" className="flex-1 btn btn-primary">
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Form Modal - Pembeli */}
            {showPembeliForm && (
                <div className="modal-overlay" onClick={() => setShowPembeliForm(false)}>
                    <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Tambah Pembeli Baru</h3>
                        <form onSubmit={handlePembeliSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Nama Pembeli</label>
                                <input
                                    type="text"
                                    value={pembeliForm.nama}
                                    onChange={(e) => setPembeliForm({ ...pembeliForm, nama: e.target.value })}
                                    placeholder="Contoh: Pak Joko"
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Tipe Pembeli</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {tipePembeliOptions.map(t => (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => setPembeliForm({ ...pembeliForm, tipe: t.value })}
                                            className={`p-3 rounded-xl border-2 text-center transition-all ${pembeliForm.tipe === t.value
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <div className="text-xl mb-1">{t.emoji}</div>
                                            <div className="text-xs font-medium">{t.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Kontak (opsional)</label>
                                <input
                                    type="text"
                                    value={pembeliForm.kontak}
                                    onChange={(e) => setPembeliForm({ ...pembeliForm, kontak: e.target.value })}
                                    placeholder="Contoh: 081234567890"
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Alamat (opsional)</label>
                                <input
                                    type="text"
                                    value={pembeliForm.alamat}
                                    onChange={(e) => setPembeliForm({ ...pembeliForm, alamat: e.target.value })}
                                    placeholder="Contoh: Pasar Induk"
                                    className="input"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPembeliForm(false)}
                                    className="flex-1 btn btn-secondary"
                                >
                                    Batal
                                </button>
                                <button type="submit" className="flex-1 btn btn-primary">
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal && (
                <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-slate-900 mb-4">
                            Hapus {deleteModal.type === 'penjualan' ? 'Penjualan' : 'Pembeli'}?
                        </h3>
                        <p className="text-slate-600 mb-6">Data akan dihapus permanen.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteModal(null)} className="flex-1 btn btn-secondary">
                                Batal
                            </button>
                            <button onClick={handleDelete} className="flex-1 btn bg-red-600 text-white hover:bg-red-700">
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
