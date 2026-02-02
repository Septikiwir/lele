'use client';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, ArrowRight, Package, Container } from 'lucide-react';
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
        <div className="w-full p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Stok Pakan
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                            Total {stockItems.length} jenis pakan terdaftar
                        </p>
                    </div>
                </div>
                <Link href="/pakan" className="inline-flex font-medium items-center text-teal-600 hover:underline text-sm gap-1">
                    Kelola <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {stockItems.length === 0 ? (
                <EmptyState
                    title="Belum Ada Stok"
                    description="Belum ada data stok pakan yang tercatat"
                    icon={<Package className="w-12 h-12 text-slate-300" />}
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
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${iconClass}`}>
                                        <Container className="w-5 h-5" />
                                    </div>
                                    {(isLow || isEmpty) && (
                                        <AlertTriangle className={isEmpty ? "text-red-500 w-4 h-4" : "text-amber-500 w-4 h-4"} />
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1 truncate" title={s.jenis}>
                                        {s.jenis}
                                    </p>
                                    <p className={`text-lg font-semibold ${textClass}`}>
                                        {s.tersedia.toFixed(1)}
                                        <span className="text-sm font-normal text-slate-400 ml-1">kg</span>
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
