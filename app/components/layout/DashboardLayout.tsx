'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Modal from '../ui/Modal';
import { useApp, TipePembeli } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { isSidebarCollapsed, toggleSidebar, kolam, pembeli, addRiwayatPanen, addPenjualan, addPembeli, getLatestSampling } = useApp();
    const { showToast } = useToast();

    // Panen Modal
    const [isPanenModalOpen, setIsPanenModalOpen] = useState(false);
    const [panenForm, setPanenForm] = useState({
        kolamId: '',
        pembeliId: '',
        tanggal: new Date().toISOString().split('T')[0],
        beratTotalKg: '',
        jumlahEkor: '',
        hargaPerKg: '25000',
        tipe: 'PARSIAL' as 'PARSIAL' | 'TOTAL',
        catatan: ''
    });

    // Quick Add Buyer Modal
    const [isBuyerModalOpen, setIsBuyerModalOpen] = useState(false);
    const [buyerForm, setBuyerForm] = useState({
        nama: '',
        tipe: 'TENGKULAK' as TipePembeli,
        kontak: '',
        alamat: ''
    });

    // Auto-calculate fish count when weight changes
    useEffect(() => {
        if (!panenForm.kolamId || !panenForm.beratTotalKg) return;

        const k = kolam.find(p => p.id === panenForm.kolamId);
        if (k) {
            const latestSampling = getLatestSampling(k.id);
            if (latestSampling && latestSampling.jumlahIkanPerKg > 0) {
                const currentWeightGrams = 1000 / latestSampling.jumlahIkanPerKg;
                const weightKg = parseFloat(panenForm.beratTotalKg);
                const estCount = Math.round((weightKg * 1000) / currentWeightGrams);

                if (panenForm.jumlahEkor !== estCount.toString()) {
                    setPanenForm(prev => ({ ...prev, jumlahEkor: estCount.toString() }));
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [panenForm.beratTotalKg, panenForm.kolamId]);

    const handlePanenSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Add harvest record
            await addRiwayatPanen({
                kolamId: panenForm.kolamId,
                tanggal: panenForm.tanggal,
                beratTotalKg: parseFloat(panenForm.beratTotalKg),
                jumlahEkor: parseInt(panenForm.jumlahEkor),
                hargaPerKg: parseFloat(panenForm.hargaPerKg),
                tipe: panenForm.tipe,
                catatan: panenForm.catatan
            });

            // Record sale
            await addPenjualan({
                pembeliId: panenForm.pembeliId,
                kolamId: panenForm.kolamId,
                tanggal: panenForm.tanggal,
                beratKg: parseFloat(panenForm.beratTotalKg),
                hargaPerKg: parseFloat(panenForm.hargaPerKg),
                catatan: panenForm.catatan
            });

            setIsPanenModalOpen(false);
            setPanenForm({
                kolamId: '',
                pembeliId: '',
                tanggal: new Date().toISOString().split('T')[0],
                beratTotalKg: '',
                jumlahEkor: '',
                hargaPerKg: '25000',
                tipe: 'PARSIAL',
                catatan: ''
            });

            showToast('Data panen berhasil disimpan', 'success');
        } catch (error) {
            showToast('Gagal menyimpan data panen', 'error');
        }
    };

    const handleAddBuyer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newBuyer = await addPembeli(buyerForm);
            setPanenForm({ ...panenForm, pembeliId: newBuyer.id });
            setIsBuyerModalOpen(false);
            setBuyerForm({ nama: '', tipe: 'TENGKULAK', kontak: '', alamat: '' });
            showToast('Pembeli berhasil ditambahkan', 'success');
        } catch (error) {
            showToast('Gagal menambahkan pembeli', 'error');
        }
    };

    const activePonds = kolam.filter(k => k.jumlahIkan > 0);

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleCollapse={toggleSidebar}
                onPanenClick={() => setIsPanenModalOpen(true)}
            />

            {/* Main Content */}
            <main className={`min-h-screen transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
                <div className="p-4 md:p-8 pt-4 md:pt-8 w-full mx-auto pb-20 md:pb-8">
                    {children}
                </div>
            </main>

            {/* Panen Modal */}
            <Modal
                isOpen={isPanenModalOpen}
                onClose={() => setIsPanenModalOpen(false)}
                title="Input Panen"
            >
                <form onSubmit={handlePanenSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Kolam*</label>
                        <select
                            required
                            value={panenForm.kolamId}
                            onChange={(e) => setPanenForm({ ...panenForm, kolamId: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="">Pilih Kolam</option>
                            {activePonds.map((k) => (
                                <option key={k.id} value={k.id}>
                                    {k.nama} ({k.jumlahIkan.toLocaleString()} ekor)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal*</label>
                        <input
                            type="date"
                            required
                            value={panenForm.tanggal}
                            onChange={(e) => setPanenForm({ ...panenForm, tanggal: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Panen*</label>
                        <select
                            required
                            value={panenForm.tipe}
                            onChange={(e) => setPanenForm({ ...panenForm, tipe: e.target.value as 'PARSIAL' | 'TOTAL' })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="PARSIAL">Parsial</option>
                            <option value="TOTAL">Total</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Berat Total (kg)*</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={panenForm.beratTotalKg}
                            onChange={(e) => setPanenForm({ ...panenForm, beratTotalKg: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Ekor (estimasi)*</label>
                        <input
                            type="number"
                            required
                            value={panenForm.jumlahEkor}
                            onChange={(e) => setPanenForm({ ...panenForm, jumlahEkor: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Auto-calculated"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Otomatis terhitung berdasarkan sampling terakhir
                        </p>
                    </div>

                    <div>
                        <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-1">
                            <span>Pembeli*</span>
                            <button
                                type="button"
                                onClick={() => setIsBuyerModalOpen(true)}
                                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                            >
                                + Tambah Baru
                            </button>
                        </label>
                        <select
                            required
                            value={panenForm.pembeliId}
                            onChange={(e) => setPanenForm({ ...panenForm, pembeliId: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="">Pilih Pembeli</option>
                            {pembeli.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nama} ({p.tipe})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Harga per Kg*</label>
                        <input
                            type="text"
                            required
                            value={formatCurrencyInput(panenForm.hargaPerKg)}
                            onChange={(e) => setPanenForm({ ...panenForm, hargaPerKg: parseCurrencyInput(e.target.value) })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Rp 0"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
                        <textarea
                            value={panenForm.catatan}
                            onChange={(e) => setPanenForm({ ...panenForm, catatan: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            rows={3}
                            placeholder="Catatan tambahan..."
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsPanenModalOpen(false)}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                        >
                            Simpan
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Quick Add Buyer Modal */}
            <Modal
                isOpen={isBuyerModalOpen}
                onClose={() => setIsBuyerModalOpen(false)}
                title="Tambah Pembeli Baru"
            >
                <form onSubmit={handleAddBuyer} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama*</label>
                        <input
                            type="text"
                            required
                            value={buyerForm.nama}
                            onChange={(e) => setBuyerForm({ ...buyerForm, nama: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Nama pembeli"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipe*</label>
                        <select
                            required
                            value={buyerForm.tipe}
                            onChange={(e) => setBuyerForm({ ...buyerForm, tipe: e.target.value as TipePembeli })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="TENGKULAK">Tengkulak</option>
                            <option value="KONSUMEN">Konsumen Langsung</option>
                            <option value="RESTORAN">Restoran</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Kontak</label>
                        <input
                            type="text"
                            value={buyerForm.kontak}
                            onChange={(e) => setBuyerForm({ ...buyerForm, kontak: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Nomor telepon"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
                        <textarea
                            value={buyerForm.alamat}
                            onChange={(e) => setBuyerForm({ ...buyerForm, alamat: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            rows={2}
                            placeholder="Alamat pembeli"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsBuyerModalOpen(false)}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                        >
                            Simpan
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
