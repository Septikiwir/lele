'use client';

import DashboardLayout from './components/layout/DashboardLayout';
import Link from 'next/link';
import { useApp } from './context/AppContext';
import { KolamIcon, FishIcon, CalendarIcon, PlusIcon, ArrowRightIcon } from './components/ui/Icons';

// Components
import FeedTrendChart from './components/dashboard/FeedTrendChart';
import AssetValueCard from './components/dashboard/AssetValueCard';
import ActivityStream from './components/dashboard/ActivityStream';
import AlertCenter from './components/dashboard/AlertCenter';
import FeedStockList from './components/dashboard/FeedStockList';
import HarvestForecastWidget from './components/dashboard/HarvestForecastWidget';
import ProfitabilityWidget from './components/dashboard/ProfitabilityWidget';

export default function Home() {
  const { kolam, pakan } = useApp();

  // Basic Stats
  const totalKolam = kolam.length;
  const totalIkan = kolam.reduce((sum, k) => sum + k.jumlahIkan, 0);
  const pakanHariIni = pakan
    .filter(p => p.tanggal === new Date().toISOString().split('T')[0])
    .reduce((sum, p) => sum + p.jumlahKg, 0);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 sm:gap-6">

        {/* ROW 1: Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 text-sm">Ringkasan operasional tambak Anda.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/pakan" className="btn btn-secondary text-sm">
              🍚 Input Pakan
            </Link>
            <Link href="/kolam/tambah" className="btn btn-primary text-sm">
              <PlusIcon /> Tambah Kolam
            </Link>
          </div>
        </div>

        {/* ROW 2: High Level KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 1. Asset Value (Main Financial KPI) */}
          <AssetValueCard />

          {/* 2. Biological KPI (Population) */}
          <div className="stat-card p-6 relative overflow-hidden group hover:shadow-md transition-all border border-slate-100 bg-white">
            <div className="flex items-start justify-between z-10 relative">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Populasi Ikan</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-2xl font-bold text-slate-900">{totalIkan.toLocaleString('id-ID')}</p>
                  <span className="text-xs text-slate-400 font-normal">ekor</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 group-hover:bg-cyan-100 transition-colors">
                <FishIcon />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span><strong>{totalKolam}</strong> Kolam Aktif</span>
              <Link href="/kolam" className="text-cyan-600 font-medium hover:underline flex items-center gap-1">
                Detail <ArrowRightIcon />
              </Link>
            </div>
          </div>

          {/* 3. Operational KPI (Feed Today) */}
          <div className="stat-card p-6 relative overflow-hidden group hover:shadow-md transition-all border border-slate-100 bg-white">
            <div className="flex items-start justify-between z-10 relative">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Pakan Hari Ini</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-2xl font-bold text-slate-900">{pakanHariIni.toFixed(1)}</p>
                  <span className="text-xs text-slate-400 font-normal">kg</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors">
                <CalendarIcon />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Update: Hari ini</span>
              <Link href="/pakan" className="text-amber-600 font-medium hover:underline flex items-center gap-1">
                Riwayat <ArrowRightIcon />
              </Link>
            </div>
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

        {/* ROW 5: Detailed Activity Stream */}
        <div className="w-full">
          <ActivityStream />
        </div>
      </div>
    </DashboardLayout>
  );
}
