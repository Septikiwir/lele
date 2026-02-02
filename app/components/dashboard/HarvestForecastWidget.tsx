'use client';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { ArrowRight, Calendar } from 'lucide-react';

export default function HarvestForecastWidget() {
    const { kolam, predictHarvestDate } = useApp();

    // Get predictions for active ponds
    const predictions = kolam
        .map(k => ({
            ...k,
            ...predictHarvestDate(k.id)
        }))
        .filter(p => p.status !== 'aman' || p.jumlahIkan > 0) // Only active ponds
        .sort((a, b) => a.daysRemaining - b.daysRemaining);

    // Take top 5 nearest
    const nearestHarvests = predictions.slice(0, 4);

    return (
        <div className="w-full p-6 h-full flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Estimasi Panen</h3>
                        <p className="text-sm text-slate-600 mt-1">Target: 150g/ekor</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
                {nearestHarvests.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <p className="text-sm">Belum ada estimasi tersedia</p>
                    </div>
                ) : (
                    nearestHarvests.map(p => {
                        const isReady = p.targetReached || p.daysRemaining <= 0;

                        return (
                            <Link href={`/kolam/${p.id}`} key={p.id} className="block group">
                                <div className={`p-3 rounded-xl border transition-all
                                    ${isReady
                                        ? 'bg-emerald-50 border-emerald-100 hover:border-emerald-300'
                                        : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30'
                                    }`}>

                                    <div className="w-full">
                                        {/* Row 1: Header (Name --- Date • Days) */}
                                        <div className="flex justify-between items-end mb-2">
                                            <p className="text-lg font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors truncate">
                                                {p.nama}
                                            </p>

                                            {!isReady ? (
                                                <div className="text-right whitespace-nowrap">
                                                    <span className="text-sm text-slate-400 mr-1.5">
                                                        {new Date(p.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                    <span className="text-sm font-medium text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                                                        {p.daysRemaining} Hari
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                                    SIAP PANEN
                                                </span>
                                            )}
                                        </div>

                                        {/* Row 2: Progress Bar (Full Width) */}
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${isReady ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                style={{ width: `${Math.min((p.currentWeight / 0.15) * 100, 100)}%` }}
                                            ></div>
                                        </div>

                                        {/* Row 3: Weight Context (Current --- Target) */}
                                        {!isReady && (
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-sm font-medium text-slate-700">
                                                    {(p.currentWeight * 1000).toFixed(0)}g
                                                </span>
                                                <span className="text-sm text-slate-400">
                                                    Target: 150g
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50 text-center">
                <Link href="/kolam" className="inline-flex font-medium items-center text-indigo-600 hover:underline text-sm justify-center gap-1">
                    Lihat Semua Kolam <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
