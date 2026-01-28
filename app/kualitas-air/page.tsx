'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import { useState } from 'react';
import { useApp } from '../context/AppContext';

import { PlusIcon } from '../components/ui/Icons';
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
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Monitoring Kualitas Air</h1>
                    <p className="text-slate-500 mt-1">Catat kondisi air dan dapatkan rekomendasi tindakan</p>
                </div>
                <button onClick={() => setShowForm(true)} className="btn btn-primary">
                    <PlusIcon />
                    Input Kondisi Air
                </button>
            </div>

            {/* Rekomendasi Alert */}
            {showRekomendasi && (
                <div className="card mb-8 border-l-4 border-teal-500 overflow-hidden">
                    <div className="bg-teal-50 p-4 border-b border-teal-100 flex justify-between items-center">
                        <h3 className="font-bold text-teal-800 flex items-center gap-2">
                            💡 Rekomendasi Tindakan
                        </h3>
                        <button
                            onClick={() => setShowRekomendasi(null)}
                            className="text-teal-400 hover:text-teal-600 font-bold"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="p-4">
                        <ul className="space-y-3">
                            {showRekomendasi.map((r, i) => (
                                <li key={i} className="flex items-start gap-3 text-slate-700">
                                    <span className="mt-1 block w-2 h-2 rounded-full bg-teal-400 flex-shrink-0"></span>
                                    <span>{r}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {kolam.map(k => {
                    const latestKondisi = kondisiAir.find(ka => ka.kolamId === k.id);
                    const warnaStatus = latestKondisi
                        ? warnaOptions.find(w => w.value === latestKondisi.warna)?.status || 'good'
                        : 'unknown';

                    const statusColor = warnaStatus === 'good' ? 'bg-green-100 text-green-700' :
                        warnaStatus === 'warning' ? 'bg-amber-100 text-amber-700' :
                            warnaStatus === 'bad' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500';

                    return (
                        <div key={k.id} className="card p-4">
                            <h3 className="font-semibold text-slate-900 mb-2 border-b border-slate-100 pb-2">{k.nama}</h3>
                            {latestKondisi ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className={`px-2 py-1 rounded-md text-xs font-bold ${statusColor}`}>
                                            {latestKondisi.warna}
                                        </div>
                                        <span className="text-xs text-slate-400">{latestKondisi.tanggal}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="bg-slate-50 p-2 rounded">
                                            <p className="text-xs text-slate-500">pH</p>
                                            <p className="font-bold text-slate-700">{latestKondisi.ph || '-'}</p>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded">
                                            <p className="text-xs text-slate-500">Suhu</p>
                                            <p className="font-bold text-slate-700">{latestKondisi.suhu ? `${latestKondisi.suhu}°C` : '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-4 text-center">
                                    <p className="text-sm text-slate-400 italic">Belum ada data</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Histori */}
            <div className="card overflow-hidden">
                <div className="p-6 border-b">
                    <h2 className="text-lg font-semibold text-slate-900">Histori Kondisi Air</h2>
                </div>
                {kondisiAir.length === 0 ? (
                    <EmptyState
                        title="Belum Ada Data Kondisi Air"
                        description="Mulai catat kondisi air untuk mendapatkan rekomendasi."
                        icon="💧"
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Kolam</th>
                                    <th>Warna</th>
                                    <th>Bau</th>
                                    <th>Ketinggian</th>
                                    <th>pH</th>
                                    <th>Suhu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {kondisiAir.map(ka => {
                                    const k = kolam.find(kol => kol.id === ka.kolamId);
                                    const warnaStatus = warnaOptions.find(w => w.value === ka.warna)?.status || 'good';

                                    return (
                                        <tr key={ka.id}>
                                            <td>{ka.tanggal}</td>
                                            <td className="font-medium">{k?.nama || 'Unknown'}</td>
                                            <td>
                                                <span className={`badge ${warnaStatus === 'good' ? 'badge-success' :
                                                    warnaStatus === 'warning' ? 'badge-warning' : 'badge-danger'
                                                    }`}>{ka.warna}</span>
                                            </td>
                                            <td>{ka.bau}</td>
                                            <td>{ka.ketinggian} m</td>
                                            <td>{ka.ph || '-'}</td>
                                            <td>{ka.suhu ? `${ka.suhu}°C` : '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Form Modal */}
            <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Input Kondisi Air">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Kolam</label>
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
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal</label>
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
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Warna Air</label>
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
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Bau</label>
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

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Ketinggian Air (m)</label>
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
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">pH (opsional)</label>
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
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Suhu °C (opsional)</label>
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

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="flex-1 btn btn-secondary"
                        >
                            Batal
                        </button>
                        <button type="submit" className="flex-1 btn btn-primary">
                            Simpan & Lihat Rekomendasi
                        </button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
