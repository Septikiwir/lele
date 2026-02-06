"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw, Database } from "lucide-react";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        // Attempt to reload the page when connection is restored
        window.location.reload();
      }
    };

    setIsOnline(navigator.onLine);

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6">
          <WifiOff className="w-10 h-10 text-orange-600" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          Anda Sedang Offline
        </h1>

        <p className="text-slate-600 mb-6 leading-relaxed">
          Koneksi internet tidak tersedia. Beberapa fitur mungkin tidak dapat
          diakses saat ini.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Data Tersimpan Lokal
              </p>
              <p className="text-xs text-blue-700">
                Data yang sudah Anda lihat sebelumnya tersimpan di perangkat
                dan dapat diakses secara offline.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRetry}
          disabled={!isOnline}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            isOnline
              ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          {isOnline ? "Coba Lagi" : "Menunggu Koneksi..."}
        </button>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Saran:
          </h3>
          <ul className="text-xs text-slate-600 space-y-2 text-left">
            <li className="flex items-start gap-2">
              <span className="text-slate-400">•</span>
              <span>Periksa koneksi WiFi atau data seluler Anda</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400">•</span>
              <span>Pastikan mode pesawat tidak aktif</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400">•</span>
              <span>
                Kembali ke halaman sebelumnya menggunakan tombol back browser
              </span>
            </li>
          </ul>
        </div>

        <div className="mt-6">
          <a
            href="/"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Kembali ke Beranda
          </a>
        </div>
      </div>
    </div>
  );
}
