'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import { useState, useEffect } from 'react';
import { useApp, Kolam, TipePembeli } from '../context/AppContext';
import { useToast } from '../context/ToastContext'; // Import Toast
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils';
import Modal from '../components/ui/Modal';
import { PlusIcon } from '../components/ui/Icons';
import EmptyState from '../components/ui/EmptyState';

export default function ProduksiPage() {
    const { kolam, pakan, riwayatPanen, pembeli, addRiwayatPanen, addPenjualan, addPembeli, getPanenByKolam, tebarBibit, getLatestSampling, getFeedRecommendation } = useApp();
    const { showToast } = useToast(); // Destructure showToast
    const [selectedKolamId, setSelectedKolamId] = useState('');

    // --- STATES ---
    const [growthRate, setGrowthRate] = useState('2');
    const [hargaPerKg, setHargaPerKg] = useState('25000');
    const [ukuranBibitEst, setUkuranBibitEst] = useState('5');

    // Tebar Modal
    const [isTebarModalOpen, setIsTebarModalOpen] = useState(false);
    const [tebarForm, setTebarForm] = useState({
        kolamId: '',
        tanggal: new Date().toISOString().split('T')[0],
        jumlah: '',
        beratPerEkor: '5'
    });

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



    // --- DERIVED DATA ---
    const activePonds = kolam.filter(k => k.jumlahIkan > 0);
    const emptyPonds = kolam.filter(k => k.jumlahIkan === 0);

    // Select first active pond by default if none selected
    if (!selectedKolamId && activePonds.length > 0) {
        setSelectedKolamId(activePonds[0].id);
    }

    const selectedKolamData = kolam.find(k => k.id === selectedKolamId);
    const recentPanen = selectedKolamId ? getPanenByKolam(selectedKolamId) : [];

    // --- LOGIC ---

    const calculateEstimation = (k: Kolam) => {
        if (!k || k.jumlahIkan === 0 || !k.tanggalTebar) return null;

        const bibit = parseFloat(ukuranBibitEst) || 5;
        const growth = parseFloat(growthRate) || 2;
        const targetWeight = 150; // gram (harvest weight)

        const tanggalTebar = new Date(k.tanggalTebar);
        if (isNaN(tanggalTebar.getTime())) return null;

        const today = new Date();
        const daysPassed = Math.floor((today.getTime() - tanggalTebar.getTime()) / (1000 * 60 * 60 * 24));

        // --- UPDATED WEIGHT CALCULATION ---
        let currentWeight = 0;
        const latestSampling = getLatestSampling(k.id);

        if (latestSampling && latestSampling.jumlahIkanPerKg > 0) {
            // Use sampling data as baseline
            const lastWeight = 1000 / latestSampling.jumlahIkanPerKg; // grams
            const samplingDate = new Date(latestSampling.tanggal);
            const daysSinceSampling = Math.max(0, Math.floor((today.getTime() - samplingDate.getTime()) / (1000 * 60 * 60 * 24)));

            currentWeight = lastWeight + (daysSinceSampling * growth);
        } else {
            // Fallback to purely estimated growth from start
            currentWeight = bibit + (daysPassed * growth);
        }

        // Cap at target weight or slightly above to prevent unrealistic numbers if needed, 
        // but for now let's just allow it to grow to show they should have harvested.
        // Actually, let's just cap for the progress bar logic, but keep the value real.

        const daysToHarvest = Math.ceil((targetWeight - bibit) / growth); // Original estimate total days
        // Better estimation of remaining days based on current weight
        const weightRemaining = Math.max(0, targetWeight - currentWeight);
        const daysRemaining = Math.ceil(weightRemaining / growth);

        // Recalculate estimated harvest date based on remaining days
        const estimatedHarvestDate = new Date();
        estimatedHarvestDate.setDate(estimatedHarvestDate.getDate() + daysRemaining);

        const survival = 0.85; // 85% survival rate
        const estimatedFish = Math.floor(k.jumlahIkan * survival);
        const totalWeight = (estimatedFish * Math.min(currentWeight, targetWeight)) / 1000; // kg - use current weight for revenue est if not harvested? 
        // Actually typically revenue projection is based on TARGET weight harvest.
        // But if we are over target, maybe we calculate based on current?
        // Let's stick to Target Weight for "Potential Revenue" if not ready, or current if ready?
        // "Potensi Omzet" usually means "If I harvest NOW" or "When I harvest at Target"?
        // Usually "At Target". Let's keep revenue based on Target Weight for consistency of "Goal".

        const totalTargetWeight = (estimatedFish * targetWeight) / 1000;
        const price = parseFloat(hargaPerKg) || 25000;
        const estimatedRevenue = totalTargetWeight * price;

        // Feed Cost
        const feedCost = pakan
            .filter(p => p.kolamId === k.id)
            .reduce((sum, p) => sum + p.jumlahKg, 0) * 12000; // assume 12k/kg

        const totalBiomass = (k.jumlahIkan * currentWeight) / 1000; // kg

        return {
            daysPassed,
            daysRemaining,
            currentWeight: currentWeight.toFixed(0),
            currentBiomass: parseFloat(totalBiomass.toFixed(1)).toString(),
            targetWeight,
            progress: Math.min((currentWeight / targetWeight) * 100, 100),
            estimatedHarvestDate: estimatedHarvestDate.toISOString().split('T')[0],
            estimatedRevenue,
            estimatedProfit: estimatedRevenue - feedCost,
            feedCost,
            isBasedOnSampling: !!latestSampling, // Flag for UI if needed
            // FEED RECOMMENDATION LOGIC
            feedRecommendation: getFeedRecommendation(currentWeight, totalBiomass)
        };
    };



    // Auto-Calculate for Selected Pond (for Detail View)
    const selectedEstimation = selectedKolamData ? calculateEstimation(selectedKolamData) : null;

    // Auto-calculate fish count (jumlahEkor) when weight (beratTotalKg) changes
    useEffect(() => {
        if (!panenForm.kolamId || !panenForm.beratTotalKg) return;

        const k = kolam.find(p => p.id === panenForm.kolamId);
        if (k) {
            const est = calculateEstimation(k);
            if (est && est.currentWeight) {
                const currentWeightGrams = parseFloat(est.currentWeight);
                if (currentWeightGrams > 0) {
                    const weightKg = parseFloat(panenForm.beratTotalKg);
                    const estCount = Math.round((weightKg * 1000) / currentWeightGrams);

                    if (panenForm.jumlahEkor !== estCount.toString()) {
                        setPanenForm(prev => ({ ...prev, jumlahEkor: estCount.toString() }));
                    }
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [panenForm.beratTotalKg, panenForm.kolamId]);

    const handleTebarSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await tebarBibit(tebarForm.kolamId, {
                tanggal: tebarForm.tanggal,
                jumlah: parseInt(tebarForm.jumlah),
                beratPerEkor: parseFloat(tebarForm.beratPerEkor)
            });
            setIsTebarModalOpen(false);
            setTebarForm({ ...tebarForm, jumlah: '', beratPerEkor: '5' });
            showToast('Siklus berhasil dimulai', 'success');
        } catch (error) {
            showToast('Gagal menebar bibit', 'error');
        }
    };

    const handlePanenSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation: Check against available stock
        const k = kolam.find(p => p.id === panenForm.kolamId);
        if (k) {
            const inputCount = parseFloat(panenForm.jumlahEkor) || 0;
            const inputWeight = parseFloat(panenForm.beratTotalKg) || 0;

            if (inputCount > k.jumlahIkan) {
                showToast(`Gagal: Jumlah panen (${inputCount} ekor) melebihi populasi kolam (${k.jumlahIkan.toLocaleString()} ekor).`, 'error');
                return;
            }

            const est = calculateEstimation(k);
            if (est && est.currentBiomass) {
                const availableBiomass = parseFloat(est.currentBiomass);
                // Allow small margin of error (e.g. 1%) or strict? User asked strict.
                // But let's be realistic, maybe exact strictness is what they want for now.
                if (inputWeight > availableBiomass) {
                    showToast(`Gagal: Berat panen (${inputWeight} kg) melebihi estimasi biomassa (${availableBiomass} kg). Harap lakukan sampling ulang.`, 'error');
                    return;
                }
            }
        }

        if (!panenForm.pembeliId) {
            showToast('Harap pilih Pembeli untuk mencatat panen.', 'error');
            return;
        }

        try {
            await addRiwayatPanen({
                kolamId: panenForm.kolamId,
                tanggal: panenForm.tanggal,
                beratTotalKg: Number(panenForm.beratTotalKg),
                jumlahEkor: Number(panenForm.jumlahEkor),
                hargaPerKg: Number(panenForm.hargaPerKg),
                tipe: panenForm.tipe,
                catatan: panenForm.catatan
            });

            // Sync with Sales if Buyer is selected
            if (panenForm.pembeliId) {
                await addPenjualan({
                    kolamId: panenForm.kolamId,
                    pembeliId: panenForm.pembeliId,
                    tanggal: panenForm.tanggal,
                    beratKg: Number(panenForm.beratTotalKg),
                    hargaPerKg: Number(panenForm.hargaPerKg),
                    jumlahIkan: Number(panenForm.jumlahEkor),
                    keterangan: panenForm.catatan || 'Panen Otomatis'
                });
            }

            setIsPanenModalOpen(false);
            setPanenForm(prev => ({ ...prev, beratTotalKg: '', jumlahEkor: '', catatan: '', pembeliId: '' }));
            showToast(panenForm.pembeliId ? 'Panen & Penjualan berhasil dicatat' : 'Panen berhasil dicatat', 'success');
        } catch (error: any) {
            showToast(error.message || 'Gagal mencatat panen', 'error');
        }
    };

    const handleBuyerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newBuyer = await addPembeli({
                nama: buyerForm.nama,
                tipe: buyerForm.tipe,
                kontak: buyerForm.kontak,
                alamat: buyerForm.alamat
            });

            // Auto-select the new buyer
            if (newBuyer) {
                setPanenForm(prev => ({ ...prev, pembeliId: newBuyer.id }));
            }

            setIsBuyerModalOpen(false);
            setBuyerForm({ nama: '', tipe: 'TENGKULAK', kontak: '', alamat: '' });
            showToast('Pembeli berhasil ditambahkan', 'success');
        } catch (error) {
            showToast('Gagal menambah pembeli', 'error');
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Produksi & Siklus</h1>
                <p className="text-slate-500 mt-1">Kelola siklus budidaya dari tebar hingga panen</p>
            </div>

            {/* --- GLOBAL CONFIG --- */}
            <div className="card p-4 mb-8 bg-blue-50 border-blue-100">
                <div className="flex flex-wrap gap-6 items-end">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Parameter Estimasi Global</label>
                        <p className="text-xs text-slate-400 mb-2">Ubah nilai ini untuk memperbarui semua proyeksi</p>
                    </div>
                    <div className="w-32">
                        <label className="text-xs font-medium text-slate-500 block mb-1">Growth Rate (g/hari)</label>
                        <input
                            type="number"
                            value={growthRate}
                            onChange={e => setGrowthRate(e.target.value)}
                            className="input w-full text-sm py-1 h-9"
                        />
                    </div>
                    <div className="w-40">
                        <label className="text-xs font-medium text-slate-500 block mb-1">Est. Harga Jual (Rp/kg)</label>
                        <input
                            type="text"
                            value={formatCurrencyInput(hargaPerKg)}
                            onChange={e => setHargaPerKg(parseCurrencyInput(e.target.value))}
                            className="input w-full text-sm py-1 h-9"
                        />
                    </div>
                </div>
            </div>

            {/* --- ACTIVE PRODUCTION --- */}
            <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Sedang Berjalan ({activePonds.length})</h2>
                </div>

                {activePonds.length === 0 ? (
                    <div className="bg-slate-50 rounded-xl p-8 text-center border-2 border-dashed border-slate-200">
                        <p className="text-slate-500">Tidak ada kolam yang sedang aktif.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activePonds.map(k => {
                            const isSelected = selectedKolamId === k.id;
                            const days = k.tanggalTebar ? Math.floor((new Date().getTime() - new Date(k.tanggalTebar).getTime()) / (86400000)) : 0;
                            const est = calculateEstimation(k); // Calculate per pond

                            return (
                                <div
                                    key={k.id}
                                    onClick={() => setSelectedKolamId(k.id)}
                                    className={`card cursor-pointer transition-all border-2 relative overflow-hidden group ${isSelected ? 'border-primary-500 ring-2 ring-primary-100' : 'border-transparent hover:border-slate-200'}`}
                                >
                                    {/* Header Part */}
                                    <div className="p-5 border-b border-slate-50 bg-white z-10 relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xl">
                                                    🐟
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900">{k.nama}</h3>
                                                    <p className="text-xs text-slate-500">{k.jumlahIkan.toLocaleString()} ekor</p>
                                                </div>
                                            </div>
                                            <span className="badge badge-success">Aktif: {days} Hari</span>
                                        </div>
                                    </div>

                                    {/* Projection Part - Highlighted */}
                                    <div className="p-4 bg-slate-50 space-y-3">
                                        {est ? (
                                            <>
                                                <div className="flex justify-between items-center text-sm">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-slate-500">Est. Panen</span>
                                                        {est.isBasedOnSampling && (
                                                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium" title="Berdasarkan data sampling terakhir">
                                                                Terkalibrasi
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="font-semibold text-slate-800">{est.estimatedHarvestDate}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500">Sisa Waktu</span>
                                                    <span className={`font-bold ${est.daysRemaining <= 7 ? 'text-red-600' : 'text-amber-600'}`}>{est.daysRemaining} hari</span>
                                                </div>

                                                {/* ADDED: Biomass & Count Stats */}
                                                <div className="grid grid-cols-2 gap-2 my-2 bg-white p-2 rounded border border-slate-100">
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 uppercase">Est. Total</p>
                                                        <p className="font-semibold text-slate-700 text-sm">{est.currentBiomass} kg</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 uppercase">Populasi</p>
                                                        <p className="font-semibold text-slate-700 text-sm">{k.jumlahIkan.toLocaleString()}</p>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Potensi Omzet</span>
                                                    <span className="font-bold text-emerald-600">Rp {est.estimatedRevenue.toLocaleString('id-ID')}</span>
                                                </div>
                                                {/* Mini Progress Bar */}
                                                <div className="mt-2">
                                                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                                        <span className={est.isBasedOnSampling ? "text-indigo-600 font-bold" : ""}>
                                                            {est.currentWeight}g
                                                            {est.isBasedOnSampling && " (Sample)"}
                                                        </span>
                                                        <span>Target {est.targetWeight}g</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                        <div className={`h-full ${est.isBasedOnSampling ? 'bg-indigo-500' : 'bg-cyan-500'}`} style={{ width: `${est.progress}%` }}></div>
                                                    </div>
                                                </div>


                                            </>
                                        ) : (
                                            <div className="text-center py-2">
                                                <span className="text-xs text-slate-400">Data belum cukup</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                                        <button
                                            className="btn btn-success flex-1 text-sm py-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPanenForm(prev => ({ ...prev, kolamId: k.id }));
                                                setIsPanenModalOpen(true);
                                            }}
                                        >
                                            🌾 Panen
                                        </button>
                                        {/* View Details used to be implicit by clicking, now explicit button helps affordance */}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* --- DETAILS SECTION --- */}
            <section className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Riwayat Panen Global</h2>

                {/* Harvest History Table */}
                <div className="card">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-semibold text-slate-800">Daftar Panen Terakhir</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3 text-left">Tanggal</th>
                                    <th className="px-6 py-3 text-left">Kolam</th>
                                    <th className="px-6 py-3 text-center">Tipe</th>
                                    <th className="px-6 py-3 text-right">Berat (Kg)</th>
                                    <th className="px-6 py-3 text-right">Total (Rp)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {riwayatPanen.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Belum ada data panen</td>
                                    </tr>
                                ) : (
                                    riwayatPanen.slice().sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).map(p => (
                                        <tr key={p.id}>
                                            <td className="px-6 py-3">{p.tanggal}</td>
                                            <td className="px-6 py-3 font-medium text-slate-800">{p.kolam?.nama || '-'}</td>
                                            <td className="px-6 py-3 text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${p.tipe === 'TOTAL' ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-600'}`}>
                                                    {p.tipe}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right">{p.beratTotalKg}</td>
                                            <td className="px-6 py-3 text-right font-medium text-emerald-600">
                                                {(p.beratTotalKg * p.hargaPerKg).toLocaleString('id-ID')}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* --- EMPTY PONDS (SIAP TEBAR) --- */}
            <section>
                <h2 className="text-xl font-bold text-slate-800 mb-4">Siap Ditebar ({emptyPonds.length})</h2>
                {emptyPonds.length === 0 ? (
                    <p className="text-slate-500 italic">Semua kolam sedang aktif digunakan.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                        {emptyPonds.map(k => (
                            <div key={k.id} className="card p-5 border border-dashed border-slate-300 hover:border-blue-400 transition-colors bg-slate-50">
                                <div className="flex items-center gap-3 mb-4 opacity-70">
                                    <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center grayscale">
                                        🐟
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-700">{k.nama}</h3>
                                        <p className="text-xs text-slate-500">{k.panjang}x{k.lebar}m</p>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-primary w-full"
                                    onClick={() => {
                                        setTebarForm({ ...tebarForm, kolamId: k.id });
                                        setIsTebarModalOpen(true);
                                    }}
                                >
                                    <PlusIcon /> Mulai Siklus
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* --- MODALS --- */}

            {/* Modal Tebar */}
            <Modal isOpen={isTebarModalOpen} onClose={() => setIsTebarModalOpen(false)} title="Mulai Siklus (Tebar Bibit)">
                <form onSubmit={handleTebarSubmit} className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700 mb-4">
                        Data ini akan memulai siklus baru dan mencatat sampling awal.
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Tanggal Tebar</label>
                        <input type="date" className="input w-full" required
                            value={tebarForm.tanggal} onChange={e => setTebarForm({ ...tebarForm, tanggal: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Jumlah (Ekor)</label>
                            <input type="number" className="input w-full" required placeholder="5000"
                                value={tebarForm.jumlah} onChange={e => setTebarForm({ ...tebarForm, jumlah: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Ukuran (Gram/Ekor)</label>
                            <input type="number" step="0.1" className="input w-full" required placeholder="5"
                                value={tebarForm.beratPerEkor} onChange={e => setTebarForm({ ...tebarForm, beratPerEkor: e.target.value })} />
                            {tebarForm.beratPerEkor && parseFloat(tebarForm.beratPerEkor) > 0 && (
                                <p className="text-xs text-emerald-600 mt-1 font-medium">
                                    ≈ Isi {(1000 / parseFloat(tebarForm.beratPerEkor)).toFixed(0)} ekor/kg
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsTebarModalOpen(false)} className="btn btn-secondary flex-1">Batal</button>
                        <button type="submit" className="btn btn-primary flex-1">Mulai Tebar</button>
                    </div>
                </form>
            </Modal>

            {/* Modal Panen */}
            <Modal isOpen={isPanenModalOpen} onClose={() => setIsPanenModalOpen(false)} title="Catat Panen">
                <form onSubmit={handlePanenSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Tanggal</label>
                        <input type="date" className="input w-full" required
                            value={panenForm.tanggal} onChange={e => setPanenForm({ ...panenForm, tanggal: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Pembeli</label>
                        <div className="flex gap-2">
                            <select
                                className="input w-full"
                                value={panenForm.pembeliId}
                                onChange={e => setPanenForm({ ...panenForm, pembeliId: e.target.value })}
                                required
                            >
                                <option value="">-- Pilih Pembeli --</option>
                                {pembeli.map(p => (
                                    <option key={p.id} value={p.id}>{p.nama} ({p.tipe})</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => setIsBuyerModalOpen(true)}
                                className="btn btn-secondary px-3"
                                title="Tambah Pembeli Baru"
                            >
                                <PlusIcon />
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Data akan otomatis masuk ke menu Penjualan.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Berat Total (Kg)</label>
                            <input type="number" className="input w-full" required placeholder="0"
                                value={panenForm.beratTotalKg} onChange={e => setPanenForm({ ...panenForm, beratTotalKg: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Jlh Ekor (Opsional)</label>
                            <input type="number" className="input w-full" placeholder="0"
                                value={panenForm.jumlahEkor} onChange={e => setPanenForm({ ...panenForm, jumlahEkor: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Harga Jual (Rp/kg)</label>
                        <input type="text" className="input w-full" required
                            value={formatCurrencyInput(panenForm.hargaPerKg)}
                            onChange={e => setPanenForm({ ...panenForm, hargaPerKg: parseCurrencyInput(e.target.value) })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Tipe</label>
                        <select
                            className="input w-full"
                            value={panenForm.tipe}
                            onChange={e => {
                                const newTipe = e.target.value as 'PARSIAL' | 'TOTAL';
                                setPanenForm(prev => {
                                    let updates = { ...prev, tipe: newTipe };

                                    // Auto-fill if 'TOTAL'
                                    if (newTipe === 'TOTAL' && prev.kolamId) {
                                        const k = kolam.find(p => p.id === prev.kolamId);
                                        if (k) {
                                            const est = calculateEstimation(k);
                                            updates.jumlahEkor = k.jumlahIkan.toString();
                                            if (est && est.currentBiomass) {
                                                updates.beratTotalKg = est.currentBiomass;
                                            }
                                        }
                                    }
                                    return updates;
                                });
                            }}
                        >
                            <option value="PARSIAL">Parsial</option>
                            <option value="TOTAL">Total (Panen Raya)</option>
                        </select>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsPanenModalOpen(false)} className="btn btn-secondary flex-1">Batal</button>
                        <button type="submit" className="btn bg-emerald-600 text-white flex-1 hover:bg-emerald-700 border-transparent">Simpan Panen</button>
                    </div>
                </form>
            </Modal>
            {/* Modal Quick Add Buyer */}
            <Modal isOpen={isBuyerModalOpen} onClose={() => setIsBuyerModalOpen(false)} title="Tambah Pembeli Baru">
                <form onSubmit={handleBuyerSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nama Pembeli</label>
                        <input
                            type="text"
                            className="input w-full"
                            required
                            value={buyerForm.nama}
                            onChange={e => setBuyerForm({ ...buyerForm, nama: e.target.value })}
                            placeholder="Contoh: Pak Budi"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Tipe</label>
                        <select
                            className="input w-full"
                            value={buyerForm.tipe}
                            onChange={e => setBuyerForm({ ...buyerForm, tipe: e.target.value as TipePembeli })}
                        >
                            <option value="TENGKULAK">Tengkulak</option>
                            <option value="PASAR">Pasar</option>
                            <option value="RESTORAN">Restoran</option>
                            <option value="LAINNYA">Lainnya</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Kontak (Opsional)</label>
                        <input
                            type="text"
                            className="input w-full"
                            value={buyerForm.kontak}
                            onChange={e => setBuyerForm({ ...buyerForm, kontak: e.target.value })}
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsBuyerModalOpen(false)} className="btn btn-secondary flex-1">Batal</button>
                        <button type="submit" className="btn btn-primary flex-1">Simpan</button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout >
    );
}
