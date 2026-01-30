'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import { useState } from 'react';
import { useApp, KategoriPengeluaran } from '../context/AppContext';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils';

import { PlusIcon, TrashIcon } from '../components/ui/Icons';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';

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

export default function PengeluaranPage() {
    const { kolam, pengeluaran, addPengeluaran, deletePengeluaran, getTotalPengeluaranByKolam, getTotalPengeluaranByKategori } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [deleteModal, setDeleteModal] = useState<string | null>(null);
    const [filterKolam, setFilterKolam] = useState('');
    const [formData, setFormData] = useState({
        kolamId: '',
        tanggal: new Date().toISOString().split('T')[0],
        kategori: 'BIBIT' as KategoriPengeluaran,
        keterangan: '',
        jumlah: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted', formData);
        if (!formData.jumlah || !formData.keterangan) {
            console.error('Validation failed');
            return;
        }

        addPengeluaran({
            kolamId: formData.kolamId || null,
            tanggal: formData.tanggal,
            kategori: formData.kategori,
            keterangan: formData.keterangan,
            jumlah: parseFloat(formData.jumlah),
        });

        setFormData({
            kolamId: '',
            tanggal: new Date().toISOString().split('T')[0],
            kategori: 'BIBIT',
            keterangan: '',
            jumlah: '',
        });
        setShowForm(false);
    };

    const handleDelete = (id: string) => {
        deletePengeluaran(id);
        setDeleteModal(null);
    };

    // Calculate totals
    // 1. Total Manual Expenses (Farm Level + Kolam Level)
    const totalManual = pengeluaran.reduce((sum, p) => sum + p.jumlah, 0);

    // 2. Total Feed Cost (Calculated from DataPakan) - Implied in getTotalPengeluaranByKolam for each kolam
    const totalFeedCostAllKolam = kolam.reduce((sum, k) => {
        // getTotalPengeluaranByKategori(..., 'PAKAN') includes both manual pakan entries for that kolam AND calculated feed cost
        // But we want just the Feed Cost part to add to 'totalManual' which already has manual parts?
        // Wait, getTotalPengeluaranByKolam includes BOTH.
        // So Grand Total = (Sum of getTotalPengeluaranByKolam) + (General Expenses NOT in any kolam)
        return sum + getTotalPengeluaranByKolam(k.id);
    }, 0);

    const totalGeneralExpenses = pengeluaran
        .filter(p => !p.kolamId)
        .reduce((sum, p) => sum + p.jumlah, 0);

    const grandTotal = totalFeedCostAllKolam + totalGeneralExpenses;

    const filteredPengeluaran = filterKolam
        ? pengeluaran.filter(p => p.kolamId === filterKolam)
        : pengeluaran;

    // Group by kategori for summary
    const kategoriTotals = kategoriOptions.map(k => {
        // Start with manual expenses for this category
        let total = pengeluaran.reduce((sum, p) => p.kategori === k.value ? sum + p.jumlah : sum, 0);

        // If Category is PAKAN, we need to add the calculated Feed Cost from all kolams
        // NOTE: getTotalPengeluaranByKategori returns (Manual for Kolam + Calculated for Kolam)
        // We already summed Manual globally above.
        // We need to ONLY add the Calculated part if we want to combine with global manual sum?
        // Easier: Iterate all kolams and sum getTotalPengeluaranByKategori(id, k.value). 
        // Then ADD General Expenses for this category.

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Pengeluaran / Modal</h1>
                    <p className="text-slate-500 mt-1">Catat semua biaya operasional peternakan</p>
                </div>
                <button onClick={() => setShowForm(true)} className="btn btn-primary">
                    <PlusIcon />
                    Tambah Pengeluaran
                </button>
            </div>

            {/* Total Summary */}
            <div className="card-highlight card-gradient-red">
                <p className="label">Total Pengeluaran (Modal)</p>
                <p className="value">Rp {grandTotal.toLocaleString('id-ID')}</p>
            </div>

            {/* Kategori Summary Cards */}
            <div className="card p-6 mb-6 sm:mb-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                    {kategoriTotals.map((k, idx) => {
                        const colorClasses = [
                            { card: 'bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50', label: 'text-blue-600', value: 'text-blue-900' },
                            { card: 'bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50', label: 'text-amber-600', value: 'text-amber-900' },
                            { card: 'bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50', label: 'text-purple-600', value: 'text-purple-900' },
                            { card: 'bg-gradient-to-br from-yellow-50 to-yellow-100/50 border border-yellow-200/50', label: 'text-yellow-600', value: 'text-yellow-900' },
                            { card: 'bg-gradient-to-br from-cyan-50 to-cyan-100/50 border border-cyan-200/50', label: 'text-cyan-600', value: 'text-cyan-900' },
                            { card: 'bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/50', label: 'text-slate-600', value: 'text-slate-900' },
                        ];
                        const color = colorClasses[idx % colorClasses.length];
                        return (
                            <div key={k.value} className={`${color.card} rounded-xl p-4`}>
                                <p className={`text-[11px] font-bold ${color.label} uppercase tracking-wider mb-2`}>{k.emoji} {k.label}</p>
                                <p className={`text-base font-semibold ${color.value}`}>Rp {k.total.toLocaleString('id-ID')}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Per Kolam Summary */}
            <div className="card p-6 mb-6 sm:mb-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Modal Per Kolam</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {kolam.map(k => {
                        const total = getTotalPengeluaranByKolam(k.id);
                        return (
                            <div key={k.id} className="bg-slate-50 rounded-xl p-4">
                                <h3 className="font-semibold text-slate-900 mb-3">{k.nama}</h3>
                                <div className="space-y-2 text-sm">
                                    {kategoriOptions.map(cat => {
                                        const catTotal = getTotalPengeluaranByKategori(k.id, cat.value);
                                        if (catTotal === 0) return null;
                                        return (
                                            <div key={cat.value} className="flex justify-between">
                                                <span className="text-slate-500">{cat.emoji} {cat.label}</span>
                                                <span className="font-medium">Rp {catTotal.toLocaleString('id-ID')}</span>
                                            </div>
                                        );
                                    })}
                                    <div className="flex justify-between pt-2 border-t font-semibold">
                                        <span>Total</span>
                                        <span className="text-red-600">Rp {total.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="card p-6 mb-6 sm:mb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Biaya Umum (Non-Kolam)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {/* General Farm Expenses Card */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <h3 className="font-semibold text-slate-900 mb-3">🏢 Umum / Farm Level</h3>
                        <div className="space-y-2 text-sm">
                            {kategoriOptions.map(cat => {
                                const catTotal = pengeluaran
                                    .filter(p => !p.kolamId && p.kategori === cat.value)
                                    .reduce((sum, p) => sum + p.jumlah, 0);
                                if (catTotal === 0) return null;
                                return (
                                    <div key={cat.value} className="flex justify-between">
                                        <span className="text-slate-500">{cat.emoji} {cat.label}</span>
                                        <span className="font-medium">Rp {catTotal.toLocaleString('id-ID')}</span>
                                    </div>
                                );
                            })}
                            <div className="flex justify-between pt-2 border-t font-semibold">
                                <span>Total Umum</span>
                                <span className="text-red-600">
                                    Rp {pengeluaran.filter(p => !p.kolamId).reduce((sum, p) => sum + p.jumlah, 0).toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>



            {/* Riwayat Pengeluaran */}
            <div className="table-wrapper">
                <div className="px-6 py-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span>📊</span>
                        <span>Riwayat Pengeluaran</span>
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
                {filteredPengeluaran.length === 0 ? (
                    <div className="p-6">
                        <EmptyState
                            title="Belum Ada Pengeluaran"
                            description="Belum ada data pengeluaran yang tercatat."
                            icon="💰"
                        />
                    </div>
                ) : (
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
                                        <td className="text-strong">{k?.nama || 'Umum (Farm Level)'}</td>
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
                                                onClick={() => setDeleteModal(p.id)}
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

            {/* Form Modal */}
            <Modal 
                isOpen={showForm} 
                onClose={() => setShowForm(false)} 
                title="Tambah Pengeluaran"
                footer={
                    <>
                        <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
                        <button type="submit" form="pengeluaran-form" className="btn btn-primary">Simpan</button>
                    </>
                }
            >
                <form id="pengeluaran-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Kolam</label>
                            <select
                                value={formData.kolamId}
                                onChange={(e) => setFormData({ ...formData, kolamId: e.target.value })}
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
                                value={formData.tanggal}
                                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
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
                                    onClick={() => setFormData({ ...formData, kategori: k.value })}
                                    className={`p-3 rounded-xl border-2 text-center transition-all ${formData.kategori === k.value
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
                            value={formData.keterangan}
                            onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                            placeholder="Contoh: Bibit lele 5000 ekor @Rp100"
                            className="input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Jumlah (Rp)</label>
                        <input
                            type="text"
                            value={formatCurrencyInput(formData.jumlah)}
                            onChange={(e) => setFormData({ ...formData, jumlah: parseCurrencyInput(e.target.value) })}
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
                title="Hapus Pengeluaran?"
            >
                <p className="text-slate-600 mb-6">Data pengeluaran akan dihapus permanen.</p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteModal(null)} className="flex-1 btn btn-secondary">
                        Batal
                    </button>
                    <button onClick={() => deleteModal && handleDelete(deleteModal)} className="flex-1 btn bg-red-600 text-white hover:bg-red-700">
                        Hapus
                    </button>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
