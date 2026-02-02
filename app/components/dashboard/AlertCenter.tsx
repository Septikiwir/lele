'use client';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, ArrowRight, Package, Fish, Check, TrendingDown } from 'lucide-react';

export default function AlertCenter() {
    const { getStokTersediaByJenis, getAllJenisPakan, kolam, getUnifiedStatus, detectAppetiteDrop } = useApp();

    // 1. Check Low Stock
    const allJenisPakan = getAllJenisPakan();
    const lowStockItems = allJenisPakan.map(jenis => ({
        jenis,
        tersedia: getStokTersediaByJenis(jenis),
    })).filter(s => s.tersedia <= 10).slice(0, 4);

    // 2. Check Risky Ponds
    const riskyPonds = kolam.filter(k => {
        const { status } = getUnifiedStatus(k.id);
        return status === 'waspada' || status === 'berisiko';
    }).slice(0, 4);

    const appetiteAlerts = kolam
        .map(k => ({ ...k, ...detectAppetiteDrop(k.id) }))
        .filter(k => k.hasDrop);

    const hasAlerts = lowStockItems.length > 0 || riskyPonds.length > 0 || appetiteAlerts.length > 0;

    if (!hasAlerts) {
        return (
            <div className="stat-card p-6 h-full flex flex-col items-center justify-center text-center bg-white border border-slate-100 hover:shadow-md transition-all">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 text-emerald-600">
                    <Check className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Semua Aman</h3>
                <p className="text-slate-500 text-sm max-w-[200px] mt-2">
                    Stok pakan cukup, nafsu makan stabil, dan kondisi kolam normal.
                </p>
            </div>
        );
    }

    return (
        <div className="stat-card h-full p-6 flex flex-col bg-white border border-slate-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="text-amber-500 w-4 h-4" />
                    Perlu Perhatian
                </h3>
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">
                    {lowStockItems.length + riskyPonds.length + appetiteAlerts.length} ISU
                </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
                {/* Appetite Drop Section */}
                {appetiteAlerts.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Nafsu Makan Turun</p>
                        {appetiteAlerts.map(k => (
                            <Link href={`/kolam/${k.id}`} key={k.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50/50 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                                        <TrendingDown className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 group-hover:text-red-700">{k.nama}</p>
                                        <p className="text-xs text-slate-500">Turun <span className="font-bold text-red-600">{Math.abs(k.dropPercent).toFixed(0)}%</span></p>
                                    </div>
                                </div>
                                <ArrowRightIcon className="text-slate-300 w-4 h-4 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
                            </Link>
                        ))}
                    </div>
                )}

                {/* Low Stock Section */}
                {lowStockItems.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stok Menipis</p>
                        {lowStockItems.map(item => (
                            <Link href="/pakan" key={item.jenis} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50/50 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 group-hover:text-red-700">{item.jenis}</p>
                                        <p className="text-xs text-slate-500">Sisa <span className="font-bold text-red-600">{item.tersedia.toFixed(1)} kg</span></p>
                                    </div>
                                </div>
                                <ArrowRightIcon className="text-slate-300 w-4 h-4 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
                            </Link>
                        ))}
                    </div>
                )}

                {/* Risky Ponds Section */}
                {riskyPonds.length > 0 && (
                    <div className="space-y-3 pt-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kondisi Kolam</p>
                        {riskyPonds.map(k => {
                            const { status, kepadatanBerat, kepadatanEkor, source } = getUnifiedStatus(k.id);
                            const isRisk = status === 'berisiko';

                            return (
                                <Link href={`/kolam/${k.id}`} key={k.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isRisk ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                            <Fish className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{k.nama}</p>
                                            <p className="text-xs text-slate-500">
                                                {source === 'berat' ? `${kepadatanBerat.toFixed(1)} kg/m³` : `${kepadatanEkor.toFixed(0)} ekor/m³`}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${isRisk ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {status}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
