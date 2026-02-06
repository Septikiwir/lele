'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Calculator, AlertCircle, RefreshCw, Save, Info, ChevronRight, TrendingUp, PieChart, DollarSign, Scale, Fish } from 'lucide-react';


// Helper for currency format if utils not available
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

const formatNumber = (value: number, decimals = 0) => {
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
};

export default function SimulasiKeuanganPage() {
    // --- CARD 1 STATE: Simulasi Harga Diskon ---
    const [hargaNormal, setHargaNormal] = useState<number>(25000);
    // hppPerKg in Card 1 will now be linked to the calculated HPP from Card 2
    const [manualHppCard1, setManualHppCard1] = useState<number>(18000);
    const [useCalculatedHpp, setUseCalculatedHpp] = useState(true);

    const [promos, setPromos] = useState([
        { id: 1, minKg: 10, jenis: 'potongan_perkg', nilai: 500 },
        { id: 2, minKg: 50, jenis: 'potongan_perkg', nilai: 1000 },
        { id: 3, minKg: 100, jenis: 'gratis_kg', nilai: 1 } // Buy 100 get 1 free
    ]);

    // --- CARD 2 STATE: Prediksi Untung ---
    const [biayaItems, setBiayaItems] = useState([
        { id: 1, item: 'Bibit', jumlah: 1000, satuan: 'ekor', harga: 500 },
        { id: 2, item: 'Pakan', jumlah: 80, satuan: 'kg', harga: 12000 },
        { id: 3, item: 'Karyawan', jumlah: 1, satuan: 'org', harga: 1500000 },
        { id: 4, item: 'Ongkir', jumlah: 1, satuan: 'trip', harga: 200000 }
    ]);

    // New State for Advanced Harvest Calculation
    const [panenConfig, setPanenConfig] = useState({
        survivalRate: 90, // percent
        targetBobot: 125, // gram per fish
        hargaJual: 25000, // per kg
        durasiSiklus: 3, // bulan
        fcr: 1.1 // Ratio Pakan
    });

    // --- CARD 3 STATE: Pembagian Keuntungan ---
    const [alokasiLaba, setAlokasiLaba] = useState([
        { id: 1, deskripsi: 'Laba Ditahan (Modal)', persen: 40 },
        { id: 2, deskripsi: 'Laba Diambil (Owner)', persen: 30 },
        { id: 3, deskripsi: 'Dana Investasi', persen: 20 },
        { id: 4, deskripsi: 'Sedekah / Sosial', persen: 10 }
    ]);

    // --- CALCULATIONS ---

    // Card 2 Calculations (Base)
    const jumlahBibit = biayaItems.find(b => b.item === 'Bibit')?.jumlah || 0;
    const totalBiayaProduksi = biayaItems.reduce((sum, item) => sum + (item.jumlah * item.harga), 0);

    // Advanced Harvest Logic
    const estimasiPopulasiHidup = Math.floor(jumlahBibit * (panenConfig.survivalRate / 100));
    const totalPanenKg = (estimasiPopulasiHidup * panenConfig.targetBobot) / 1000;

    // Auto Calculate Feed (Pakan) based on FCR
    useEffect(() => {
        const estimatedFeed = Math.ceil(totalPanenKg * (panenConfig.fcr || 1.1));
        setBiayaItems(prev => prev.map(item =>
            item.item === 'Pakan' ? { ...item, jumlah: estimatedFeed } : item
        ));
    }, [totalPanenKg, panenConfig.fcr]);

    // HPP Calculation

    const calculatedHppPerKg = totalPanenKg > 0 ? totalBiayaProduksi / totalPanenKg : 0;

    // Financials
    const totalPendapatan = totalPanenKg * panenConfig.hargaJual;
    const labaBersih = totalPendapatan - totalBiayaProduksi;
    const labaPerBulan = labaBersih / (panenConfig.durasiSiklus || 1);
    const roi = totalBiayaProduksi > 0 ? (labaBersih / totalBiayaProduksi) * 100 : 0;


    // Card 1 Calculations
    const activeHpp = useCalculatedHpp ? calculatedHppPerKg : manualHppCard1;

    const calculatePromo = (promo: any) => {
        let hargaAkhir = 0;
        let effectiveDiscount = 0;

        if (promo.jenis === 'potongan_perkg') {
            hargaAkhir = hargaNormal - promo.nilai;
            effectiveDiscount = promo.nilai;
        } else {
            // gratis_kg: Buy X get Y free. 
            const totalKg = promo.minKg + promo.nilai;
            const totalBayar = promo.minKg * hargaNormal;
            hargaAkhir = totalBayar / totalKg;
            effectiveDiscount = hargaNormal - hargaAkhir;
        }

        const margin = hargaAkhir - activeHpp;
        const marginPercent = hargaAkhir > 0 ? (margin / hargaAkhir) * 100 : 0;

        return { hargaAkhir, margin, marginPercent, effectiveDiscount };
    };

    // Card 3 Calculations
    const totalPersen = alokasiLaba.reduce((sum, item) => sum + item.persen, 0);

    // --- HANDLERS ---

    const handlePromoChange = (id: number, field: string, value: any) => {
        setPromos(promos.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleBiayaChange = (id: number, field: string, value: any) => {
        setBiayaItems(biayaItems.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const handleAlokasiChange = (id: number, value: number) => {
        setAlokasiLaba(alokasiLaba.map(a => a.id === id ? { ...a, persen: value } : a));
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8 w-full mx-auto pb-20">

                {/* Header */}
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
                        Simulasi Keuangan
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1">
                        Alat bantu perencanaan untuk menghitung estimasi profit, HPP, dan margin.
                    </p>
                </div>

                {/* --- CARD 2: PREDIKSI UNTUNG (MOVED UP FOR BETTER FLOW) --- */}
                <div className="card bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-8">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Prediksi Keuntungan & HPP</h2>
                            <p className="text-xs text-slate-500">Estimasi biaya, panen, dan profitabilitas.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Input Biaya - Left Side */}
                        <div className="lg:col-span-2">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-slate-400" />
                                Komponen Biaya
                            </h3>
                            <div className="table-container border border-slate-200 rounded-lg overflow-hidden mb-4">
                                <table className="table w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Item</th>
                                            <th className="px-3 py-2 text-center">Jumlah</th>
                                            <th className="px-3 py-2 text-right">Satuan</th>
                                            <th className="px-3 py-2 text-right">Harga/Unit</th>
                                            <th className="px-3 py-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {biayaItems.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-3 py-2 font-medium">{item.item}</td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        value={item.jumlah}
                                                        onChange={(e) => handleBiayaChange(item.id, 'jumlah', Number(e.target.value))}
                                                        className="w-16 sm:w-20 px-2 py-1 border border-slate-200 rounded text-center text-sm"
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-right text-slate-500 text-xs">{item.satuan}</td>
                                                <td className="px-3 py-2 text-right">
                                                    <input
                                                        type="number"
                                                        value={item.harga}
                                                        onChange={(e) => handleBiayaChange(item.id, 'harga', Number(e.target.value))}
                                                        className="w-24 sm:w-28 px-2 py-1 border border-slate-200 rounded text-right text-right text-sm"
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-right font-medium text-slate-700">
                                                    {formatCurrency(item.jumlah * item.harga)}
                                                </td>
                                            </tr>
                                        ))}

                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Resume - Right Side */}
                        <div className="space-y-6">

                            {/* Kalkulator Panen */}
                            <div>
                                <h3 className="text-sm font-semibold text-blue-800 mb-3 uppercase tracking-wider flex items-center gap-2">
                                    <Fish className="w-4 h-4" />
                                    Kalkulator Panen
                                </h3>
                                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-blue-700">Jumlah Bibit</span>
                                            <span className="font-bold text-slate-800">{formatNumber(jumlahBibit)} ekor</span>
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-blue-600 block mb-1">Survival Rate (SR)</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={panenConfig.survivalRate}
                                                    onChange={(e) => setPanenConfig({ ...panenConfig, survivalRate: Number(e.target.value) })}
                                                    className="input bg-white border-blue-200 h-8 text-sm"
                                                />
                                                <span className="text-xs text-blue-600 font-medium">%</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-blue-600 block mb-1">Target Bobot / Ekor</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={panenConfig.targetBobot}
                                                    onChange={(e) => setPanenConfig({ ...panenConfig, targetBobot: Number(e.target.value) })}
                                                    className="input bg-white border-blue-200 h-8 text-sm"
                                                />
                                                <span className="text-xs text-blue-600 font-medium">gram</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-blue-600 block mb-1">
                                                FCR (Pakan per Kg Panen)
                                                <span className="ml-1 text-xs text-blue-400 font-normal">± 1.0 - 1.2</span>
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={panenConfig.fcr}
                                                    onChange={(e) => setPanenConfig({ ...panenConfig, fcr: Number(e.target.value) })}
                                                    className="input bg-white border-blue-200 h-8 text-sm"
                                                />
                                                <span className="text-xs text-blue-600 font-medium">ratio</span>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-blue-200 mt-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-sm text-blue-800 font-medium">Total Panen</span>
                                                <div className="text-right">
                                                    <div className="text-xl font-bold text-blue-900">{formatNumber(totalPanenKg)} kg</div>
                                                    <div className="text-xs text-blue-600">({formatNumber(estimasiPopulasiHidup)} ekor hidup)</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hasil Keuangan - Bottom Full Width */}
                    <div>

                        {/* Hasil Keuangan */}
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider flex items-center gap-2">
                                <PieChart className="w-4 h-4" />
                                Hasil Estimasi
                            </h3>

                            <div className="space-y-4">
                                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                    <div className="text-xs text-slate-500 mb-1">HPP per Kg (Break Even)</div>
                                    <div className="text-2xl font-bold text-slate-900">{formatCurrency(calculatedHppPerKg)}</div>
                                    <div className="text-xs text-slate-400 mt-1">Modal per kg lele</div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-slate-500 block mb-1">Rencana Harga Jual / Kg</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={panenConfig.hargaJual}
                                            onChange={(e) => setPanenConfig({ ...panenConfig, hargaJual: Number(e.target.value) })}
                                            className="input bg-white border-slate-300 w-full font-semibold"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-200 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600">Pendapatan</span>
                                        <span className="text-sm font-semibold text-slate-900 transition-all">{formatCurrency(totalPendapatan)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600">Modal</span>
                                        <span className="text-sm font-medium text-red-500">({formatCurrency(totalBiayaProduksi)})</span>
                                    </div>
                                </div>

                                <div className={`p-4 rounded-lg border text-center transition-colors ${labaBersih >= 0 ? 'bg-emerald-100 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                    <span className={`block text-xs font-bold uppercase tracking-wider mb-1 ${labaBersih >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {labaBersih >= 0 ? 'Estimasi Profit' : 'Estimasi Rugi'}
                                    </span>
                                    <span className={`text-2xl font-bold ${labaBersih >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {formatCurrency(labaBersih)}
                                    </span>
                                    <div className="mt-2 text-xs font-medium opacity-80 flex justify-center gap-3">
                                        <span>ROI: {roi.toFixed(1)}%</span>
                                        <span>•</span>
                                        <span>{formatCurrency(labaPerBulan)}/bln</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* --- CARD 1: SIMULASI HARGA DISKON --- */}
                <div className="card bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6 border-b border-slate-100 pb-4">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Scale className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Simulasi Diskon Grosir</h2>
                            <p className="text-xs text-slate-500">Hitung margin bersih saat memberikan diskon volume.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Harga Jual Normal (per kg)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={hargaNormal}
                                    onChange={(e) => setHargaNormal(Number(e.target.value))}
                                    className="input font-semibold text-slate-900"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="block text-sm font-medium text-slate-700">Acuan HPP (per kg)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="useCalc"
                                        checked={useCalculatedHpp}
                                        onChange={(e) => setUseCalculatedHpp(e.target.checked)}
                                        className="w-3 h-3 rounded accent-teal-600"
                                    />
                                    <label htmlFor="useCalc" className="text-xs text-slate-500 cursor-pointer select-none">Pakai Hitungan Otomatis</label>
                                </div>
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={useCalculatedHpp ? Math.round(calculatedHppPerKg) : manualHppCard1}
                                    onChange={(e) => !useCalculatedHpp && setManualHppCard1(Number(e.target.value))}
                                    readOnly={useCalculatedHpp}
                                    className={`input ${useCalculatedHpp ? 'bg-slate-100 text-slate-500' : 'text-slate-600'}`}
                                />
                                {useCalculatedHpp && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-teal-600 font-medium">
                                        Auto
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="table-container border border-slate-200 rounded-lg overflow-hidden">
                        <table className="table w-full text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-medium">
                                <tr>
                                    <th className="px-4 py-3 text-left">Skenario Promo</th>
                                    <th className="px-4 py-3 text-left">Min. Pembelian</th>
                                    <th className="px-4 py-3 text-left">Jenis Diskon</th>
                                    <th className="px-4 py-3 text-right">Harga Net /kg</th>
                                    <th className="px-4 py-3 text-right">Margin (%)</th>
                                    <th className="px-4 py-3 text-right">Estimasi Profit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {promos.map((promo, index) => {
                                    const { hargaAkhir, marginPercent, margin } = calculatePromo(promo);
                                    const estimasiProfit = margin * totalPanenKg;
                                    return (
                                        <tr key={promo.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-800">Promo {index + 1}</td>
                                            <td className="px-4 py-3 min-w-[120px]">
                                                <input
                                                    type="number"
                                                    value={promo.minKg}
                                                    onChange={(e) => handlePromoChange(promo.id, 'minKg', Number(e.target.value))}
                                                    className="w-16 sm:w-20 px-2 py-1 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-teal-500 outline-none"
                                                /> kg
                                            </td>
                                            <td className="px-4 py-3 min-w-[180px]">
                                                <div className="flex gap-2">
                                                    <select
                                                        value={promo.jenis}
                                                        onChange={(e) => handlePromoChange(promo.id, 'jenis', e.target.value)}
                                                        className="text-xs border border-slate-200 rounded px-2 py-1 bg-white max-w-[100px]"
                                                    >
                                                        <option value="potongan_perkg">Potongan Rp</option>
                                                        <option value="gratis_kg">Bonus Kg</option>
                                                    </select>
                                                    <input
                                                        type="number"
                                                        value={promo.nilai}
                                                        onChange={(e) => handlePromoChange(promo.id, 'nilai', Number(e.target.value))}
                                                        className="w-14 sm:w-16 px-2 py-1 text-xs border border-slate-200 rounded"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-700">
                                                {formatCurrency(hargaAkhir)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${marginPercent > 20 ? 'bg-emerald-100 text-emerald-800' :
                                                    marginPercent > 10 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {marginPercent.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className={`px-4 py-3 text-right font-bold ${estimasiProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                                {formatCurrency(estimasiProfit)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>


                {/* --- CARD 3: SIMULASI PEMBAGIAN KEUNTUNGAN --- */}
                <div className="card bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6 border-b border-slate-100 pb-4">
                        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                            <PieChart className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Pembagian Keuntungan</h2>
                            <p className="text-xs text-slate-500">Alokasi laba bersih untuk pengembangan & sosial.</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-8">
                        <div className="w-full">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-slate-700">Tabel Alokasi</h3>
                                <span className={`text-xs font-bold px-2 py-1 rounded ${totalPersen === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    Total: {totalPersen}%
                                </span>
                            </div>

                            <div className="table-container border border-slate-200 rounded-lg overflow-hidden">
                                <table className="table w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Pos Alokasi</th>
                                            <th className="px-4 py-3 text-center">Persentase (%)</th>
                                            <th className="px-4 py-3 text-right">Nominal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {alokasiLaba.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-3 font-medium text-slate-800">{item.deskripsi}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <input
                                                        type="number"
                                                        value={item.persen}
                                                        onChange={(e) => handleAlokasiChange(item.id, Number(e.target.value))}
                                                        className="w-16 px-2 py-1 text-center border border-slate-200 rounded focus:ring-1 focus:ring-amber-500 outline-none"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-slate-600">
                                                    {formatCurrency(labaBersih * (item.persen / 100))}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-slate-50 font-bold">
                                            <td className="px-4 py-3 text-right" colSpan={2}>Total Dialokasikan:</td>
                                            <td className="px-4 py-3 text-right text-slate-800">{formatCurrency(labaBersih * (totalPersen / 100))}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {totalPersen !== 100 && (
                                <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>Total persentase harus 100%. Saat ini: {totalPersen}%</span>
                                </div>
                            )}
                        </div>

                        <div className="w-full bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center">
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Total Laba Bersih</span>
                            <span className={`text-3xl font-bold mb-1 ${labaBersih >= 0 ? 'text-slate-900' : 'text-red-500'}`}>
                                {formatCurrency(labaBersih)}
                            </span>
                            <p className="text-xs text-slate-400">Dasar perhitungan alokasi</p>

                            <div className="w-full h-px bg-slate-200 my-6"></div>

                            <div className="w-full space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Utk Pengembangan</span>
                                    <span className="font-semibold text-slate-800">{formatCurrency(labaBersih * ((alokasiLaba.find(a => a.id === 1)?.persen || 0) + (alokasiLaba.find(a => a.id === 3)?.persen || 0)) / 100)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Utk Owner/Pribadi</span>
                                    <span className="font-semibold text-slate-800">{formatCurrency(labaBersih * (alokasiLaba.find(a => a.id === 2)?.persen || 0) / 100)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
