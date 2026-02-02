'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import { Box, Fish, Calendar, Plus, ArrowRight, Container, Banknote } from 'lucide-react';

// Components
import FeedTrendChart from '../components/dashboard/FeedTrendChart';
import AssetValueCard from '../components/dashboard/AssetValueCard';
import ActivityStream from '../components/dashboard/ActivityStream';
import AlertCenter from '../components/dashboard/AlertCenter';
import FeedStockList from '../components/dashboard/FeedStockList';
import HarvestForecastWidget from '../components/dashboard/HarvestForecastWidget';
import ProfitabilityWidget from '../components/dashboard/ProfitabilityWidget';

export default function DashboardPage() {
  const { kolam, pakan, pengeluaran } = useApp();

  // Format currency: convert to "jt" if >= 1,000,000, else "k" if >= 1,000
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'jt';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'k';
    }
    return value.toLocaleString('id-ID');
  };

  // Basic Stats
  const totalKolam = kolam.length;
  const totalIkan = kolam.reduce((sum, k) => sum + k.jumlahIkan, 0);
  const pakanHariIni = pakan
    .filter(p => p.tanggal === new Date().toISOString().split('T')[0])
    .reduce((sum, p) => sum + p.jumlahKg, 0);
  
  // Calculate Total Modal (all pengeluaran)
  const totalModal = pengeluaran.reduce((sum, p) => sum + p.jumlah, 0);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 sm:gap-6">

        {/* ROW 1: Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 text-sm">Ringkasan operasional tambak Anda.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/pakan" className="btn btn-secondary text-sm">
              <Container className="w-4 h-4" /> Input Pakan
            </Link>
            <Link href="/kolam/tambah" className="btn btn-primary text-sm">
              <Plus className="w-4 h-4" /> Tambah Kolam
            </Link>
          </div>
        </div>

        {/* ROW 2: High Level KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* 1. Asset Value (Main Financial KPI) */}
          <AssetValueCard />

          {/* 2. Total Modal */}
          <div className="w-full p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                <Banknote className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Modal</p>
            </div>
            <h5 className="mb-2 text-2xl font-semibold tracking-tight text-slate-900">Rp{formatCurrency(totalModal)}</h5>
            <p className="mb-3 text-sm text-slate-600">
              Semua pengeluaran
            </p>
            <Link href="/pengeluaran" className="inline-flex font-medium items-center text-blue-600 hover:underline text-sm">
              Detail
              <svg className="w-3 h-3 ms-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>

          {/* 3. Biological KPI (Population) */}
          <div className="w-full p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
                <Fish className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Populasi</p>
            </div>
            <h5 className="mb-2 text-2xl font-semibold tracking-tight text-slate-900">{totalIkan.toLocaleString('id-ID')} <span className="text-sm font-normal text-slate-500">ekor</span></h5>
            <p className="mb-3 text-sm text-slate-600">
              <strong>{totalKolam}</strong> Kolam Aktif
            </p>
            <Link href="/kolam" className="inline-flex font-medium items-center text-blue-600 hover:underline text-sm">
              Detail
              <svg className="w-3 h-3 ms-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>

          {/* 4. Operational KPI (Feed Today) */}
          <div className="w-full p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pakan Hari Ini</p>
            </div>
            <h5 className="mb-2 text-2xl font-semibold tracking-tight text-slate-900">{pakanHariIni.toFixed(1)} <span className="text-sm font-normal text-slate-500">kg</span></h5>
            <p className="mb-3 text-sm text-slate-600">
              Update: Hari ini
            </p>
            <Link href="/pakan" className="inline-flex font-medium items-center text-blue-600 hover:underline text-sm">
              Riwayat
              <svg className="w-3 h-3 ms-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
        </div>

        {/* ROW 3: The "Management" Layer (Alerts + Trends) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 h-auto lg:h-[400px]">
          {/* Left: Alerts Center (Priority) - Takes 4 cols */}
          <div className="lg:col-span-4 h-full">
            <AlertCenter />
          </div>

          {/* Right: Feed Trend (Context) - Takes 8 cols */}
          <div className="lg:col-span-8 h-full">
            <FeedTrendChart />
          </div>
        </div>

        {/* ROW 4: Predictive Analytics Layer (New) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-auto">
          <HarvestForecastWidget />
          <ProfitabilityWidget />
        </div>

        {/* ROW 5: Feed Stock List */}
        <div className="w-full">
          <FeedStockList />
        </div>

        {/* ROW 6: Detailed Activity Stream */}
        <div className="w-full">
          <ActivityStream />
        </div>
      </div>
    </DashboardLayout>
  );
}
