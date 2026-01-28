'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import { useState, useEffect } from 'react';
import { useApp, JadwalPakan } from '../context/AppContext';

import { PlusIcon, TrashIcon, WarningIcon, ClockIcon } from '../components/ui/Icons';
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

    const [activeTab, setActiveTab] = useState<'riwayat' | 'stok' | 'jadwal'>('jadwal');
    const [showForm, setShowForm] = useState(false);
    const [showStokForm, setShowStokForm] = useState(false);
    const [showJadwalForm, setShowJadwalForm] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ type: 'stok' | 'jadwal', id: string } | null>(null);

    // Initial Active Tab Logic based on hash or default
    useEffect(() => {
        if (window.location.hash === '#riwayat') setActiveTab('riwayat');
        if (window.location.hash === '#stok') setActiveTab('stok');
    }, []);

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
    };

    const handleStokSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!stokFormData.jenisPakan || !stokFormData.stokAwal || !stokFormData.hargaPerKg) return;

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
    };

    const handleJadwalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!jadwalForm.kolamId || !jadwalForm.waktu || !jadwalForm.jumlahKg) return;

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
    const uniqueJenisInUse = [...new Set(jadwalPakan.map(j => j.jenisPakan))]; // For options if needed
    const sortedJadwal = [...jadwalPakan].sort((a, b) => a.waktu.localeCompare(b.waktu));

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

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Manajemen Pakan</h1>
                    <p className="text-slate-500 mt-1">Jadwal, stok, dan pencatatan pemberian pakan</p>
                </div>
            </div>

            {/* Next Feeding Reminder Banner */}
            {nextFeeding && activeTab === 'jadwal' && (
                <div className="mb-8 p-6 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl text-white shadow-lg shadow-teal-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                            <ClockIcon />
                        </div>
                        <div>
                            <p className="text-teal-100 font-medium text-sm uppercase tracking-wider">Jadwal Selanjutnya</p>
                            <h2 className="text-2xl font-bold mt-1">
                                Pukul {nextFeeding.waktu} • {nextKolam?.nama}
                            </h2>
                            <p className="text-white/90 mt-1">
                                {nextFeeding.jumlahKg} kg {nextFeeding.jenisPakan} {nextFeeding.keterangan && `(${nextFeeding.keterangan})`}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6">
                <button
                    onClick={() => setActiveTab('jadwal')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'jadwal'
                        ? 'border-teal-600 text-teal-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    📅 Jadwal Pakan
                </button>
                <button
                    onClick={() => setActiveTab('riwayat')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'riwayat'
                        ? 'border-teal-600 text-teal-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    📝 Riwayat Pemberian
                </button>
                <button
                    onClick={() => setActiveTab('stok')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'stok'
                        ? 'border-teal-600 text-teal-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    📦 Stok Pakan
                </button>
            </div>

            {/* Content: Jadwal Pakan */}
            {activeTab === 'jadwal' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-slate-900">Rutinitas Pemberian Pakan</h2>
                        <button onClick={() => setShowJadwalForm(true)} className="btn btn-primary">
                            <PlusIcon /> Tambah Jadwal
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {sortedJadwal.map(jadwal => {
                            const k = kolam.find(item => item.id === jadwal.kolamId);
                            return (
                                <div key={jadwal.id} className={`card p-4 border-l-4 ${jadwal.aktif ? 'border-l-teal-500' : 'border-l-slate-300 opacity-75'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="bg-teal-50 text-teal-700 px-3 py-1 rounded-lg font-bold text-lg">
                                            {jadwal.waktu}
                                        </div>
                                        <div className="flex gap-2">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={jadwal.aktif}
                                                    onChange={() => toggleJadwalAktif(jadwal.id, jadwal.aktif)}
                                                />
                                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                                            </label>
                                            <button
                                                onClick={() => setDeleteModal({ type: 'jadwal', id: jadwal.id })}
                                                className="text-slate-400 hover:text-red-500"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="font-semibold text-slate-900 text-lg mb-1">{k?.nama}</h3>
                                    <p className="text-slate-600 text-sm mb-2">{jadwal.jumlahKg} kg • {jadwal.jenisPakan}</p>
                                    {jadwal.keterangan && (
                                        <p className="text-xs text-slate-400 italic">"{jadwal.keterangan}"</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Content: Riwayat */}
            {activeTab === 'riwayat' && (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-slate-900">Riwayat Pemberian Pakan</h2>
                        <button onClick={() => setShowForm(true)} className="btn btn-primary">
                            <PlusIcon /> Catat Pemberian
                        </button>
                    </div>

                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>Kolam</th>
                                        <th>Jenis Pakan</th>
                                        <th className="text-right">Jumlah (kg)</th>
                                        <th className="text-right">Est. FCR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pakan.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-0">
                                                <EmptyState
                                                    title="Belum Ada Riwayat"
                                                    description="Belum ada data pemberian pakan yang tercatat"
                                                    icon="📝"
                                                />
                                            </td>
                                        </tr>
                                    ) : (
                                        pakan.map(p => {
                                            const k = kolam.find(item => item.id === p.kolamId);
                                            const fcr = calculateFCR(p.kolamId);
                                            return (
                                                <tr key={p.id}>
                                                    <td>{p.tanggal}</td>
                                                    <td className="font-medium">{k?.nama}</td>
                                                    <td>
                                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                                            {p.jenisPakan}
                                                        </span>
                                                    </td>
                                                    <td className="text-right font-medium">{p.jumlahKg}</td>
                                                    <td className="text-right text-slate-500">
                                                        {fcr > 0 ? fcr.toFixed(2) : '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Content: Stok Pakan */}
            {activeTab === 'stok' && (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-slate-900">Pakan Tersedia</h2>
                        <button onClick={() => setShowStokForm(true)} className="btn btn-primary">
                            <PlusIcon /> Tambah Stok
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {allJenisPakan.map(jenis => {
                            const tersedia = getStokTersediaByJenis(jenis);
                            const isLow = tersedia <= 10;
                            return (
                                <div key={jenis} className={`card p-6 ${isLow ? 'border-l-4 border-l-amber-500' : ''}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-xl">
                                            💊
                                        </div>
                                        {isLow && (
                                            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg flex items-center gap-1">
                                                <WarningIcon /> Menipis
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-slate-700 mb-1">{jenis}</h3>
                                    <p className={`text-3xl font-bold ${isLow ? 'text-amber-600' : 'text-slate-900'}`}>{tersedia.toFixed(1)} <span className="text-sm font-normal text-slate-400">kg</span></p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="card overflow-hidden mt-8">
                        <div className="p-4 border-b">
                            <h3 className="font-semibold text-slate-900">Riwayat Penambahan Stok</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th className="text-left py-3 px-4">TANGGAL</th>
                                        <th className="text-left py-3 px-4">JENIS PAKAN</th>
                                        <th className="text-right py-3 px-4">JUMLAH (KG)</th>
                                        <th className="text-right py-3 px-4">HARGA/KG</th>
                                        <th className="text-right py-3 px-4">TOTAL</th>
                                        <th className="text-left py-3 px-4">KETERANGAN</th>
                                        <th className="py-3 px-4"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stokPakan.sort((a, b) => new Date(b.tanggalTambah).getTime() - new Date(a.tanggalTambah).getTime()).map(s => (
                                        <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                            <td className="py-3 px-4">{s.tanggalTambah}</td>
                                            <td className="py-3 px-4 font-medium">{s.jenisPakan}</td>
                                            <td className="py-3 px-4 text-right text-green-600">+{s.stokAwal}</td>
                                            <td className="py-3 px-4 text-right">Rp {s.hargaPerKg.toLocaleString('id-ID')}</td>
                                            <td className="py-3 px-4 text-right font-medium">Rp {(s.stokAwal * s.hargaPerKg).toLocaleString('id-ID')}</td>
                                            <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{s.keterangan || '-'}</td>
                                            <td className="py-3 px-4 text-center">
                                                <button
                                                    onClick={() => setDeleteModal({ type: 'stok', id: s.id })}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Modal - Tambah Pemberian Pakan */}
            <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="catat Pemberian Pakan">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Kolam</label>
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

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Pakan</label>
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

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Jumlah (kg)</label>
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

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="flex-1 btn btn-secondary"
                        >
                            Batal
                        </button>
                        <button type="submit" className="flex-1 btn btn-primary">
                            Simpan
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal - Tambah Stok */}
            <Modal isOpen={showStokForm} onClose={() => setShowStokForm(false)} title="Tambah Stok Pakan">
                <form onSubmit={handleStokSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Pakan</label>
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
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Jumlah Beli (kg)</label>
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
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Harga per kg</label>
                            <input
                                type="number"
                                value={stokFormData.hargaPerKg}
                                onChange={(e) => setStokFormData({ ...stokFormData, hargaPerKg: e.target.value })}
                                placeholder="Contoh: 12000"
                                className="input"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal Beli</label>
                        <input
                            type="date"
                            value={stokFormData.tanggalTambah}
                            onChange={(e) => setStokFormData({ ...stokFormData, tanggalTambah: e.target.value })}
                            className="input"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Keterangan (opsional)</label>
                        <input
                            type="text"
                            value={stokFormData.keterangan}
                            onChange={(e) => setStokFormData({ ...stokFormData, keterangan: e.target.value })}
                            placeholder="Contoh: Beli di toko tani"
                            className="input"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowStokForm(false)}
                            className="flex-1 btn btn-secondary"
                        >
                            Batal
                        </button>
                        <button type="submit" className="flex-1 btn btn-primary">
                            Simpan Stok
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal - Tambah Jadwal */}
            <Modal isOpen={showJadwalForm} onClose={() => setShowJadwalForm(false)} title="Tambah Jadwal Pakan">
                <form onSubmit={handleJadwalSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Kolam</label>
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

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Jam</label>
                        <input
                            type="time"
                            value={jadwalForm.waktu}
                            onChange={(e) => setJadwalForm({ ...jadwalForm, waktu: e.target.value })}
                            className="input"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Pakan</label>
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
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Dosis (kg)</label>
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

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Keterangan (opsional)</label>
                        <input
                            type="text"
                            value={jadwalForm.keterangan}
                            onChange={(e) => setJadwalForm({ ...jadwalForm, keterangan: e.target.value })}
                            placeholder="Contoh: Pakan pagi"
                            className="input"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowJadwalForm(false)}
                            className="flex-1 btn btn-secondary"
                        >
                            Batal
                        </button>
                        <button type="submit" className="flex-1 btn btn-primary">
                            Simpan Jadwal
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteModal}
                onClose={() => setDeleteModal(null)}
                title={`Hapus ${deleteModal?.type === 'stok' ? 'Stok' : 'Jadwal'}?`}
            >
                <p className="text-slate-600 mb-6">Data yang dihapus tidak dapat dikembalikan.</p>
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
