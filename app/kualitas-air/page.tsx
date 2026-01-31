'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import { useState } from 'react';
import { useApp } from '../context/AppContext';

import { PlusIcon, LoadingSpinner } from '../components/ui/Icons';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';

const warnaOptions = [
    { value: 'Hijau cerah', label: 'Hijau Cerah', status: 'good' },
    { value: 'Hijau pekat', label: 'Hijau Pekat', status: 'warning' },
    { value: 'Coklat', label: 'Coklat', status: 'warning' },
    { value: 'Keruh', label: 'Keruh', status: 'bad' },
    { value: 'Hitam', label: 'Hitam', status: 'bad' },
];

const bauOptions = [
    { value: 'Normal', label: 'Normal', status: 'good' },
    { value: 'Amis ringan', label: 'Amis Ringan', status: 'warning' },
    { value: 'Amis', label: 'Amis', status: 'warning' },
    { value: 'Busuk', label: 'Busuk', status: 'bad' },
];

const getRekomendasi = (warna: string, bau: string, ph?: number, suhu?: number): string[] => {
    const rekom: string[] = [];

    // Warna
    if (['Keruh', 'Hitam'].includes(warna)) {
        rekom.push('🔴 Segera ganti air sebagian (30-50%)');
        rekom.push('⚠️ Kurangi pemberian pakan');
    } else if (['Hijau pekat', 'Coklat'].includes(warna)) {
        rekom.push('🟡 Ganti air sebagian (20-30%) dalam 1-2 hari');
    }

    // Bau
    if (bau === 'Busuk') {
        rekom.push('🔴 DARURAT: Ganti air 50% segera!');
        rekom.push('⚠️ Puasa pakan 1-2 hari');
        rekom.push('💊 Pertimbangkan probiotik air');
    } else if (bau === 'Amis') {
        rekom.push('🟡 Perbaiki aerasi atau sirkulasi air');
    }

    // pH
    if (ph !== undefined) {
        if (ph < 6.5) {
            rekom.push('🔴 pH terlalu asam. Tambahkan kapur/dolomit');
        } else if (ph > 8.5) {
            rekom.push('🔴 pH terlalu basa. Ganti air sebagian');
        }
    }

    // Suhu
    if (suhu !== undefined) {
        if (suhu < 25) {
            rekom.push('⚠️ Suhu terlalu rendah. Kurangi pemberian pakan');
        } else if (suhu > 32) {
            rekom.push('⚠️ Suhu terlalu tinggi. Tambah aerasi');
        }
    }

    if (rekom.length === 0) {
        rekom.push('✅ Kondisi air baik. Lanjutkan perawatan rutin.');
    }

    return rekom;
};

