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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
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
                <div className="alert alert-info mb-6 sm:mb-8">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {kolam.map(k => {
                    const latestKondisi = kondisiAir.find(ka => ka.kolamId === k.id);
                    const warnaStatus = latestKondisi
                        ? warnaOptions.find(w => w.value === latestKondisi.warna)?.status || 'good'
                        : 'unknown';

                    const statusBadge = warnaStatus === 'good' ? 'badge-success' :
                        warnaStatus === 'warning' ? 'badge-warning' :
                            warnaStatus === 'bad' ? 'badge-danger' : 'badge-neutral';

                    return (
                        <div key={k.id} className="card p-4">
                            <h3 className="font-semibold text-slate-900 mb-2 border-b border-slate-100 pb-2">{k.nama}</h3>
                            {latestKondisi ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className={`badge badge-sm ${statusBadge}`}>
                                            {latestKondisi.warna}
                                        </span>
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
                                <div className="py-4 text-center !border-dashed !border-slate-300 !bg-slate-50 rounded-lg border-2">
                                    <p className="text-sm text-slate-400 italic">Belum ada data</p>
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
                            <tr>
                                <th>Tanggal</th>
                                <th>Kolam</th>
                                <th>Warna</th>
                                <th>Bau</th>
                                <th className="text-right">Ketinggian</th>
                                <th className="text-right">pH</th>
                                <th className="text-right">Suhu</th>
                            </tr>
                        </thead>
                        <tbody>
                                {filteredKondisiAir.map(ka => {
                                    const k = kolam.find(kol => kol.id === ka.kolamId);
                                    const warnaStatus = warnaOptions.find(w => w.value === ka.warna)?.status || 'good';

                                    return (
                                        <tr key={ka.id}>
                                            <td className="text-small">{ka.tanggal}</td>
                                            <td className="text-strong">{k?.nama || 'Unknown'}</td>
                                            <td>
                                                <span className={`badge ${warnaStatus === 'good' ? 'badge-success' :
                                                    warnaStatus === 'warning' ? 'badge-warning' : 'badge-danger'
                                                    }`}>{ka.warna}</span>
                                            </td>
                                            <td className="text-small">{ka.bau}</td>
                                            <td className="text-right text-small">{ka.ketinggian} m</td>
                                            <td className="text-right text-small">{ka.ph || '-'}</td>
                                            <td className="text-right text-small">{ka.suhu ? `${ka.suhu}°C` : '-'}</td>
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

            {/* Form Modal */}
            <Modal 
                isOpen={showForm} 
                onClose={() => setShowForm(false)} 
                title="Input Kondisi Air"
                footer={
                    <>
                        <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
                        <button type="submit" form="kualitas-air-form" className="btn btn-primary">Simpan & Lihat Rekomendasi</button>
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
