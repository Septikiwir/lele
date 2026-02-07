'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import { useApp } from '../context/AppContext';
import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, Calendar, AlertCircle, FileText } from 'lucide-react';

interface CashFlowTransaction {
    id: string;
    tanggal: string;
    waktu: string;
    keterangan: string;
    kasMasuk: number;
    kasKeluar: number;
    saldo: number;
    tipe: 'MODAL' | 'PENJUALAN' | 'BIBIT' | 'PAKAN' | 'OBAT' | 'LISTRIK' | 'TENAGA_KERJA' | 'LAINNYA';
}

type PeriodFilter = 'semua' | 'hari-ini' | 'minggu-ini' | 'bulan-ini';

export default function ArusKasPage() {
    const { farm, penjualan, pengeluaran, stokPakan, kolam } = useApp();
    const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('semua');

    // Aggregate all transactions
    const allTransactions = useMemo(() => {
        const transactions: CashFlowTransaction[] = [];

        // Helper to extract time
        const getTime = (isoString?: string) => {
            if (!isoString) return '00:00';
            try {
                return new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            } catch (e) {
                return '00:00';
            }
        };

        // 1. Modal Awal (use earliest date from any transaction or today)
        if (farm) {
            const modalDate = new Date().toISOString().split('T')[0];
            transactions.push({
                id: 'modal-awal',
                tanggal: modalDate,
                waktu: '00:00',
                keterangan: 'Modal Awal',
                kasMasuk: farm.modalAwal,
                kasKeluar: 0,
                saldo: 0, // Will be calculated
                tipe: 'MODAL'
            });
        }

        // 2. Penjualan (Kas Masuk)
        penjualan.forEach(p => {
            const totalPendapatan = p.beratKg * p.hargaPerKg;
            const kolamName = kolam.find(k => k.id === p.kolamId)?.nama || 'Unknown';
            transactions.push({
                id: p.id,
                tanggal: p.tanggal,
                waktu: getTime(p.createdAt),
                keterangan: `Penjualan ${p.beratKg}kg dari ${kolamName}`,
                kasMasuk: totalPendapatan,
                kasKeluar: 0,
                saldo: 0,
                tipe: 'PENJUALAN'
            });
        });

        // 3. Pengeluaran (Kas Keluar)
        pengeluaran.forEach(p => {
            let kategoriLabel = '';
            switch (p.kategori) {
                case 'BIBIT': kategoriLabel = 'Pembelian Bibit'; break;
                case 'PAKAN': kategoriLabel = 'Pembelian Pakan'; break;
                case 'OBAT': kategoriLabel = 'Pembelian Obat'; break;
                case 'LISTRIK': kategoriLabel = 'Biaya Listrik'; break;
                case 'TENAGA_KERJA': kategoriLabel = 'Biaya Tenaga Kerja'; break;
                case 'LAINNYA': kategoriLabel = 'Lainnya'; break;
                case 'MODAL': kategoriLabel = p.jumlah < 0 ? 'Setoran Modal (Deposit)' : 'Penarikan Modal (Withdraw)'; break;
            }

            transactions.push({
                id: p.id,
                tanggal: p.tanggal,
                waktu: getTime(p.createdAt),
                keterangan: p.kategori === 'MODAL' ? kategoriLabel : `${kategoriLabel} - ${p.keterangan}`,
                kasMasuk: p.kategori === 'MODAL' && p.jumlah < 0 ? Math.abs(p.jumlah) : 0,
                kasKeluar: p.kategori === 'MODAL' ? (p.jumlah > 0 ? p.jumlah : 0) : p.jumlah,
                saldo: 0,
                tipe: p.kategori
            });
        });

        // Finally, sort by date and time (oldest first) for display
        transactions.sort((a, b) => {
            const timeA = a.waktu.replace(/\./g, ':');
            const timeB = b.waktu.replace(/\./g, ':');
            const dateA = new Date(`${a.tanggal}T${timeA}`);
            const dateB = new Date(`${b.tanggal}T${timeB}`);
            return dateA.getTime() - dateB.getTime();
        });

        // Calculate running balance sequentially
        let runningBalance = 0;
        transactions.forEach(t => {
            runningBalance += t.kasMasuk - t.kasKeluar;
            t.saldo = runningBalance;
        });

        return transactions;
    }, [farm, penjualan, pengeluaran, stokPakan, kolam]);

    // Filter by period
    const filteredTransactions = useMemo(() => {
        if (periodFilter === 'semua') return allTransactions;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return allTransactions.filter(t => {
            const txDate = new Date(t.tanggal);
            txDate.setHours(0, 0, 0, 0);

            switch (periodFilter) {
                case 'hari-ini':
                    return txDate.getTime() === today.getTime();

                case 'minggu-ini':
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay());
                    return txDate >= weekStart && txDate <= today;

                case 'bulan-ini':
                    return txDate.getMonth() === today.getMonth() &&
                        txDate.getFullYear() === today.getFullYear();

                default:
                    return true;
            }
        });
    }, [allTransactions, periodFilter]);

    // Calculate summary
    const summary = useMemo(() => {
        const totalMasuk = filteredTransactions.reduce((sum, t) => sum + t.kasMasuk, 0);
        const totalKeluar = filteredTransactions.reduce((sum, t) => sum + t.kasKeluar, 0);
        const saldoAkhir = filteredTransactions.length > 0
            ? filteredTransactions[filteredTransactions.length - 1].saldo
            : 0;

        return { totalMasuk, totalKeluar, saldoAkhir };
    }, [filteredTransactions]);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Laporan Arus Kas</h1>
                        <p className="text-sm text-slate-500 mt-1">Buku kas harian untuk monitoring keuangan</p>
                    </div>
                </div>

                {/* Period Filter */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700">Filter Periode</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { value: 'semua', label: 'Semua' },
                            { value: 'hari-ini', label: 'Hari Ini' },
                            { value: 'minggu-ini', label: 'Minggu Ini' },
                            { value: 'bulan-ini', label: 'Bulan Ini' }
                        ].map(option => (
                            <button
                                key={option.value}
                                onClick={() => setPeriodFilter(option.value as PeriodFilter)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${periodFilter === option.value
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    {/* Total Kas Masuk */}
                    <div className="p-4 sm:p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Total Kas Masuk</p>
                        <p className="text-xl sm:text-2xl font-bold text-emerald-600">
                            Rp {summary.totalMasuk.toLocaleString('id-ID')}
                        </p>
                    </div>

                    {/* Total Kas Keluar */}
                    <div className="p-4 sm:p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                                <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Total Kas Keluar</p>
                        <p className="text-xl sm:text-2xl font-bold text-red-600">
                            Rp {summary.totalKeluar.toLocaleString('id-ID')}
                        </p>
                    </div>

                    {/* Saldo Akhir */}
                    <div className={`p-4 sm:p-6 bg-white border rounded-xl shadow-sm ${summary.saldoAkhir < 0 ? 'border-red-300 bg-red-50' : 'border-slate-200'
                        }`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${summary.saldoAkhir < 0 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            {summary.saldoAkhir < 0 && (
                                <AlertCircle className="w-5 h-5 text-red-500" />
                            )}
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Saldo Akhir</p>
                        <p className={`text-xl sm:text-2xl font-bold ${summary.saldoAkhir < 0 ? 'text-red-600' : 'text-blue-600'
                            }`}>
                            Rp {summary.saldoAkhir.toLocaleString('id-ID')}
                        </p>
                        {summary.saldoAkhir < 0 && (
                            <p className="text-xs text-red-600 mt-2 font-medium">⚠️ Kas Talangan</p>
                        )}
                    </div>
                </div>

                {/* Transaction Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-slate-600" />
                            <h2 className="text-lg font-bold text-slate-900">Rincian Transaksi</h2>
                            <span className="ml-auto text-sm text-slate-500">
                                {filteredTransactions.length} transaksi
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Waktu</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Keterangan</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Kas Masuk</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Kas Keluar</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Saldo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                                            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                            <p>Belum ada transaksi</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-sm font-medium text-slate-900">
                                                    {new Date(tx.tanggal).toLocaleDateString('id-ID', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-sm text-slate-500 font-mono">
                                                    {tx.waktu}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-slate-700">{tx.keterangan}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                {tx.kasMasuk > 0 && (
                                                    <span className="text-sm font-bold text-emerald-600">
                                                        Rp {tx.kasMasuk.toLocaleString('id-ID')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                {tx.kasKeluar > 0 && (
                                                    <span className="text-sm font-bold text-red-600">
                                                        Rp {tx.kasKeluar.toLocaleString('id-ID')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <span className={`text-sm font-bold ${tx.saldo < 0 ? 'text-red-600' : 'text-blue-600'
                                                    }`}>
                                                    Rp {tx.saldo.toLocaleString('id-ID')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