export default function KualitasAirPage() {
    const { kolam, kondisiAir, addKondisiAir } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [showRekomendasi, setShowRekomendasi] = useState<string[] | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pagination state
    const [limitKondisiAir, setLimitKondisiAir] = useState(10);

    // Filtered and sorted data
    const filteredKondisiAir = kondisiAir
        .slice()
        .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
        .slice(0, limitKondisiAir);

    const [formData, setFormData] = useState({
        kolamId: '',
        tanggal: new Date().toISOString().split('T')[0],
        warna: 'Hijau cerah',
        bau: 'Normal',
        ketinggian: '',
        ph: '',
        suhu: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.kolamId || !formData.ketinggian) return;
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const newKondisi = {
                kolamId: formData.kolamId,
                tanggal: formData.tanggal,
                warna: formData.warna,
                bau: formData.bau,
                ketinggian: parseFloat(formData.ketinggian),
                ph: formData.ph ? parseFloat(formData.ph) : undefined,
                suhu: formData.suhu ? parseFloat(formData.suhu) : undefined,
            };

            addKondisiAir(newKondisi);

            // Show recommendations
            const rekom = getRekomendasi(newKondisi.warna, newKondisi.bau, newKondisi.ph, newKondisi.suhu);
            setShowRekomendasi(rekom);

            setFormData({
                kolamId: '',
                tanggal: new Date().toISOString().split('T')[0],
                warna: 'Hijau cerah',
                bau: 'Normal',
                ketinggian: '',
                ph: '',
                suhu: '',
            });
            setShowForm(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 sm:gap-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Monitoring Kualitas Air</h1>
                        <p className="text-slate-500 text-sm">Catat kondisi air dan dapatkan rekomendasi tindakan secara real-time.</p>
                    </div>
                    <button onClick={() => setShowForm(true)} className="btn btn-primary text-sm px-4 py-2">
                        <PlusIcon />
                        Input Kondisi Air
                    </button>
                </div>

                {/* Rekomendasi Alert */}
                {showRekomendasi && (
                    <div className="alert alert-info">
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                                💡 Rekomendasi Tindakan
                            </h3>
                            <ul className="space-y-2">
                                {showRekomendasi.map((r, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-700 text-sm">
                                        <span className="mt-1 block w-2 h-2 rounded-full bg-blue-400 flex-shrink-0"></span>
                                        <span>{r}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <button
                            onClick={() => setShowRekomendasi(null)}
                            className="text-slate-400 hover:text-slate-600 font-bold self-start"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {kolam.map(k => {
                        const latestKondisi = kondisiAir.find(ka => ka.kolamId === k.id);
                        const warnaStatus = latestKondisi
                            ? warnaOptions.find(w => w.value === latestKondisi.warna)?.status || 'good'
                            : 'unknown';

                        const statusBadge = warnaStatus === 'good' ? 'bg-emerald-100 text-emerald-700' :
                            warnaStatus === 'warning' ? 'bg-amber-100 text-amber-700' :
                                warnaStatus === 'bad' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700';

                        return (
                            <div key={k.id} className="card p-5 group hover:shadow-md transition-all border border-slate-100 bg-white">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-slate-900 text-lg">{k.nama}</h3>
                                    {latestKondisi && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusBadge}`}>
                                            {latestKondisi.warna}
                                        </span>
                                    )}
                                </div>
                                {latestKondisi ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-xs text-slate-400">
                                            <span>Update Terakhir</span>
                                            <span className="font-medium text-slate-500">{new Date(latestKondisi.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">pH</p>
                                                <p className="text-xl font-bold text-slate-900 mt-0.5">{latestKondisi.ph || '-'}</p>
                                            </div>
                                            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Suhu</p>
                                                <p className="text-xl font-bold text-slate-900 mt-0.5">{latestKondisi.suhu ? `${latestKondisi.suhu}°` : '-'}<span className="text-xs font-medium text-slate-400 ml-0.5">C</span></p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30">
                                        <div className="text-2xl mb-2 opacity-30">💧</div>
                                        <p className="text-xs text-slate-400 font-medium">Belum ada data</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Histori */}
                <div className="table-wrapper">
                    <div className="px-6 py-4 border-b border-slate-200 bg-white">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <span>💧</span>
                            <span>Histori Kondisi Air</span>
                        </h2>
                    </div>
                    {kondisiAir.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                title="Belum Ada Data Kondisi Air"
                                description="Mulai catat kondisi air untuk mendapatkan rekomendasi."
                                icon="💧"
                            />
                        </div>
                    ) : (
                        <>
                            <table className="table table-compact">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-4">Tanggal</th>
                                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-4">Kolam</th>
                                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-4">Warna</th>
                                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-4">Bau</th>
                                        <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-4">Ketinggian</th>
                                        <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-4">pH</th>
                                        <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-4 border-r-0">Suhu</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredKondisiAir.map(ka => {
                                        const k = kolam.find(kol => kol.id === ka.kolamId);
                                        const warnaStatus = warnaOptions.find(w => w.value === ka.warna)?.status || 'good';

                                        const badgeStyles = warnaStatus === 'good' ? 'bg-emerald-50 text-emerald-600' :
                                            warnaStatus === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600';

                                        return (
                                            <tr key={ka.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-slate-500">{new Date(ka.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                                <td className="px-6 py-4 text-sm font-semibold text-slate-700">{k?.nama || 'Unknown'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badgeStyles}`}>
                                                        {ka.warna}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{ka.bau}</td>
                                                <td className="px-6 py-4 text-right text-sm font-medium text-slate-700">{ka.ketinggian}m</td>
                                                <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">{ka.ph || '-'}</td>
                                                <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">{ka.suhu ? `${ka.suhu}°C` : '-'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <p className="text-sm text-slate-500">
                                    Menampilkan {Math.min(limitKondisiAir, filteredKondisiAir.length)} dari {kondisiAir.length} data
                                </p>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-slate-600">Tampilkan:</label>
                                    <select
                                        value={limitKondisiAir}
                                        onChange={(e) => setLimitKondisiAir(Number(e.target.value))}
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
                    )}
                </div>
            </div>

            {/* Form Modal */}
            <Modal
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                title="Input Kondisi Air"
                footer={
                    <>
                        <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
                        <button type="submit" form="kualitas-air-form" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? <LoadingSpinner className="w-5 h-5" /> : 'Simpan & Lihat Rekomendasi'}
                        </button>
                    </>
                }
            >
                <form id="kualitas-air-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Kolam</label>
                            <select
                                value={formData.kolamId}
                                onChange={(e) => setFormData({ ...formData, kolamId: e.target.value })}
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Warna Air</label>
                            <select
                                value={formData.warna}
                                onChange={(e) => setFormData({ ...formData, warna: e.target.value })}
                                className="input"
                            >
                                {warnaOptions.map(w => (
                                    <option key={w.value} value={w.value}>{w.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Bau</label>
                            <select
                                value={formData.bau}
                                onChange={(e) => setFormData({ ...formData, bau: e.target.value })}
                                className="input"
                            >
                                {bauOptions.map(b => (
                                    <option key={b.value} value={b.value}>{b.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Ketinggian Air (m)</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.ketinggian}
                            onChange={(e) => setFormData({ ...formData, ketinggian: e.target.value })}
                            placeholder="Contoh: 1.2"
                            className="input"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">pH (opsional)</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="14"
                                value={formData.ph}
                                onChange={(e) => setFormData({ ...formData, ph: e.target.value })}
                                placeholder="6.5 - 8.5"
                                className="input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Suhu °C (opsional)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.suhu}
                                onChange={(e) => setFormData({ ...formData, suhu: e.target.value })}
                                placeholder="25-30"
                                className="input"
                            />
                        </div>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
