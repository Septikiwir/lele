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
        getDailyFeedStatus,
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
    // Next Feeding Logic (SMART from all ponds)
    const getNextSmartFeeding = () => {
        const candidates = kolam.map(k => {
            const status = getDailyFeedStatus(k.id);
            // Parse time from schedule
            const nextLabel = status.schedule.next;
            let time = '23:59';
            let amount = 0;
            let dateSort = '9999-99-99'; // YYYY-MM-DD

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const todayStr = new Date().toISOString().split('T')[0];
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            if (nextLabel.includes('Pagi Ini')) {
                time = status.schedule.morning.time;
                amount = status.schedule.morning.amount;
                dateSort = todayStr + ' ' + time;
            } else if (nextLabel.includes('Sore Ini')) {
                time = status.schedule.evening.time;
                amount = status.schedule.evening.amount;
                dateSort = todayStr + ' ' + time;
            } else if (nextLabel.includes('Besok')) {
                time = status.schedule.morning.time;
                amount = status.schedule.morning.amount;
                dateSort = tomorrowStr + ' ' + time;
            }

            return {
                kolamId: k.id,
                kolamName: k.nama,
                time,
                amount,
                label: nextLabel,
                dateSort,
                jenisPakan: status.schedule.next // Just use label or derive feed type? 
                // Ideally detailed feed type, but generic for now is OK or derive from status
            };
        });

        // specific filtering: ignore "Besok" if others are "Hari Ini"?
        // Just sort by dateSort
        candidates.sort((a, b) => a.dateSort.localeCompare(b.dateSort));
        return candidates.length > 0 ? candidates[0] : null;
    };

    const nextSmart = getNextSmartFeeding();

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
                        <p className="text-slate-500 text-sm mt-1">Monitor stok, jadwal otomatis, dan riwayat pemberian pakan.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowStokForm(true)} className="btn btn-secondary text-sm flex items-center gap-2">
                            <span>📦</span> Tambah Stok
                        </button>
                        <button onClick={() => setShowForm(true)} className="btn btn-primary text-sm flex items-center gap-2 shadow-lg shadow-primary-500/20">
                            <PlusIcon className="w-5 h-5" /> Catat Pakan
                        </button>
                    </div>
                </div>

                {/* KPI Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    {/* 1. Total Stok */}
                    <div className="relative group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                        <div className="flex justify-between items-start z-10 relative">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Stok Pakan</p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <h3 className="text-3xl font-black text-slate-900">{totalStokKg.toFixed(1)}</h3>
                                    <span className="text-sm font-medium text-slate-500">kg</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-2 font-medium">
                                    {allJenisPakan.length} jenis tersedia
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                                <span className="text-2xl">📦</span>
                            </div>
                        </div>
                        {/* Decorative background element */}
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-orange-50 rounded-full opacity-0 group-hover:opacity-50 transition-opacity blur-2xl"></div>
                    </div>

                    {/* 2. Pakan Hari Ini */}
                    <div className="relative group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                        <div className="flex justify-between items-start z-10 relative">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Konsumsi Hari Ini</p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <h3 className="text-3xl font-black text-slate-900">{pakanHariIni.toFixed(1)}</h3>
                                    <span className="text-sm font-medium text-slate-500">kg</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-2 font-medium">
                                    Total pakan diberikan
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <CalendarIcon className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-50 rounded-full opacity-0 group-hover:opacity-50 transition-opacity blur-2xl"></div>
                    </div>

                    {/* 3. Jadwal Berikutnya (SMART) */}
                    <div className="relative group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                        <div className="flex justify-between items-start z-10 relative">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Jadwal Berikutnya</p>
                                <div className="mt-2">
                                    {nextSmart ? (
                                        <>
                                            <div className="flex items-baseline gap-2">
                                                <h3 className="text-3xl font-black text-teal-600">{nextSmart.time}</h3>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{nextSmart.label}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-sm font-bold text-slate-700 truncate max-w-[120px]">
                                                    {nextSmart.kolamName}
                                                </span>
                                                <span className="text-xs font-medium bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
                                                    {nextSmart.amount.toFixed(1)} kg
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <h3 className="text-2xl font-bold text-slate-400 mt-1">Selesai</h3>
                                    )}
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
                                <ClockIcon className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-teal-50 rounded-full opacity-0 group-hover:opacity-50 transition-opacity blur-2xl"></div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT COLUMN (2/3) - Jadwal & Riwayat */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Section: Smart Feed Schedule */}
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <ClockIcon className="w-5 h-5 text-slate-400" />
                                    <span>Target & Jadwal Pakan</span>
                                </h3>
                                <div className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full tracking-wider">
                                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </div>
                            </div>
                            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {kolam.map(k => {
                                    const status = getDailyFeedStatus(k.id);
                                    const isCukup = status.status === 'cukup';
                                    const isBerlebih = status.status === 'berlebih';

                                    // Determine amount to show for "Next Schedule"
                                    let nextAmount = 0;
                                    if (status.schedule.next.includes('Pagi')) nextAmount = status.schedule.morning.amount;
                                    else if (status.schedule.next.includes('Sore')) nextAmount = status.schedule.evening.amount;
                                    else if (status.schedule.next.includes('Besok')) nextAmount = status.schedule.morning.amount; // Loop to morning

                                    return (
                                        <div key={k.id} className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-300 hover:shadow-md transition-all space-y-4 relative overflow-hidden group">
                                            {/* Header */}
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-lg">{k.nama}</h4>
                                                    <p className="text-xs font-medium text-slate-500">{k.jumlahIkan.toLocaleString('id-ID')} ekor</p>
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${isBerlebih ? 'bg-red-100 text-red-700' :
                                                    isCukup ? 'bg-emerald-100 text-emerald-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {isBerlebih ? 'Stop' : isCukup ? 'Tercapai' : 'Proses'}
                                                </span>
                                            </div>

                                            {/* Progress */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs font-semibold">
                                                    <span className="text-slate-500">Harian</span>
                                                    <span className="text-slate-900">{status.progress.toFixed(0)}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-700 ease-out ${isBerlebih ? 'bg-red-500' : isCukup ? 'bg-emerald-500' : 'bg-amber-500'
                                                            }`}
                                                        style={{ width: `${Math.min(status.progress, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between text-[10px] font-medium text-slate-400">
                                                    <span>{status.actual.toFixed(1)} kg</span>
                                                    <span>Target: {status.target.toFixed(1)} kg</span>
                                                </div>
                                            </div>

                                            {/* Next Schedule */}
                                            <div className={`pt-3 border-t border-slate-50 mt-2 ${isCukup ? 'opacity-50' : ''}`}>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">Jadwal Berikutnya</p>
                                                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <ClockIcon className="w-4 h-4 text-slate-400" />
                                                        <span className="text-sm font-bold text-slate-700">{status.schedule.next}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                                                            {nextAmount.toFixed(1)} kg
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section: Riwayat Table */}
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-transparent">
                                <h3 className="font-bold text-slate-800 text-lg">Riwayat Terakhir</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Waktu</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kolam</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pakan</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Jumlah</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">FCR Est.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {pakan.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center text-slate-400 py-12">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <span className="text-3xl opacity-50">🍚</span>
                                                        <span className="text-sm">Belum ada data riwayat.</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredRiwayatPakan.map(p => {
                                                const k = kolam.find(item => item.id === p.kolamId);
                                                const fcr = calculateFCR(p.kolamId);
                                                return (
                                                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="px-6 py-3">
                                                            <div className="text-sm font-bold text-slate-700">
                                                                {new Date(p.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                                                {new Date(p.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-sm font-bold text-slate-900">{k?.nama}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-100">
                                                                {p.jenisPakan}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className="text-sm font-bold text-slate-900">{p.jumlahKg}</span>
                                                            <span className="text-xs text-slate-500 ml-1">kg</span>
                                                        </td>
                                                        <td className="px-6 py-3 text-right">
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${fcr > 0 && fcr <= 1.2 ? 'bg-emerald-100 text-emerald-700' : fcr <= 1.5 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                {fcr > 0 ? fcr.toFixed(2) : '-'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-6 py-4 border-t border-slate-100 flex justify-end items-center bg-slate-50/50">
                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                    <span>Tampilkan</span>
                                    <select
                                        value={limitRiwayatPakan}
                                        onChange={(e) => setLimitRiwayatPakan(Number(e.target.value))}
                                        className="bg-white border border-slate-200 text-xs rounded-lg px-2 py-1 focus:ring-2 focus:ring-slate-200 focus:border-slate-300 cursor-pointer font-bold outline-none shadow-sm"
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                    </select>
                                    <span>Baris</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN (1/3) - Stok Pakan */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 h-full flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-800 text-lg">Stok Pakan</h3>
                                <button onClick={() => setShowStokForm(true)} className="text-xs btn btn-outline btn-sm py-1.5 px-3 h-auto min-h-0 font-bold border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600">
                                    + Isi Stok
                                </button>
                            </div>
                            <div className="space-y-4 flex-1">
                                {allJenisPakan.length === 0 && (
                                    <div className="text-center text-slate-400 italic py-8 border-2 border-dashed border-slate-100 rounded-xl">
                                        Belum ada jenis pakan.
                                    </div>
                                )}
                                {allJenisPakan.map((jenis, index) => {
                                    const tersedia = getStokTersediaByJenis(jenis);
                                    const isLow = tersedia <= 10;

                                    const feedThemes = [
                                        { bg: 'bg-cyan-50/50 hover:bg-cyan-50', border: 'border-cyan-100 hover:border-cyan-200', bar: 'bg-cyan-500', text: 'text-cyan-700' },
                                        { bg: 'bg-amber-50/50 hover:bg-amber-50', border: 'border-amber-100 hover:border-amber-200', bar: 'bg-amber-500', text: 'text-amber-700' },
                                        { bg: 'bg-purple-50/50 hover:bg-purple-50', border: 'border-purple-100 hover:border-purple-200', bar: 'bg-purple-500', text: 'text-purple-700' },
                                        { bg: 'bg-blue-50/50 hover:bg-blue-50', border: 'border-blue-100 hover:border-blue-200', bar: 'bg-blue-500', text: 'text-blue-700' },
                                        { bg: 'bg-emerald-50/50 hover:bg-emerald-50', border: 'border-emerald-100 hover:border-emerald-200', bar: 'bg-emerald-500', text: 'text-emerald-700' },
                                        { bg: 'bg-rose-50/50 hover:bg-rose-50', border: 'border-rose-100 hover:border-rose-200', bar: 'bg-rose-500', text: 'text-rose-700' },
                                    ];
                                    const theme = feedThemes[index % feedThemes.length];

                                    return (
                                        <div key={jenis} className={`p-4 rounded-xl border transition-all duration-300 ${theme.bg} ${theme.border} group relative overflow-hidden`}>
                                            <div className="flex items-center justify-between mb-3 relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-8 rounded-full ${theme.bar}`}></span>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-800">{jenis}</h4>
                                                        <p className={`text-[10px] uppercase font-bold tracking-wide ${theme.text} opacity-80`}>Pakan Pelet</p>
                                                    </div>
                                                </div>
                                                {isLow && (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-100 px-2 py-1 rounded-full animate-pulse border border-red-200 shadow-sm">
                                                        Stok Menipis
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-end justify-between mb-2 relative z-10">
                                                <span className="text-xs font-semibold text-slate-500">Tersedia</span>
                                                <span className={`text-xl font-black block ${isLow ? 'text-red-600' : 'text-slate-900'}`}>
                                                    {tersedia.toFixed(1)} <span className="text-sm font-bold text-slate-400">kg</span>
                                                </span>
                                            </div>

                                            <div className="w-full bg-white/60 rounded-full h-2 relative z-10 backdrop-blur-sm">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-1000 ease-out ${isLow ? 'bg-red-500' : theme.bar}`}
                                                    style={{ width: `${Math.min(tersedia, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Riwayat Stok Small Link */}
                            <div className="mt-8 text-center pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => {
                                        alert("Fitur Riwayat Stok Detail akan segera hadir!");
                                    }}
                                    className="text-xs text-slate-500 hover:text-primary-600 font-bold uppercase tracking-widest flex items-center justify-center gap-2 w-full transition-colors"
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
