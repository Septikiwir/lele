'use client';

import DashboardLayout from './components/layout/DashboardLayout';
import Link from 'next/link';
import { useApp } from './context/AppContext';

// Icons
const KolamIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const FishIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const FCRIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

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
  const { kolam, pakan, calculateKepadatan, getStokTersediaByJenis, getAllJenisPakan } = useApp();

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
  const kolamPerhatian = kolam.filter(k => k.status !== 'aman');

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
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolam Perlu Perhatian */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Kolam Perlu Perhatian</h2>
            <Link href="/kolam" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Lihat Semua <ArrowRightIcon />
            </Link>
          </div>

          {kolamPerhatian.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center text-3xl">
                ✅
              </div>
              <p className="text-slate-500">Semua kolam dalam kondisi aman!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {kolamPerhatian.map(k => {
                const kepadatan = calculateKepadatan(k);
                const colors = statusColors[k.status];

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
                        {statusLabels[k.status]}
                      </span>
                      <p className="text-sm text-slate-500 mt-1">
                        {kepadatan.toFixed(1)} ekor/m³
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
            <Link href="/pakan" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Lihat Semua <ArrowRightIcon />
            </Link>
          </div>

          {recentPakan.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">Belum ada data pakan</p>
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
          <Link href="/pakan" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Kelola Stok <ArrowRightIcon />
          </Link>
        </div>
        {stokPerJenis.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-slate-500">Belum ada data stok pakan</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
            className="card card-interactive p-4 text-center hover:border-blue-300"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
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
