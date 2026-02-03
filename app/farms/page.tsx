'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Plus, Edit2, Trash2, Users, LogOut, AlertCircle } from 'lucide-react';

interface Farm {
  id: string;
  nama: string;
  alamat?: string;
  createdAt: string;
  owner: {
    name: string;
    email: string;
  };
}

export default function SuperAdminFarmsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Check authorization
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }
    
    if (status === 'authenticated' && session?.user) {
      // Check if user is superadmin
      // For now, we'll fetch user data to check role
      fetchUserRole();
    }
  }, [status, session, router]);

  const fetchUserRole = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      
      if (data.role === 'SUPERADMIN') {
        setIsAuthorized(true);
        fetchFarms();
      } else {
        setError('Akses ditolak. Hanya superadmin yang bisa mengakses halaman ini.');
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    } catch (err) {
      setError('Error checking authorization');
    } finally {
      setLoading(false);
    }
  };

  const fetchFarms = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/farms');
      if (!res.ok) throw new Error('Failed to fetch farms');
      
      const data = await res.json();
      setFarms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading farms');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFarmId) return;

    try {
      const res = await fetch(`/api/admin/farms/${selectedFarmId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete farm');

      setFarms(farms.filter(f => f.id !== selectedFarmId));
      setShowDeleteConfirm(false);
      setSelectedFarmId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting farm');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Akses Ditolak</h1>
          <p className="text-slate-600 mb-6">Hanya superadmin yang bisa mengakses halaman ini</p>
          <Link href="/dashboard" className="text-teal-600 hover:text-teal-700">
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                  SUPERADMIN
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Manajemen Peternakan</h1>
              <p className="text-slate-600 mt-1">Kelola semua peternakan dan pemiliknya</p>
            </div>
            <Link
              href="/admin/farms/create"
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            >
              <Plus size={20} />
              Buat Peternakan
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {farms.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🐠</div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Belum ada peternakan</h2>
            <p className="text-slate-600 mb-6">Buat peternakan pertama</p>
            <Link
              href="/admin/farms/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            >
              <Plus size={20} />
              Buat Peternakan
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {farms.map((farm) => (
              <div
                key={farm.id}
                className="bg-white rounded-lg border border-slate-200 hover:border-teal-300 hover:shadow-md transition p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900">{farm.nama}</h3>
                    {farm.alamat && (
                      <p className="text-sm text-slate-600 mt-1">{farm.alamat}</p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 rounded p-3 mb-4">
                  <p className="text-xs text-slate-600">Pemilik</p>
                  <p className="font-semibold text-slate-900">{farm.owner.name}</p>
                  <p className="text-xs text-slate-500">{farm.owner.email}</p>
                </div>

                <p className="text-xs text-slate-500 mb-4">
                  Dibuat: {new Date(farm.createdAt).toLocaleDateString('id-ID')}
                </p>

                <div className="flex gap-2">
                  <Link
                    href={`/admin/farms/${farm.id}/edit`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-sm font-medium"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                    <span className="hidden sm:inline">Edit</span>
                  </Link>

                  <button
                    onClick={() => {
                      setSelectedFarmId(farm.id);
                      setShowDeleteConfirm(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition text-sm font-medium"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                    <span className="hidden sm:inline">Hapus</span>
                  </button>

                  <Link
                    href={`/admin/farms/${farm.id}/owner`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition text-sm font-medium"
                    title="Kelola Anggota"
                  >
                    <Users size={16} />
                    <span className="hidden sm:inline">Anggota</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Hapus Peternakan?</h3>
            <p className="text-slate-600 mb-6">
              Tindakan ini tidak dapat dibatalkan. Semua data akan dihapus.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
