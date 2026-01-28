'use client';

import DashboardLayout from './components/layout/DashboardLayout';
import Link from 'next/link';
import { useApp } from './context/AppContext';
import { WarningIcon, KolamIcon, FishIcon, FCRIcon, CalendarIcon, ArrowRightIcon } from './components/ui/Icons';
import EmptyState from './components/ui/EmptyState';

const statusColors = {
  aman: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  waspada: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  berisiko: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
};

const statusLabels = {
  aman: 'Aman',
  waspada: 'Waspada',
  berisiko: 'Berisiko',
};

export default function Home() {
  const { kolam, pakan, calculateKepadatan, getStokTersediaByJenis, getAllJenisPakan, getUnifiedStatus } = useApp();

  // Calculate stats
  const totalKolam = kolam.length;
  const totalIkan = kolam.reduce((sum, k) => sum + k.jumlahIkan, 0);
  const avgKepadatan = kolam.length > 0
    ? kolam.reduce((sum, k) => sum + calculateKepadatan(k), 0) / kolam.length
    : 0;
  const pakanHariIni = pakan
    .filter(p => p.tanggal === new Date().toISOString().split('T')[0])
    .reduce((sum, p) => sum + p.jumlahKg, 0);

  // Get kolam that need attention (waspada or berisiko)
  const kolamPerhatian = kolam.filter(k => {
    const status = getUnifiedStatus(k.id).status;
    return status !== 'aman';
  });

  // Recent pakan entries
  const recentPakan = pakan.slice(0, 5);

  // Get stok pakan
  const allJenisPakan = getAllJenisPakan();
  const stokPerJenis = allJenisPakan.map(jenis => ({
    jenis,
    tersedia: getStokTersediaByJenis(jenis),
  }));
  const lowStokCount = stokPerJenis.filter(s => s.tersedia <= 10).length;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Selamat datang di LeleFarm Management System</p>
      </div>

      {/* Alert Banner - Stok Menipis */}
      {lowStokCount > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <WarningIcon />
            </div>
            <div>
              <p className="font-semibold">⚠️ Peringatan Stok Menipis!</p>
              <p className="text-sm text-white/80">
                {lowStokCount} jenis pakan memiliki stok ≤10kg. Segera lakukan pembelian.
              </p>
            </div>
          </div>
          <Link href="/pakan" className="px-4 py-2 bg-white text-orange-600 rounded-lg font-medium text-sm hover:bg-white/90 transition-colors">
            Kelola Stok
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total Kolam</p>
              <p className="stat-value">{totalKolam}</p>
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
              <p className="stat-value">{totalIkan.toLocaleString('id-ID')}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-cyan-100 flex items-center justify-center text-cyan-600">
              <FishIcon />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Rata-rata Kepadatan</p>
              <p className="stat-value">{avgKepadatan.toFixed(1)}<span className="text-lg font-normal text-slate-400">/m³</span></p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
              <FCRIcon />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Pakan Hari Ini</p>
              <p className="stat-value">{pakanHariIni}<span className="text-lg font-normal text-slate-400"> kg</span></p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
              <CalendarIcon />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Kolam Perlu Perhatian */}
        <div className="lg:col-span-2 xl:col-span-3 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Kolam Perlu Perhatian</h2>
            <Link href="/kolam" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
              Lihat Semua <ArrowRightIcon />
            </Link>
          </div>

          {kolamPerhatian.length === 0 ? (
            <EmptyState
              title="Semua Kolam Aman"
              description="Tidak ada kolam yang memerlukan perhatian khusus saat ini"
              icon="✅"
            />
          ) : (
            <div className="space-y-3">
              {kolamPerhatian.map(k => {
                const unifiedStatus = getUnifiedStatus(k.id);
                const colors = statusColors[unifiedStatus.status];

                return (
                  <Link
                    key={k.id}
                    href={`/kolam/${k.id}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center text-2xl`}>
                        🐟
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{k.nama}</h3>
                        <p className="text-sm text-slate-500">
                          {k.panjang}m × {k.lebar}m • {k.jumlahIkan.toLocaleString('id-ID')} ekor
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`badge ${colors.bg} ${colors.text}`}>
                        {statusLabels[unifiedStatus.status]}
                      </span>
                      <p className="text-sm text-slate-500 mt-1">
                        {unifiedStatus.source === 'berat'
                          ? `${unifiedStatus.kepadatanBerat.toFixed(1)} kg/m³`
                          : `${unifiedStatus.kepadatanEkor.toFixed(1)} ekor/m³`}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity / Recent Pakan */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Riwayat Pakan</h2>
            <Link href="/pakan" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
              Lihat Semua <ArrowRightIcon />
            </Link>
          </div>

          {recentPakan.length === 0 ? (
            <div className="py-8">
              <EmptyState title="Belum Ada Data" description="Belum ada pencatatan pakan" icon="🍚" />
            </div>
          ) : (
            <div className="space-y-4">
              {recentPakan.map(p => {
                const k = kolam.find(kol => kol.id === p.kolamId);
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-lg">
                      🍚
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {k?.nama || 'Unknown'}
                      </p>
                      <p className="text-sm text-slate-500">{p.jenisPakan}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{p.jumlahKg} kg</p>
                      <p className="text-xs text-slate-400">{p.tanggal}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Stok Pakan Tersedia */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900">📦 Stok Pakan</h2>
            {lowStokCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                <WarningIcon /> {lowStokCount} menipis
              </span>
            )}
          </div>
          <Link href="/pakan" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
            Kelola Stok <ArrowRightIcon />
          </Link>
        </div>
        {stokPerJenis.length === 0 ? (
          <EmptyState
            title="Belum Ada Data Stok"
            description="Data stok pakan belum tersedia"
            icon="📦"
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
            {stokPerJenis.map(s => {
              const isLow = s.tersedia <= 10;
              const isEmpty = s.tersedia <= 0;
              return (
                <div
                  key={s.jenis}
                  className={`card p-4 border-2 ${isEmpty ? 'bg-red-50 border-red-200' :
                    isLow ? 'bg-amber-50 border-amber-200' :
                      'bg-green-50 border-green-200'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🍚</span>
                    <p className="text-sm font-medium text-slate-700 truncate">{s.jenis}</p>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className={`text-xl font-bold ${isEmpty ? 'text-red-600' :
                        isLow ? 'text-amber-600' :
                          'text-green-600'
                        }`}>
                        {s.tersedia.toFixed(1)}
                      </p>
                      <p className="text-xs text-slate-500">kg</p>
                    </div>
                    {(isLow || isEmpty) && (
                      <div className={`p-1 rounded-full ${isEmpty ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                        <WarningIcon />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/kolam/tambah"
            className="card card-interactive p-4 text-center hover:border-teal-300"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-teal-100 flex items-center justify-center text-2xl">
              ➕
            </div>
            <p className="font-medium text-slate-900">Tambah Kolam</p>
          </Link>

          <Link
            href="/pakan"
            className="card card-interactive p-4 text-center hover:border-amber-300"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-amber-100 flex items-center justify-center text-2xl">
              🍚
            </div>
            <p className="font-medium text-slate-900">Input Pakan</p>
          </Link>

          <Link
            href="/kualitas-air"
            className="card card-interactive p-4 text-center hover:border-cyan-300"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-cyan-100 flex items-center justify-center text-2xl">
              💧
            </div>
            <p className="font-medium text-slate-900">Cek Air</p>
          </Link>

          <Link
            href="/laporan"
            className="card card-interactive p-4 text-center hover:border-purple-300"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-100 flex items-center justify-center text-2xl">
              📊
            </div>
            <p className="font-medium text-slate-900">Lihat Laporan</p>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
