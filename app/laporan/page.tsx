'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import Link from 'next/link';
import { useState } from 'react';
import { useApp, KategoriPengeluaran } from '../context/AppContext';
import { DownloadIcon, KolamIcon, FishIcon, CalendarIcon, WalletIcon, TrendingUpIcon } from '../components/ui/Icons';
import EmptyState from '../components/ui/EmptyState';

const statusLabels = {
    aman: 'Aman',
    waspada: 'Waspada',
    berisiko: 'Berisiko',
};

const kategoriLabels: Record<KategoriPengeluaran, string> = {
    BIBIT: 'Bibit',
    PAKAN: 'Pakan',
    OBAT: 'Obat',
    LISTRIK: 'Listrik',
    TENAGA_KERJA: 'Tenaga Kerja',
    LAINNYA: 'Lainnya',
};

export default function LaporanPage() {
    const {
        kolam,
        pakan,
        pengeluaran,
        penjualan,
        calculateKepadatan,
        calculateFCR,
        getTotalPengeluaranByKolam,
        getTotalPengeluaranByKategori,
        getTotalPenjualanByKolam,
        getTotalPenjualan,
        getProfitByKolam,
    } = useApp();
    const [periode, setPeriode] = useState<'semua' | 'minggu' | 'bulan'>('semua');

    // Filter by period
    const filterByPeriod = <T extends { tanggal: string }>(data: T[]): T[] => {
        if (periode === 'semua') return data;

        const now = new Date();
        const cutoff = new Date();
        if (periode === 'minggu') cutoff.setDate(now.getDate() - 7);
        if (periode === 'bulan') cutoff.setMonth(now.getMonth() - 1);

        return data.filter(item => new Date(item.tanggal) >= cutoff);
    };

    const filteredPakan = filterByPeriod(pakan);
    const filteredPengeluaran = filterByPeriod(pengeluaran);

    // Total modal (pengeluaran) by kategori
    const totalModalByKategori = (Object.keys(kategoriLabels) as KategoriPengeluaran[]).reduce((acc, kat) => {
        acc[kat] = filteredPengeluaran.filter(p => p.kategori === kat).reduce((sum, p) => sum + p.jumlah, 0);
        return acc;
    }, {} as Record<KategoriPengeluaran, number>);

    const totalModal = filteredPengeluaran.reduce((sum, p) => sum + p.jumlah, 0);
    const totalPendapatan = getTotalPenjualan();

    // Generate report data per kolam
    const reportData = kolam.map(k => {
        const kolamPakan = filteredPakan.filter(p => p.kolamId === k.id);
        const kolamPengeluaran = filteredPengeluaran.filter(p => p.kolamId === k.id);
        const kolamPenjualan = penjualan.filter(p => p.kolamId === k.id);

        const totalPakan = kolamPakan.reduce((sum, p) => sum + p.jumlahKg, 0);
        const fcr = calculateFCR(k.id);
        const kepadatan = calculateKepadatan(k);

        // Actual revenue from penjualan
        const actualRevenue = kolamPenjualan.reduce((sum, p) => sum + (p.beratKg * p.hargaPerKg), 0);
        const totalBeratTerjual = kolamPenjualan.reduce((sum, p) => sum + p.beratKg, 0);

        // Estimate revenue for comparison
        const survivalRate = 0.85;
        const avgWeight = 150; // gram
        const pricePerKg = 25000;
        const estimatedFish = k.jumlahIkan * survivalRate;
        const estimatedWeight = (estimatedFish * avgWeight) / 1000;
        const estimatedRevenue = estimatedWeight * pricePerKg;

        // Total modal per kolam (from pengeluaran data)
        const totalKolamModal = kolamPengeluaran.reduce((sum, p) => sum + p.jumlah, 0);

        // Modal breakdown
        const modalBibit = kolamPengeluaran.filter(p => p.kategori === 'BIBIT').reduce((sum, p) => sum + p.jumlah, 0);
        const modalPakan = kolamPengeluaran.filter(p => p.kategori === 'PAKAN').reduce((sum, p) => sum + p.jumlah, 0);
        const modalObat = kolamPengeluaran.filter(p => p.kategori === 'OBAT').reduce((sum, p) => sum + p.jumlah, 0);
        const modalLainnya = kolamPengeluaran.filter(p => !['BIBIT', 'PAKAN', 'OBAT'].includes(p.kategori)).reduce((sum, p) => sum + p.jumlah, 0);

        // Deaths (simplified)
        const deaths = Math.floor(k.jumlahIkan * (1 - survivalRate));

        // Use actual revenue if available, otherwise use estimate
        const revenue = actualRevenue > 0 ? actualRevenue : estimatedRevenue;
        const profit = revenue - totalKolamModal;

        return {
            id: k.id,
            nama: k.nama,
            dimensi: `${k.panjang}×${k.lebar}×${k.kedalaman}m`,
            jumlahIkan: k.jumlahIkan,
            kepadatan: kepadatan.toFixed(1),
            status: k.status,
            totalPakan,
            fcr: fcr === 0 ? '-' : fcr.toFixed(2),
            deaths,
            actualRevenue,
            estimatedRevenue,
            totalBeratTerjual,
            totalModal: totalKolamModal,
            modalBibit,
            modalPakan,
            modalObat,
            modalLainnya,
            profit,
            hasActualSales: actualRevenue > 0,
        };
    });

    // Export to CSV
    const exportCSV = () => {
        const headers = [
            'Nama Kolam',
            'Dimensi',
            'Jumlah Ikan',
            'Kepadatan (/m³)',
            'Status',
            'Total Pakan (kg)',
            'FCR',
            'Est. Kematian',
            'Modal Bibit (Rp)',
            'Modal Pakan (Rp)',
            'Modal Obat (Rp)',
            'Modal Lainnya (Rp)',
            'Total Modal (Rp)',
            'Est. Pendapatan (Rp)',
            'Est. Profit (Rp)',
        ];

        const rows = reportData.map(r => [
            r.nama,
            r.dimensi,
            r.jumlahIkan,
            r.kepadatan,
            statusLabels[r.status],
            r.totalPakan,
            r.fcr,
            r.deaths,
            r.modalBibit,
            r.modalPakan,
            r.modalObat,
            r.modalLainnya,
            r.totalModal,
            r.estimatedRevenue,
            r.profit,
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `laporan-lele-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        URL.revokeObjectURL(url);
    };

    // Totals
    const totals = {
        kolam: kolam.length,
        ikan: kolam.reduce((sum, k) => sum + k.jumlahIkan, 0),
        pakan: filteredPakan.reduce((sum, p) => sum + p.jumlahKg, 0),
        actualRevenue: reportData.reduce((sum, r) => sum + r.actualRevenue, 0),
        estimatedRevenue: reportData.reduce((sum, r) => sum + r.estimatedRevenue, 0),
        modal: totalModal,
        profit: reportData.reduce((sum, r) => sum + r.profit, 0),
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Laporan</h1>
                    <p className="text-slate-500 mt-1">Ringkasan performa peternakan</p>
                </div>
                <div className="flex gap-4">
                    <select
                        value={periode}
                        onChange={(e) => setPeriode(e.target.value as 'semua' | 'minggu' | 'bulan')}
                        className="input py-2 w-40"
                    >
                        <option value="semua">Semua Waktu</option>
                        <option value="minggu">7 Hari Terakhir</option>
                        <option value="bulan">30 Hari Terakhir</option>
                    </select>
                    <button onClick={exportCSV} className="btn btn-primary">
                        <DownloadIcon />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                <div className="stat-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="stat-label">Total Kolam</p>
                            <p className="stat-value">{totals.kolam}</p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600">
                            <KolamIcon />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="stat-label">Total Ikan</p>
                            <p className="stat-value">{totals.ikan.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-cyan-100 flex items-center justify-center text-cyan-600">
                            <FishIcon />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="stat-label">Total Pakan</p>
                            <p className="stat-value">{totals.pakan}<span className="text-sm font-normal text-slate-400"> kg</span></p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                            <CalendarIcon />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="stat-label">{totals.actualRevenue > 0 ? 'Pendapatan' : 'Est. Omzet'}</p>
                            <p className="stat-value text-green-600">
                                {((totals.actualRevenue > 0 ? totals.actualRevenue : totals.estimatedRevenue) / 1000000).toFixed(1)}<span className="text-sm font-normal text-slate-400"> jt</span>
                            </p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-green-600">
                            <WalletIcon />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="stat-label">Total Modal</p>
                            <p className="stat-value text-red-600">
                                {(totals.modal / 1000000).toFixed(1)}<span className="text-sm font-normal text-slate-400"> jt</span>
                            </p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                            <WalletIcon />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="stat-label">{totals.actualRevenue > 0 ? 'Profit' : 'Est. Profit'}</p>
                            <p className={`stat-value ${totals.profit >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
                                {(totals.profit / 1000000).toFixed(1)}<span className="text-sm font-normal text-slate-400"> jt</span>
                            </p>
                        </div>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${totals.profit >= 0 ? 'bg-teal-100 text-teal-600' : 'bg-red-100 text-red-600'}`}>
                            <TrendingUpIcon />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Breakdown */}
            <div className="card p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">💰 Rincian Modal / Pengeluaran</h2>
                    <Link href="/pengeluaran" className="text-sm text-teal-600 hover:text-teal-700">
                        Kelola Pengeluaran →
                    </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-teal-50 rounded-xl p-4">
                        <p className="text-xs text-teal-600 font-medium">🐟 Bibit</p>
                        <p className="text-lg font-bold text-slate-900">Rp {totalModalByKategori.BIBIT.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4">
                        <p className="text-xs text-amber-600 font-medium">🍚 Pakan</p>
                        <p className="text-lg font-bold text-slate-900">Rp {totalModalByKategori.PAKAN.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4">
                        <p className="text-xs text-purple-600 font-medium">💊 Obat</p>
                        <p className="text-lg font-bold text-slate-900">Rp {totalModalByKategori.OBAT.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4">
                        <p className="text-xs text-yellow-600 font-medium">⚡ Listrik</p>
                        <p className="text-lg font-bold text-slate-900">Rp {totalModalByKategori.LISTRIK.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                        <p className="text-xs text-green-600 font-medium">👷 Tenaga Kerja</p>
                        <p className="text-lg font-bold text-slate-900">Rp {totalModalByKategori.TENAGA_KERJA.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="bg-slate-100 rounded-xl p-4">
                        <p className="text-xs text-slate-600 font-medium">📦 Lainnya</p>
                        <p className="text-lg font-bold text-slate-900">Rp {totalModalByKategori.LAINNYA.toLocaleString('id-ID')}</p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Total Modal</span>
                    <span className="text-2xl font-bold text-red-600">Rp {totalModal.toLocaleString('id-ID')}</span>
                </div>
            </div>

            {/* Report Table */}
            <div className="card overflow-hidden">
                <div className="p-6 border-b">
                    <h2 className="text-lg font-semibold text-slate-900">Laporan Per Kolam</h2>
                </div>
                {reportData.length === 0 ? (
                    <EmptyState
                        title="Belum Ada Data Kolam"
                        description="Belum ada data kolam yang tersedia untuk laporan"
                        icon="📊"
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Kolam</th>
                                    <th>Dimensi</th>
                                    <th className="text-right">Ikan</th>
                                    <th className="text-right">Kepadatan</th>
                                    <th>Status</th>
                                    <th className="text-right">Pakan (kg)</th>
                                    <th className="text-right">FCR</th>
                                    <th className="text-right">Modal</th>
                                    <th className="text-right">Est. Omzet</th>
                                    <th className="text-right">Est. Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map(r => (
                                    <tr key={r.id}>
                                        <td className="font-semibold">{r.nama}</td>
                                        <td className="text-slate-500">{r.dimensi}</td>
                                        <td className="text-right">{r.jumlahIkan.toLocaleString('id-ID')}</td>
                                        <td className="text-right">{r.kepadatan}/m³</td>
                                        <td>
                                            <span className={`badge ${r.status === 'aman' ? 'badge-success' :
                                                r.status === 'waspada' ? 'badge-warning' : 'badge-danger'
                                                }`}>
                                                {statusLabels[r.status]}
                                            </span>
                                        </td>
                                        <td className="text-right">{r.totalPakan}</td>
                                        <td className="text-right">{r.fcr}</td>
                                        <td className="text-right text-red-600 font-medium">
                                            Rp {r.totalModal.toLocaleString('id-ID')}
                                        </td>
                                        <td className="text-right font-medium text-green-600">
                                            Rp {r.estimatedRevenue.toLocaleString('id-ID')}
                                        </td>
                                        <td className={`text-right font-bold ${r.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            Rp {r.profit.toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50">
                                <tr>
                                    <td colSpan={2} className="font-semibold">TOTAL</td>
                                    <td className="text-right font-semibold">{totals.ikan.toLocaleString('id-ID')}</td>
                                    <td></td>
                                    <td></td>
                                    <td className="text-right font-semibold">{totals.pakan}</td>
                                    <td></td>
                                    <td className="text-right font-semibold text-red-600">
                                        Rp {totals.modal.toLocaleString('id-ID')}
                                    </td>
                                    <td className="text-right font-semibold text-green-600">
                                        Rp {(totals.actualRevenue > 0 ? totals.actualRevenue : totals.estimatedRevenue).toLocaleString('id-ID')}
                                    </td>
                                    <td className={`text-right font-bold ${totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        Rp {totals.profit.toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
