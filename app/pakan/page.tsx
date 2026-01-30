'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import { useState, useEffect } from 'react';
import { useApp, JadwalPakan } from '../context/AppContext';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils';

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

    const [activeTab, setActiveTab] = useState<'riwayat' | 'stok' | 'jadwal'>('stok');
    const [showForm, setShowForm] = useState(false);
    const [showStokForm, setShowStokForm] = useState(false);
    const [showJadwalForm, setShowJadwalForm] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ type: 'stok' | 'jadwal', id: string } | null>(null);
    
    // Pagination states
    const [limitRiwayatPakan, setLimitRiwayatPakan] = useState(10);
    const [limitStokPakan, setLimitStokPakan] = useState(10);

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
    
    // Filtered and sorted data
    const filteredRiwayatPakan = pakan
        .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
        .slice(0, limitRiwayatPakan);
    
    const filteredStokPakan = stokPakan
        .sort((a, b) => new Date(b.tanggalTambah).getTime() - new Date(a.tanggalTambah).getTime())
        .slice(0, limitStokPakan);
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
            <div className="tab-container border-b border-slate-200 mb-6">
                <button
                    onClick={() => setActiveTab('stok')}
                    className={`tab tab-underline ${activeTab === 'stok' ? 'tab-active' : ''}`}
                >
                    📦 Stok Pakan
                </button>
                <button
                    onClick={() => setActiveTab('jadwal')}
                    className={`tab tab-underline ${activeTab === 'jadwal' ? 'tab-active' : ''}`}
                >
                    📅 Jadwal Pakan
                </button>
                <button
                    onClick={() => setActiveTab('riwayat')}
                    className={`tab tab-underline ${activeTab === 'riwayat' ? 'tab-active' : ''}`}
                >
                    📝 Riwayat Pemberian
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
                    <div className="table-wrapper">
                        <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <span>📝</span>
                                <span>Riwayat Pemberian Pakan</span>
                            </h2>
                            <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
                                <PlusIcon /> Catat
                            </button>
                        </div>
                        <table className="table table-compact">
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
                                    filteredRiwayatPakan.map(p => {
                                            const k = kolam.find(item => item.id === p.kolamId);
                                            const fcr = calculateFCR(p.kolamId);
                                            return (
                                            <tr key={p.id}>
                                                <td className="text-small">{p.tanggal}</td>
                                                <td className="text-strong">{k?.nama}</td>
                                                <td>
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                                        {p.jenisPakan}
                                                    </span>
                                                </td>
                                                <td className="text-right text-small">{p.jumlahKg}</td>
                                                <td className="text-right text-muted">
                                                    {fcr > 0 ? fcr.toFixed(2) : '-'}
                                                </td>
                                            </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                            {pakan.length > 0 && (
                                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <p className="text-sm text-slate-500">
                                        Menampilkan {Math.min(limitRiwayatPakan, filteredRiwayatPakan.length)} dari {pakan.length} data
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-slate-600">Tampilkan:</label>
                                        <select 
                                            value={limitRiwayatPakan} 
                                            onChange={(e) => setLimitRiwayatPakan(Number(e.target.value))} 
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
                            )}
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

                    <div className="table-wrapper mt-8">
                        <div className="px-6 py-4 border-b border-slate-200 bg-white">
                            <h3 className="text-lg font-bold text-slate-900">Riwayat Stok</h3>
                        </div>
                        <table className="table table-compact">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Jenis Pakan</th>
                                    <th className="text-right">Jumlah (kg)</th>
                                    <th className="text-right">Harga/kg</th>
                                    <th className="text-right">Total</th>
                                    <th>Keterangan</th>
                                    <th className="text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stokPakan.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-0">
                                            <EmptyState
                                                title="Belum Ada Riwayat Stok"
                                                description="Belum ada data penambahan stok pakan"
                                                icon="💊"
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStokPakan.map(s => (
                                        <tr key={s.id}>
                                            <td className="text-small">{s.tanggalTambah}</td>
                                            <td className="text-strong">{s.jenisPakan}</td>
                                            <td className="text-right text-small text-green-600">+{s.stokAwal}</td>
                                            <td className="text-right text-small">Rp {s.hargaPerKg.toLocaleString('id-ID')}</td>
                                            <td className="text-right text-strong">Rp {(s.stokAwal * s.hargaPerKg).toLocaleString('id-ID')}</td>
                                            <td className="text-muted text-small max-w-xs truncate">{s.keterangan || '-'}</td>
                                            <td className="action-cell">
                                                <button
                                                    onClick={() => setDeleteModal({ type: 'stok', id: s.id })}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {stokPakan.length > 0 && (
                            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <p className="text-sm text-slate-500">
                                    Menampilkan {Math.min(limitStokPakan, filteredStokPakan.length)} dari {stokPakan.length} data
                                </p>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-slate-600">Tampilkan:</label>
                                    <select 
                                        value={limitStokPakan} 
                                        onChange={(e) => setLimitStokPakan(Number(e.target.value))} 
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
                        )}
                    </div>
                </>
            )}

            {/* Modal - Tambah Pemberian Pakan */}
            <Modal 
                isOpen={showForm} 
                onClose={() => setShowForm(false)} 
                title="Catat Pemberian Pakan"
                footer={
                    <>
                        <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
                        <button type="submit" form="pakan-form" className="btn btn-primary">Simpan</button>
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
                        <button type="submit" form="stok-form" className="btn btn-primary">Simpan Stok</button>
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
                        <button type="submit" form="jadwal-form" className="btn btn-primary">Simpan Jadwal</button>
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
                        ⚠️
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
        </DashboardLayout>
    );
}
