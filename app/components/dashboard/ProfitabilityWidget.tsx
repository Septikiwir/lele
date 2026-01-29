'use client';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { ArrowRightIcon, WalletIcon } from '../ui/Icons';

export default function ProfitabilityWidget() {
    const { kolam, calculateProjectedProfit } = useApp();

    // Calculate economics for active ponds
    const economics = kolam
        .filter(k => k.status !== 'aman' || k.jumlahIkan > 0)
        .map(k => ({
            ...k,
            ...calculateProjectedProfit(k.id)
        }))
        .sort((a, b) => b.roi - a.roi) // Sort by ROI descending
        .slice(0, 4);

    return (
        <div className="stat-card p-6 bg-white border border-slate-100 hover:shadow-md transition-all h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <WalletIcon />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Unit Economics</h3>
                        <p className="text-xs text-slate-400 mt-1">Projected ROI & Profit</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
                {economics.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <p className="text-sm">Belum ada data finansial</p>
                    </div>
                ) : (
                    economics.map(p => {
                        const isProfitable = p.profit > 0;
                        const roiColor = isProfitable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';

                        return (
                            <Link href={`/kolam/${p.id}`} key={p.id} className="block group">
                                <div className="p-3 rounded-xl border border-slate-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/30 transition-all flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-700 group-hover:text-emerald-700 truncate">
                                            {p.nama}
                                        </p>
                                        <p className={`text-xs font-medium ${isProfitable ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {isProfitable ? '+' : ''}Rp {Math.abs(p.profit).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <div className="text-right pl-2">
                                        <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${roiColor}`}>
                                            {p.roi.toFixed(1)}% ROI
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 text-center">
                <Link href="/laporan" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-1">
                    DETAIL KEUANGAN <ArrowRightIcon className="w-3 h-3" />
                </Link>
            </div>
        </div>
    );
}
