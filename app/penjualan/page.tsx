'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import { useState } from 'react';
import { useApp, TipePembeli } from '../context/AppContext';
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
        tipe: 'TENGKULAK' as TipePembeli,
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
            tipe: 'TENGKULAK',
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
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

            {/* Profit Per Kolam */}
            <div className="card p-6 mb-6 sm:mb-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Profit Per Kolam</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
            <div className="table-wrapper mb-6 sm:mb-8">
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

            {/* Riwayat Penjualan */}
            <div className="table-wrapper">
                <div className="px-6 py-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span>📊</span>
                        <span>Riwayat Penjualan</span>
                    </h2>
                    <select
                        value={filterKolam}
                        onChange={(e) => setFilterKolam(e.target.value)}
                        className="input py-2 sm:max-w-xs w-full"
                    >
                        <option value="">Semua Kolam</option>
                        {kolam.map(k => (
                            <option key={k.id} value={k.id}>{k.nama}</option>
                        ))}
                    </select>
                </div>
                {filteredPenjualan.length === 0 ? (
                    <div className="p-6">
                        <EmptyState
                            title="Belum Ada Penjualan"
                            description="Belum ada data penjualan yang tercatat"
                            icon="💵"
                        />
                    </div>
                ) : (
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
                )}
            </div>

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

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteModal}
                onClose={() => setDeleteModal(null)}
                title={`Hapus ${deleteModal?.type === 'penjualan' ? 'Penjualan' : 'Pembeli'}?`}
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
