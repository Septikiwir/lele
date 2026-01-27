'use client';

import DashboardLayout from '../../components/layout/DashboardLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';

const ArrowLeftIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

export default function TambahKolamPage() {
    const router = useRouter();
    const { addKolam } = useApp();

    const [formData, setFormData] = useState({
        nama: '',
        panjang: '',
        lebar: '',
        kedalaman: '',
        tanggalTebar: new Date().toISOString().split('T')[0],
        jumlahIkan: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.nama.trim()) newErrors.nama = 'Nama kolam wajib diisi';
        if (!formData.panjang || parseFloat(formData.panjang) <= 0) newErrors.panjang = 'Panjang harus lebih dari 0';
        if (!formData.lebar || parseFloat(formData.lebar) <= 0) newErrors.lebar = 'Lebar harus lebih dari 0';
        if (!formData.kedalaman || parseFloat(formData.kedalaman) <= 0) newErrors.kedalaman = 'Kedalaman harus lebih dari 0';
        if (!formData.tanggalTebar) newErrors.tanggalTebar = 'Tanggal tebar wajib diisi';
        if (!formData.jumlahIkan || parseInt(formData.jumlahIkan) <= 0) newErrors.jumlahIkan = 'Jumlah ikan harus lebih dari 0';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        addKolam({
            nama: formData.nama,
            panjang: parseFloat(formData.panjang),
            lebar: parseFloat(formData.lebar),
            kedalaman: parseFloat(formData.kedalaman),
            tanggalTebar: formData.tanggalTebar,
            jumlahIkan: parseInt(formData.jumlahIkan),
        });

        router.push('/kolam');
    };

    // Preview calculations
    const panjang = parseFloat(formData.panjang) || 0;
    const lebar = parseFloat(formData.lebar) || 0;
    const kedalaman = parseFloat(formData.kedalaman) || 0;
    const jumlahIkan = parseInt(formData.jumlahIkan) || 0;
    const luas = panjang * lebar;
    const volume = luas * kedalaman;
    const kepadatan = volume > 0 ? jumlahIkan / volume : 0;

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-8">
                <Link href="/kolam" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
                    <ArrowLeftIcon />
                    Kembali ke Daftar Kolam
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Tambah Kolam Baru</h1>
                <p className="text-slate-500 mt-1">Isi data kolam untuk mulai memantau</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="card p-6 space-y-6">
                        {/* Nama Kolam */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Nama Kolam <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.nama}
                                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                placeholder="Contoh: Kolam A1"
                                className={`input ${errors.nama ? 'input-error' : ''}`}
                            />
                            {errors.nama && <p className="text-red-500 text-sm mt-1">{errors.nama}</p>}
                        </div>

                        {/* Dimensi */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Dimensi Kolam <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={formData.panjang}
                                        onChange={(e) => setFormData({ ...formData, panjang: e.target.value })}
                                        placeholder="Panjang"
                                        className={`input ${errors.panjang ? 'input-error' : ''}`}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Panjang (m)</p>
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={formData.lebar}
                                        onChange={(e) => setFormData({ ...formData, lebar: e.target.value })}
                                        placeholder="Lebar"
                                        className={`input ${errors.lebar ? 'input-error' : ''}`}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Lebar (m)</p>
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={formData.kedalaman}
                                        onChange={(e) => setFormData({ ...formData, kedalaman: e.target.value })}
                                        placeholder="Kedalaman"
                                        className={`input ${errors.kedalaman ? 'input-error' : ''}`}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Kedalaman (m)</p>
                                </div>
                            </div>
                        </div>

                        {/* Tanggal Tebar */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Tanggal Tebar <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.tanggalTebar}
                                onChange={(e) => setFormData({ ...formData, tanggalTebar: e.target.value })}
                                className={`input ${errors.tanggalTebar ? 'input-error' : ''}`}
                            />
                            {errors.tanggalTebar && <p className="text-red-500 text-sm mt-1">{errors.tanggalTebar}</p>}
                        </div>

                        {/* Jumlah Ikan */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Jumlah Ikan <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.jumlahIkan}
                                onChange={(e) => setFormData({ ...formData, jumlahIkan: e.target.value })}
                                placeholder="Contoh: 5000"
                                className={`input ${errors.jumlahIkan ? 'input-error' : ''}`}
                            />
                            {errors.jumlahIkan && <p className="text-red-500 text-sm mt-1">{errors.jumlahIkan}</p>}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-4 border-t">
                            <Link href="/kolam" className="btn btn-secondary flex-1">
                                Batal
                            </Link>
                            <button type="submit" className="btn btn-primary flex-1">
                                Simpan Kolam
                            </button>
                        </div>
                    </form>
                </div>

                {/* Preview */}
                <div className="lg:col-span-1">
                    <div className="card p-6 sticky top-8">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Preview Kolam</h3>

                        {/* Visual Grid Preview */}
                        <div className="bg-slate-100 rounded-xl p-4 mb-6 aspect-video flex items-center justify-center">
                            {panjang > 0 && lebar > 0 ? (
                                <div
                                    className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center text-white text-4xl shadow-lg"
                                    style={{
                                        width: `${Math.min(panjang / Math.max(panjang, lebar) * 100, 100)}%`,
                                        height: `${Math.min(lebar / Math.max(panjang, lebar) * 100, 100)}%`,
                                        minWidth: '60px',
                                        minHeight: '40px',
                                    }}
                                >
                                    🐟
                                </div>
                            ) : (
                                <p className="text-slate-400 text-sm">Masukkan dimensi untuk preview</p>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500">Luas</span>
                                <span className="font-semibold text-slate-900">{luas.toFixed(1)} m²</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500">Volume</span>
                                <span className="font-semibold text-slate-900">{volume.toFixed(1)} m³</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500">Kepadatan</span>
                                <span className={`font-semibold ${kepadatan === 0 ? 'text-slate-400' :
                                        kepadatan <= 50 ? 'text-green-600' :
                                            kepadatan <= 100 ? 'text-amber-600' : 'text-red-600'
                                    }`}>
                                    {kepadatan.toFixed(1)} ekor/m³
                                </span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-slate-500">Status</span>
                                <span className={`badge ${kepadatan === 0 ? 'badge-info' :
                                        kepadatan <= 50 ? 'badge-success' :
                                            kepadatan <= 100 ? 'badge-warning' : 'badge-danger'
                                    }`}>
                                    {kepadatan === 0 ? '-' :
                                        kepadatan <= 50 ? 'Aman' :
                                            kepadatan <= 100 ? 'Waspada' : 'Berisiko'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
