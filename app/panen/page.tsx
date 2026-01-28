'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RiwayatPanen } from '../context/AppContext';
import Modal from '../components/ui/Modal';
import { PlusIcon } from '../components/ui/Icons';
import EmptyState from '../components/ui/EmptyState';

export default function PanenPage() {
    const { kolam, pakan, riwayatPanen, addRiwayatPanen, getPanenByKolam } = useApp();
    const [selectedKolam, setSelectedKolam] = useState('');

    // Estimation States
    const [ukuranBibit, setUkuranBibit] = useState('5'); // gram
    const [growthRate, setGrowthRate] = useState('2'); // gram per day
    const [hargaPerKg, setHargaPerKg] = useState('25000');

    // Panen Modal States
    const [isPanenModalOpen, setIsPanenModalOpen] = useState(false);
    const [panenForm, setPanenForm] = useState({
        kolamId: '',
        tanggal: new Date().toISOString().split('T')[0],
        beratTotalKg: '',
        jumlahEkor: '',
        hargaPerKg: '25000',
        tipe: 'PARSIAL' as const,
        catatan: ''
    });

    const selectedKolamData = kolam.find(k => k.id === selectedKolam);

    // ... (Keep existing calculation logic: calculateEstimation) ...
    const calculateEstimation = () => {
        if (!selectedKolamData) return null;

        const bibit = parseFloat(ukuranBibit) || 5;
        const growth = parseFloat(growthRate) || 2;
        const targetWeight = 150; // gram (harvest weight)

        const tanggalTebar = new Date(selectedKolamData.tanggalTebar);
        const daysToHarvest = Math.ceil((targetWeight - bibit) / growth);
        const estimatedHarvestDate = new Date(tanggalTebar);
        estimatedHarvestDate.setDate(estimatedHarvestDate.getDate() + daysToHarvest);

        const today = new Date();
        const daysPassed = Math.floor((today.getTime() - tanggalTebar.getTime()) / (1000 * 60 * 60 * 24));
        const currentWeight = Math.min(bibit + (daysPassed * growth), targetWeight);
        const daysRemaining = Math.max(0, daysToHarvest - daysPassed);

        const survival = 0.85; // 85% survival rate
        const estimatedFish = Math.floor(selectedKolamData.jumlahIkan * survival);
        const totalWeight = (estimatedFish * targetWeight) / 1000; // kg
        const price = parseFloat(hargaPerKg) || 25000;
        const estimatedRevenue = totalWeight * price;

        // Get total feed cost (simplified)
        const feedCost = pakan
            .filter(p => p.kolamId === selectedKolam)
            .reduce((sum, p) => sum + p.jumlahKg, 0) * 12000; // assume 12k/kg feed price

        return {
            daysToHarvest,
            tanggalTebar: selectedKolamData.tanggalTebar,
            estimatedHarvestDate: estimatedHarvestDate.toISOString().split('T')[0],
            daysPassed,
            daysRemaining,
            currentWeight: currentWeight.toFixed(0),
            targetWeight,
            progress: Math.min((currentWeight / targetWeight) * 100, 100),
            estimatedFish,
            totalWeight: totalWeight.toFixed(1),
            estimatedRevenue,
            feedCost,
            estimatedProfit: estimatedRevenue - feedCost,
        };
    };

    const estimation = calculateEstimation();

    const handlePanenSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addRiwayatPanen({
            kolamId: panenForm.kolamId,
            tanggal: panenForm.tanggal,
            beratTotalKg: Number(panenForm.beratTotalKg),
            jumlahEkor: Number(panenForm.jumlahEkor),
            hargaPerKg: Number(panenForm.hargaPerKg),
            tipe: panenForm.tipe as 'PARSIAL' | 'TOTAL',
            catatan: panenForm.catatan
        });
        setIsPanenModalOpen(false);
        // Reset form partially
        setPanenForm(prev => ({ ...prev, beratTotalKg: '', jumlahEkor: '', catatan: '' }));
    };

    const recentPanen = selectedKolam ? getPanenByKolam(selectedKolam) : [];

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Prediksi & Pencatatan Panen</h1>
                    <p className="text-slate-500 mt-1">Estimasi, simulasi, dan pencatatan hasil panen</p>
                </div>
                <button
                    onClick={() => {
                        setPanenForm(prev => ({ ...prev, kolamId: selectedKolam || kolam[0]?.id || '' }));
                        setIsPanenModalOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                >
                    <span>🌾</span> Catat Panen Baru
                </button>
            </div>

            {/* Kolam Selection */}
            <div className="card p-6 mb-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Pilih Kolam</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Kolam</label>
                        <select
                            value={selectedKolam}
                            onChange={(e) => setSelectedKolam(e.target.value)}
                            className="input"
                        >
                            <option value="">-- Pilih Kolam --</option>
                            {kolam.map(k => (
                                <option key={k.id} value={k.id}>{k.nama}</option>
                            ))}
                        </select>
                    </div>
                    {/* ... (Keep existing inputs for estimation params) ... */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Ukuran Bibit (gram)</label>
                        <input
                            type="number"
                            value={ukuranBibit}
                            onChange={(e) => setUkuranBibit(e.target.value)}
                            className="input"
                            min="1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Growth Rate (g/hari)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={growthRate}
                            onChange={(e) => setGrowthRate(e.target.value)}
                            className="input"
                            min="0.1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Harga Jual (Rp/kg)</label>
                        <input
                            type="number"
                            value={hargaPerKg}
                            onChange={(e) => setHargaPerKg(e.target.value)}
                            className="input"
                            min="1000"
                            step="1000"
                        />
                    </div>
                </div>
            </div>

            {/* Riwayat Panen List */}
            {selectedKolam && recentPanen.length > 0 && (
                <div className="card p-6 mb-8">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Riwayat Panen: {selectedKolamData?.nama}</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3">Tanggal</th>
                                    <th className="px-4 py-3">Tipe</th>
                                    <th className="px-4 py-3">Berat Total</th>
                                    <th className="px-4 py-3">Jumlah Ekor</th>
                                    <th className="px-4 py-3">Harga/Kg</th>
                                    <th className="px-4 py-3">Total Pendapatan</th>
                                    <th className="px-4 py-3">Catatan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentPanen.map((p) => (
                                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium">{p.tanggal}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.tipe === 'TOTAL' ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-700'
                                                }`}>{(p.tipe || 'PARSIAL').toUpperCase()}</span>
                                        </td>
                                        <td className="px-4 py-3">{p.beratTotalKg} kg</td>
                                        <td className="px-4 py-3">{p.jumlahEkor} ekor</td>
                                        <td className="px-4 py-3">Rp {p.hargaPerKg.toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3 font-bold text-green-600">Rp {(p.beratTotalKg * p.hargaPerKg).toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{p.catatan}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {selectedKolamData && estimation && (
                <>
                    {/* Estimation */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Progress */}
                        <div className="card p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">📈 Progress Pertumbuhan</h2>

                            <div className="mb-6">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-500">Berat saat ini</span>
                                    <span className="font-semibold">{estimation.currentWeight}g / {estimation.targetWeight}g</span>
                                </div>
                                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all"
                                        style={{ width: `${estimation.progress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{estimation.progress.toFixed(0)}% menuju berat panen</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <p className="text-sm text-slate-500">Tanggal Tebar</p>
                                    <p className="font-semibold text-slate-900">{estimation.tanggalTebar}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <p className="text-sm text-slate-500">Hari Berlalu</p>
                                    <p className="font-semibold text-slate-900">{estimation.daysPassed} hari</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4">
                                    <p className="text-sm text-green-600">Est. Tanggal Panen</p>
                                    <p className="font-bold text-green-700">{estimation.estimatedHarvestDate}</p>
                                </div>
                                <div className="bg-amber-50 rounded-lg p-4">
                                    <p className="text-sm text-amber-600">Sisa Waktu</p>
                                    <p className="font-bold text-amber-700">{estimation.daysRemaining} hari</p>
                                </div>
                            </div>
                        </div>

                        {/* Revenue Estimation */}
                        <div className="card p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">💰 Estimasi Pendapatan</h2>

                            <div className="space-y-4">
                                <div className="flex justify-between py-3 border-b">
                                    <span className="text-slate-500">Est. Ikan Hidup (85% SR)</span>
                                    <span className="font-semibold">{estimation.estimatedFish.toLocaleString('id-ID')} ekor</span>
                                </div>
                                <div className="flex justify-between py-3 border-b">
                                    <span className="text-slate-500">Est. Total Berat</span>
                                    <span className="font-semibold">{estimation.totalWeight} kg</span>
                                </div>
                                <div className="flex justify-between py-3 border-b">
                                    <span className="text-slate-500">Est. Omzet</span>
                                    <span className="font-semibold text-green-600">
                                        Rp {estimation.estimatedRevenue.toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <div className="flex justify-between py-3 border-b">
                                    <span className="text-slate-500">Biaya Pakan (tercatat)</span>
                                    <span className="font-semibold text-red-600">
                                        - Rp {estimation.feedCost.toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <div className="flex justify-between py-3 bg-teal-50 -mx-6 px-6 rounded-lg">
                                    <span className="font-semibold text-slate-900">Est. Profit</span>
                                    <span className={`font-bold text-xl ${estimation.estimatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        Rp {estimation.estimatedProfit.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {!selectedKolam && (
                <EmptyState
                    title="Pilih Kolam"
                    description="Pilih kolam di atas untuk melihat prediksi dan riwayat panen"
                    icon="🐟"
                />
            )}

            {/* Modal Catat Panen */}
            <Modal isOpen={isPanenModalOpen} onClose={() => setIsPanenModalOpen(false)} title="Catat Panen Baru">
                <form onSubmit={handlePanenSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Kolam</label>
                        <select
                            className="input w-full"
                            value={panenForm.kolamId}
                            onChange={(e) => setPanenForm({ ...panenForm, kolamId: e.target.value })}
                            required
                        >
                            <option value="">-- Pilih Kolam --</option>
                            {kolam.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                            <input
                                type="date"
                                className="input w-full"
                                value={panenForm.tanggal}
                                onChange={(e) => setPanenForm({ ...panenForm, tanggal: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Panen</label>
                            <select
                                className="input w-full"
                                value={panenForm.tipe}
                                onChange={(e) => setPanenForm({ ...panenForm, tipe: e.target.value as any })}
                            >
                                <option value="PARSIAL">Parsial (Bertahap)</option>
                                <option value="TOTAL">Total (Panen Raya)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Berat Total (kg)</label>
                            <input
                                type="number"
                                className="input w-full"
                                placeholder="0"
                                value={panenForm.beratTotalKg}
                                onChange={(e) => setPanenForm({ ...panenForm, beratTotalKg: e.target.value })}
                                required
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Ikan (Ekor)</label>
                            <input
                                type="number"
                                className="input w-full"
                                placeholder="0"
                                value={panenForm.jumlahEkor}
                                onChange={(e) => setPanenForm({ ...panenForm, jumlahEkor: e.target.value })}
                                required
                                min="0"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Harga Jual (Rp/kg)</label>
                        <input
                            type="number"
                            className="input w-full"
                            value={panenForm.hargaPerKg}
                            onChange={(e) => setPanenForm({ ...panenForm, hargaPerKg: e.target.value })}
                            required
                            min="0"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
                        <textarea
                            className="input w-full"
                            rows={2}
                            value={panenForm.catatan}
                            onChange={(e) => setPanenForm({ ...panenForm, catatan: e.target.value })}
                            placeholder="Contoh: Sortir ukuran konsumsi..."
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setIsPanenModalOpen(false)}
                            className="btn-secondary flex-1"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                            Simpan Panen
                        </button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
