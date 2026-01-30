'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import { useState, useEffect } from 'react';
import { useApp, JadwalPakan } from '../context/AppContext';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils';

import { PlusIcon, TrashIcon, WarningIcon, ClockIcon, LoadingSpinner, CalendarIcon, ArrowRightIcon } from '../components/ui/Icons';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';

export default function PakanPage() {
    const {
        kolam,
        pakan,
        stokPakan,
        jadwalPakan,
        addPakan,
        addStokPakan,
        deleteStokPakan,
        addJadwalPakan,
        updateJadwalPakan,
        deleteJadwalPakan,
        calculateFCR,
        getStokTersediaByJenis,
        getAllJenisPakan,
    } = useApp();


    const [showForm, setShowForm] = useState(false);
    const [showStokForm, setShowStokForm] = useState(false);
    const [showJadwalForm, setShowJadwalForm] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ type: 'stok' | 'jadwal', id: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pagination states
    const [limitRiwayatPakan, setLimitRiwayatPakan] = useState(10);


    // Initial Active Tab Logic based on hash or default


    const [formData, setFormData] = useState({
        kolamId: '',
        tanggal: new Date().toISOString().split('T')[0],
        jumlahKg: '',
        jenisPakan: 'Pelet Hi-Pro',
    });

    const [stokFormData, setStokFormData] = useState({
        jenisPakan: '',
        stokAwal: '',
        hargaPerKg: '',
        tanggalTambah: new Date().toISOString().split('T')[0],
        keterangan: '',
    });

    const [jadwalForm, setJadwalForm] = useState({
        kolamId: '',
        waktu: '07:00',
        jenisPakan: 'Pelet Hi-Pro',
        jumlahKg: '',
        keterangan: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.kolamId || !formData.jumlahKg) return;
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            addPakan({
                kolamId: formData.kolamId,
                tanggal: formData.tanggal,
                jumlahKg: parseFloat(formData.jumlahKg),
                jenisPakan: formData.jenisPakan,
            });

            setFormData({
                kolamId: '',
                tanggal: new Date().toISOString().split('T')[0],
                jumlahKg: '',
                jenisPakan: 'Pelet Hi-Pro',
            });
            setShowForm(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStokSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!stokFormData.jenisPakan || !stokFormData.stokAwal || !stokFormData.hargaPerKg) return;
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            addStokPakan({
                jenisPakan: stokFormData.jenisPakan,
                stokAwal: parseFloat(stokFormData.stokAwal),
                hargaPerKg: parseFloat(stokFormData.hargaPerKg),
                tanggalTambah: stokFormData.tanggalTambah,
                keterangan: stokFormData.keterangan || undefined,
            });

            setStokFormData({
                jenisPakan: '',
                stokAwal: '',
                hargaPerKg: '',
                tanggalTambah: new Date().toISOString().split('T')[0],
                keterangan: '',
            });
            setShowStokForm(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleJadwalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!jadwalForm.kolamId || !jadwalForm.waktu || !jadwalForm.jumlahKg) return;
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            addJadwalPakan({
                kolamId: jadwalForm.kolamId,
                waktu: jadwalForm.waktu,
                jenisPakan: jadwalForm.jenisPakan,
                jumlahKg: parseFloat(jadwalForm.jumlahKg),
                keterangan: jadwalForm.keterangan || undefined,
                aktif: true,
            });

            setJadwalForm({
                kolamId: '',
                waktu: '07:00',
                jenisPakan: 'Pelet Hi-Pro',
                jumlahKg: '',
                keterangan: '',
            });
            setShowJadwalForm(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleJadwalAktif = (id: string, currentStatus: boolean) => {
        updateJadwalPakan(id, { aktif: !currentStatus });
    };

    const handleDelete = () => {
        if (!deleteModal) return;
        if (deleteModal.type === 'stok') {
            deleteStokPakan(deleteModal.id);
        } else {
            deleteJadwalPakan(deleteModal.id);
        }
        setDeleteModal(null);
    };

    // Derived Data
    const allJenisPakan = getAllJenisPakan();

    // Filtered and sorted data
    const filteredRiwayatPakan = pakan
        .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
        .slice(0, limitRiwayatPakan);


    // ... (keep existing state and logic)

    // Calculate Grid KPIs
    // Next Feeding Logic
    const getNextFeeding = () => {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const activeSchedules = jadwalPakan.filter(j => j.aktif);

        // Find next schedule today
        let next = activeSchedules.find(j => j.waktu > currentTime);

        // If no more today, get earliest tomorrow
        if (!next && activeSchedules.length > 0) {
            next = activeSchedules.sort((a, b) => a.waktu.localeCompare(b.waktu))[0];
        }

        return next;
    };

    const nextFeeding = getNextFeeding();
    const nextKolam = nextFeeding ? kolam.find(k => k.id === nextFeeding.kolamId) : null;

    // Calculate Grid KPIs
    const totalStokKg = allJenisPakan.reduce((sum, jenis) => sum + getStokTersediaByJenis(jenis), 0);
    const pakanHariIni = pakan
        .filter(p => p.tanggal === new Date().toISOString().split('T')[0])
        .reduce((sum, p) => sum + p.jumlahKg, 0);

    // Sort schedules
    const sortedJadwal = [...jadwalPakan].sort((a, b) => a.waktu.localeCompare(b.waktu));

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Header & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Pakan</h1>
                        <p className="text-slate-500 text-sm">Monitor stok, jadwal, dan riwayat pemberian pakan.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowStokForm(true)} className="btn btn-secondary text-sm">
                            📦 Tambah Stok
                        </button>
                        <button onClick={() => setShowForm(true)} className="btn btn-primary text-sm">
                            🍚 Catat Pakan
                        </button>
                    </div>
                </div>

                {/* KPI Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    {/* 1. Total Stok */}
                    <div className="stat-card p-6 bg-white border border-slate-100 group relative overflow-hidden">
                        <div className="flex items-start justify-between z-10 relative">
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Stok</p>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <p className="text-2xl font-bold text-slate-900">{totalStokKg.toFixed(1)}</p>
                                    <span className="text-xs text-slate-400 font-normal">kg</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-100 transition-colors">
                                <span className="text-xl">📦</span>
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-slate-500">
                            {allJenisPakan.length} jenis pakan tersedia
                        </div>
                    </div>

                    {/* 2. Pakan Hari Ini */}
                    <div className="stat-card p-6 bg-white border border-slate-100 group relative overflow-hidden">
                        <div className="flex items-start justify-between z-10 relative">
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Konsumsi Hari Ini</p>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <p className="text-2xl font-bold text-slate-900">{pakanHariIni.toFixed(1)}</p>
                                    <span className="text-xs text-slate-400 font-normal">kg</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                                <CalendarIcon />
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-slate-500">
                            Total pakan diberikan hari ini
                        </div>
                    </div>

                    {/* 3. Jadwal Berikutnya */}
                    <div className="stat-card p-6 bg-white border border-slate-100 group relative overflow-hidden">
                        <div className="flex items-start justify-between z-10 relative">
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Jadwal Berikutnya</p>
                                {nextFeeding ? (
                                    <div className="mt-1">
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-2xl font-bold text-teal-600">{nextFeeding.waktu}</p>
                                            <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                                                {nextKolam?.nama}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <p className="text-xl font-bold text-slate-400">Selesai</p>
                                    </div>
                                )}
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 group-hover:bg-teal-100 transition-colors">
                                <ClockIcon />
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-slate-500">
                            {nextFeeding ? `${nextFeeding.jumlahKg} kg • ${nextFeeding.jenisPakan}` : 'Tidak ada jadwal tersisa hari ini'}
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT COLUMN (2/3) - Jadwal & Riwayat */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Section: Jadwal Rutin */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                    <ClockIcon /> Rutinitas Pemberian Pakan
                                </h3>
                                <button onClick={() => setShowJadwalForm(true)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                                    + Atur Jadwal
                                </button>
                            </div>
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {sortedJadwal.length === 0 ? (
                                    <div className="col-span-full py-8 text-center text-slate-400 italic">
                                        Belum ada jadwal rutin.
                                    </div>
                                ) : (
                                    sortedJadwal.map(jadwal => {
                                        const k = kolam.find(item => item.id === jadwal.kolamId);
                                        return (
                                            <div key={jadwal.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${jadwal.aktif ? 'bg-white border-slate-200 hover:border-teal-300 hover:shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                                <div className={`mt-1 font-bold text-lg ${jadwal.aktif ? 'text-teal-600' : 'text-slate-400'}`}>
                                                    {jadwal.waktu}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-slate-900 truncate">{k?.nama}</h4>
                                                    <p className="text-sm text-slate-500 truncate">{jadwal.jumlahKg} kg • {jadwal.jenisPakan}</p>
                                                    {jadwal.keterangan && <p className="text-xs text-slate-400 mt-1 italic">&quot;{jadwal.keterangan}&quot;</p>}
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={jadwal.aktif}
                                                            onChange={() => toggleJadwalAktif(jadwal.id, jadwal.aktif)}
                                                        />
                                                        <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-teal-500"></div>
                                                    </label>
                                                    <button
                                                        onClick={() => setDeleteModal({ type: 'jadwal', id: jadwal.id })}
                                                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Section: Riwayat Table */}
                        <div className="bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-transparent">
                                <h3 className="font-bold text-slate-800">Riwayat Terakhir</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Waktu</th>
                                            <th>Kolam</th>
                                            <th>Pakan</th>
                                            <th className="text-right">Jumlah</th>
                                            <th className="text-right">FCR Est.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pakan.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center text-slate-400 py-8">
                                                    Belum ada data riwayat.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredRiwayatPakan.map(p => {
                                                const k = kolam.find(item => item.id === p.kolamId);
                                                const fcr = calculateFCR(p.kolamId);
                                                return (
                                                    <tr key={p.id}>
                                                        <td className="text-slate-500">{p.tanggal}</td>
                                                        <td className="font-medium text-slate-900">{k?.nama}</td>
                                                        <td>
                                                            <span className="badge badge-warning">
                                                                {p.jenisPakan}
                                                            </span>
                                                        </td>
                                                        <td className="text-right font-medium text-slate-900">{p.jumlahKg} kg</td>
                                                        <td className="text-right text-slate-500">{fcr > 0 ? fcr.toFixed(2) : '-'}</td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-6 py-4 border-t border-slate-100 flex justify-end items-center bg-slate-50/50">
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span>Tampilkan</span>
                                    <select
                                        value={limitRiwayatPakan}
                                        onChange={(e) => setLimitRiwayatPakan(Number(e.target.value))}
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

                    {/* RIGHT COLUMN (1/3) - Stok Pakan */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all p-6 h-full">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-semibold text-slate-800">Stok Pakan</h3>
                                <button onClick={() => setShowStokForm(true)} className="text-xs btn btn-outline btn-sm py-1 px-2 h-auto min-h-0">
                                    + Isi Stok
                                </button>
                            </div>
                            <div className="space-y-3">
                                {allJenisPakan.length === 0 && (
                                    <div className="text-center text-slate-400 italic">
                                        Belum ada jenis pakan.
                                    </div>
                                )}
                                {allJenisPakan.map((jenis, index) => {
                                    const tersedia = getStokTersediaByJenis(jenis);
                                    const isLow = tersedia <= 10;

                                    const feedThemes = [
                                        { bg: 'hover:bg-cyan-50/30', border: 'hover:border-cyan-200', bar: 'bg-cyan-500' },
                                        { bg: 'hover:bg-amber-50/30', border: 'hover:border-amber-200', bar: 'bg-amber-500' },
                                        { bg: 'hover:bg-purple-50/30', border: 'hover:border-purple-200', bar: 'bg-purple-500' },
                                        { bg: 'hover:bg-blue-50/30', border: 'hover:border-blue-200', bar: 'bg-blue-500' },
                                        { bg: 'hover:bg-emerald-50/30', border: 'hover:border-emerald-200', bar: 'bg-emerald-500' },
                                        { bg: 'hover:bg-rose-50/30', border: 'hover:border-rose-200', bar: 'bg-rose-500' },
                                    ];
                                    const theme = feedThemes[index % feedThemes.length];

                                    return (
                                        <div key={jenis} className={`p-3 rounded-xl border transition-all bg-white border-slate-100 ${theme.bg} ${theme.border}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-semibold text-slate-800">{jenis}</h4>
                                                    {isLow && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-100 px-1.5 py-0.5 rounded-md">
                                                            !
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-sm font-medium block ${isLow ? 'text-red-600' : 'text-slate-900'}`}>
                                                        {tersedia.toFixed(1)} <span className="text-xs font-normal text-slate-500">kg</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                                                <div
                                                    className={`h-1.5 rounded-full ${isLow ? 'bg-red-500' : theme.bar}`}
                                                    style={{ width: `${Math.min(tersedia, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Riwayat Stok Small Link */}
                            <div className="mt-6 text-center">
                                <button
                                    onClick={() => {
                                        alert("Fitur Riwayat Stok Detail akan segera hadir!");
                                    }}
                                    className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center justify-center gap-1 w-full"
                                >
                                    Lihat Riwayat Masuk <ArrowRightIcon className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal - Tambah Pemberian Pakan */}
            <Modal
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                title="Catat Pemberian Pakan"
                footer={
                    <>
                        <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
                        <button type="submit" form="pakan-form" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? <LoadingSpinner className="w-5 h-5" /> : 'Simpan'}
                        </button>
                    </>
                }
            >
                <form id="pakan-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-group">
                        <label className="form-label">Kolam</label>
                        <select
                            value={formData.kolamId}
                            onChange={(e) => setFormData({ ...formData, kolamId: e.target.value })}
                            className="input"
                            required
                        >
                            <option value="">-- Pilih Kolam --</option>
                            {kolam.map(k => (
                                <option key={k.id} value={k.id}>{k.nama} ({k.jumlahIkan} ekor)</option>
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

                    <div className="form-group">
                        <label className="form-label">Jenis Pakan</label>
                        <select
                            value={formData.jenisPakan}
                            onChange={(e) => setFormData({ ...formData, jenisPakan: e.target.value })}
                            className="input"
                        >
                            {allJenisPakan.length > 0 ? (
                                allJenisPakan.map(jenis => (
                                    <option key={jenis} value={jenis}>{jenis}</option>
                                ))
                            ) : (
                                <option value="Pelet Hi-Pro">Pelet Hi-Pro</option>
                            )}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Jumlah (kg)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={formData.jumlahKg}
                            onChange={(e) => setFormData({ ...formData, jumlahKg: e.target.value })}
                            placeholder="Contoh: 2.5"
                            className="input"
                            required
                        />
                    </div>
                </form>
            </Modal>

            {/* Modal - Tambah Stok */}
            <Modal
                isOpen={showStokForm}
                onClose={() => setShowStokForm(false)}
                title="Tambah Stok Pakan"
                footer={
                    <>
                        <button type="button" onClick={() => setShowStokForm(false)} className="btn btn-secondary">Batal</button>
                        <button type="submit" form="stok-form" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? <LoadingSpinner className="w-5 h-5" /> : 'Simpan Stok'}
                        </button>
                    </>
                }
            >
                <form id="stok-form" onSubmit={handleStokSubmit} className="space-y-4">
                    <div className="form-group">
                        <label className="form-label">Jenis Pakan</label>
                        <div className="space-y-2">
                            <input
                                type="text"
                                list="jenisPakanList"
                                value={stokFormData.jenisPakan}
                                onChange={(e) => setStokFormData({ ...stokFormData, jenisPakan: e.target.value })}
                                className="input"
                                placeholder="Pilih atau ketik baru..."
                                required
                            />
                            <datalist id="jenisPakanList">
                                {allJenisPakan.map(jenis => (
                                    <option key={jenis} value={jenis} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Jumlah Beli (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={stokFormData.stokAwal}
                                onChange={(e) => setStokFormData({ ...stokFormData, stokAwal: e.target.value })}
                                placeholder="Contoh: 50"
                                className="input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Harga per kg</label>
                            <input
                                type="text"
                                value={formatCurrencyInput(stokFormData.hargaPerKg)}
                                onChange={(e) => setStokFormData({ ...stokFormData, hargaPerKg: parseCurrencyInput(e.target.value) })}
                                placeholder="Contoh: 12.000"
                                className="input"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tanggal Beli</label>
                        <input
                            type="date"
                            value={stokFormData.tanggalTambah}
                            onChange={(e) => setStokFormData({ ...stokFormData, tanggalTambah: e.target.value })}
                            className="input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Keterangan (opsional)</label>
                        <input
                            type="text"
                            value={stokFormData.keterangan}
                            onChange={(e) => setStokFormData({ ...stokFormData, keterangan: e.target.value })}
                            placeholder="Contoh: Beli di toko tani"
                            className="input"
                        />
                    </div>
                </form>
            </Modal>

            {/* Modal - Tambah Jadwal */}
            <Modal
                isOpen={showJadwalForm}
                onClose={() => setShowJadwalForm(false)}
                title="Tambah Jadwal Pakan"
                footer={
                    <>
                        <button type="button" onClick={() => setShowJadwalForm(false)} className="btn btn-secondary">Batal</button>
                        <button type="submit" form="jadwal-form" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? <LoadingSpinner className="w-5 h-5" /> : 'Simpan Jadwal'}
                        </button>
                    </>
                }
            >
                <form id="jadwal-form" onSubmit={handleJadwalSubmit} className="space-y-4">
                    <div className="form-group">
                        <label className="form-label">Kolam</label>
                        <select
                            value={jadwalForm.kolamId}
                            onChange={(e) => setJadwalForm({ ...jadwalForm, kolamId: e.target.value })}
                            className="input"
                            required
                        >
                            <option value="">-- Pilih Kolam --</option>
                            {kolam.map(k => (
                                <option key={k.id} value={k.id}>{k.nama}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Jam</label>
                        <input
                            type="time"
                            value={jadwalForm.waktu}
                            onChange={(e) => setJadwalForm({ ...jadwalForm, waktu: e.target.value })}
                            className="input"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Jenis Pakan</label>
                            <select
                                value={jadwalForm.jenisPakan}
                                onChange={(e) => setJadwalForm({ ...jadwalForm, jenisPakan: e.target.value })}
                                className="input"
                            >
                                {allJenisPakan.map(jenis => (
                                    <option key={jenis} value={jenis}>{jenis}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Dosis (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={jadwalForm.jumlahKg}
                                onChange={(e) => setJadwalForm({ ...jadwalForm, jumlahKg: e.target.value })}
                                className="input"
                                placeholder="Contoh: 3"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Keterangan (opsional)</label>
                        <input
                            type="text"
                            value={jadwalForm.keterangan}
                            onChange={(e) => setJadwalForm({ ...jadwalForm, keterangan: e.target.value })}
                            placeholder="Contoh: Pakan pagi"
                            className="input"
                        />
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteModal}
                onClose={() => setDeleteModal(null)}
                title={`Hapus ${deleteModal?.type === 'stok' ? 'Stok' : 'Jadwal'}?`}
                size="sm"
            >
                <div className="text-center">
                    <div className="icon-box icon-box-lg icon-box-danger mx-auto mb-4">
                        <WarningIcon className="w-10 h-10" />
                    </div>
                    <p className="text-slate-600 mb-6">Data yang dihapus tidak dapat dikembalikan.</p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteModal(null)} className="flex-1 btn btn-secondary">
                            Batal
                        </button>
                        <button onClick={handleDelete} className="flex-1 btn btn-danger">
                            Hapus
                        </button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout >
    );
}
