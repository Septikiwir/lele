'use client';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { ArrowRightIcon, WalletIcon } from '../ui/Icons';

export default function ProfitabilityWidget() {
    const { pengeluaran, pakan } = useApp();

    // 1. Calculate Feed Cost (Estimasi)
    // Asumsi harga pakan rata-rata Rp 13.000 (bisa diambil dari data pakan jika ada harga)
    // Untuk simplifikasi, kita ambil dari total pengeluaran kategori 'PAKAN' jika ada,
    // ATAU estimasi dari stok pakan yang berkurang.
    // Tapi karena 'pengeluaran' mencatat pembelian, kita pakai data pengeluaran real saja.

    // Group pengeluaran by kategori
    const kategoriStats = pengeluaran.reduce((acc, curr) => {
        const kat = curr.kategori || 'LAINNYA';
        acc[kat] = (acc[kat] || 0) + curr.jumlah;
        return acc;
    }, {} as Record<string, number>);

    // Total Pengeluaran
    const totalPengeluaran = Object.values(kategoriStats).reduce((a, b) => a + b, 0);

    // Kategori Config
    const kategoriConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
        'PAKAN': { label: 'Pakan', color: 'text-amber-600', bg: 'bg-amber-500', icon: '🍚' },
        'BIBIT': { label: 'Bibit', color: 'text-cyan-600', bg: 'bg-cyan-500', icon: '🐟' },
        'LISTRIK': { label: 'Listrik', color: 'text-yellow-600', bg: 'bg-yellow-500', icon: '⚡' },
        'OBAT': { label: 'Obat/Vitamin', color: 'text-emerald-600', bg: 'bg-emerald-500', icon: '💊' },
        'GAJI': { label: 'Gaji', color: 'text-purple-600', bg: 'bg-purple-500', icon: '👥' },
        'LAINNYA': { label: 'Lainnya', color: 'text-slate-600', bg: 'bg-slate-500', icon: '📝' },
    };

    const categories = Object.keys(kategoriStats)
        .map(key => ({
            key,
            total: kategoriStats[key],
            percentage: totalPengeluaran > 0 ? (kategoriStats[key] / totalPengeluaran) * 100 : 0,
            config: kategoriConfig[key] || kategoriConfig['LAINNYA']
        }))
        .sort((a, b) => b.total - a.total);

    return (
        <div className="stat-card p-6 bg-white border border-slate-100 hover:shadow-md transition-all h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                        <WalletIcon />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Komposisi Pengeluaran</h3>
                        <p className="text-xs text-slate-400 mt-1">Breakdown Biaya Operasional</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
                {categories.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <p className="text-sm">Belum ada data pengeluaran</p>
                    </div>
                ) : (
                    categories.map(cat => (
                        <div key={cat.key} className="p-3 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-all">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{cat.config.icon}</span>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">{cat.config.label}</p>
                                        <p className="text-[10px] text-slate-400">{cat.percentage.toFixed(1)}%</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-slate-900">Rp {cat.total.toLocaleString('id-ID')}</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${cat.config.bg}`}
                                    style={{ width: `${cat.percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50 text-center">
                <Link href="/keuangan" className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center justify-center gap-1">
                    DETAIL PENGELUARAN <ArrowRightIcon className="w-3 h-3" />
                </Link>
            </div>
        </div>
    );
}
