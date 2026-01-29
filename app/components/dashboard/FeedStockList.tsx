'use client';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { WarningIcon, ArrowRightIcon } from '../ui/Icons';
import EmptyState from '../ui/EmptyState';

export default function FeedStockList() {
    const { getStokTersediaByJenis, getAllJenisPakan } = useApp();

    const allJenisPakan = getAllJenisPakan();
    const stokPerJenis = allJenisPakan.map(jenis => ({
        jenis,
        tersedia: getStokTersediaByJenis(jenis),
    }));

    const stockItems = stokPerJenis.length > 0 ? stokPerJenis.slice(0, 4) : [];

    return (
        <div className="stat-card p-6 bg-white border border-slate-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        📦 Stok Pakan
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Total {stockItems.length} jenis pakan terdaftar
                    </p>
                </div>
                <Link href="/pakan" className="text-teal-600 hover:text-teal-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    Kelola <ArrowRightIcon className="w-4 h-4" />
                </Link>
            </div>

            {stockItems.length === 0 ? (
                <EmptyState
                    title="Belum Ada Stok"
                    description="Belum ada data stok pakan yang tercatat"
                    icon="📦"
                />
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {stockItems.map(s => {
                        const isLow = s.tersedia <= 10;
                        const isEmpty = s.tersedia <= 0;

                        // Item Style (Tile inside Card)
                        let tileClass = "bg-slate-50 border-slate-200 hover:border-teal-300";
                        let iconClass = "bg-white text-slate-500";
                        let textClass = "text-slate-900";

                        if (isEmpty) {
                            tileClass = "bg-red-50 border-red-200 hover:border-red-300";
                            iconClass = "bg-white text-red-500";
                            textClass = "text-red-700";
                        } else if (isLow) {
                            tileClass = "bg-amber-50 border-amber-200 hover:border-amber-300";
                            iconClass = "bg-white text-amber-500";
                            textClass = "text-amber-700";
                        }

                        return (
                            <div key={s.jenis} className={`p-4 rounded-xl border transition-all group hover:-translate-y-1 ${tileClass}`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg shadow-sm ${iconClass}`}>
                                        🍚
                                    </div>
                                    {(isLow || isEmpty) && (
                                        <WarningIcon className={isEmpty ? "text-red-500 w-4 h-4" : "text-amber-500 w-4 h-4"} />
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1 truncate" title={s.jenis}>
                                        {s.jenis}
                                    </p>
                                    <p className={`text-xl font-bold ${textClass}`}>
                                        {s.tersedia.toFixed(1)}
                                        <span className="text-xs font-normal text-slate-400 ml-1">kg</span>
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
