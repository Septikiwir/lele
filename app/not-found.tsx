'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        {/* 404 Text */}
        <h1 className="text-6xl font-light text-slate-900 mb-2">404</h1>
        <h2 className="text-xl text-slate-600 font-light mb-4">Halaman Tidak Ditemukan</h2>

        {/* Description */}
        <p className="text-slate-500 text-sm mb-8">
          Maaf, halaman yang Anda cari tidak tersedia.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-lg transition-colors text-sm font-medium"
          >
            Kembali
          </button>
          <Link
            href="/login"
            className="px-6 py-2.5 text-white bg-slate-700 hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
