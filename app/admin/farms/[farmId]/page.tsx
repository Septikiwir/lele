'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Edit2, Users, Trash2, AlertCircle } from 'lucide-react';

interface Farm {
  id: string;
  nama: string;
  alamat?: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
}

interface FarmMember {
  id: string;
  userId: string;
  farmId: string;
  role: string;
  user: {
    name: string;
    email: string;
  };
}

export default function FarmDetailPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.farmId as string;
  const { data: session, status } = useSession();

  const [farm, setFarm] = useState<Farm | null>(null);
  const [members, setMembers] = useState<FarmMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      checkAuthAndLoad();
    }
  }, [status, session, router]);

  const checkAuthAndLoad = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (data.role === 'SUPERADMIN') {
        setIsAuthorized(true);
        await loadFarmDetail();
      } else {
        setError('Akses ditolak');
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    } catch (err) {
      setError('Error checking authorization');
    } finally {
      setLoading(false);
    }
  };

  const loadFarmDetail = async () => {
    try {
      const res = await fetch(`/api/admin/farms/${farmId}`);
      if (!res.ok) throw new Error('Farm not found');

      const farmData = await res.json();
      setFarm(farmData);

      // Load farm members
      const membersRes = await fetch(`/api/admin/farms/${farmId}/members`);
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading farm');
    } finally {
      setLoading(false);
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
          <p className="text-slate-600">Hanya superadmin yang bisa mengakses halaman ini</p>
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Peternakan tidak ditemukan</h1>
          <Link href="/farms" className="text-teal-600 hover:text-teal-700">
            Kembali ke daftar peternakan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/farms"
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-4"
          >
            <ArrowLeft size={20} />
            Kembali ke Daftar
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">{farm.nama}</h1>
          <p className="text-slate-600 mt-2">{farm.alamat || 'Alamat tidak tersedia'}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6">
          {/* Farm Info Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Informasi Peternakan</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm text-slate-600">Nama Peternakan</label>
                <p className="text-lg font-semibold text-slate-900">{farm.nama}</p>
              </div>
              <div>
                <label className="text-sm text-slate-600">Alamat</label>
                <p className="text-lg font-semibold text-slate-900">{farm.alamat || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-slate-600">Tanggal Dibuat</label>
                <p className="text-lg font-semibold text-slate-900">
                  {new Date(farm.createdAt).toLocaleDateString('id-ID')}
                </p>
              </div>
              <div>
                <label className="text-sm text-slate-600">ID Peternakan</label>
                <p className="text-lg font-semibold text-slate-900 font-mono text-sm">{farm.id}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href={`/admin/farms/${farm.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Edit2 size={18} />
                Edit Peternakan
              </Link>
              <Link
                href={`/admin/farms/${farm.id}/owner`}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <Users size={18} />
                Kelola Pemilik
              </Link>
            </div>
          </div>

          {/* Owner Info Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Pemilik Peternakan</h2>

            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600">Nama Pemilik</p>
                <p className="text-lg font-semibold text-slate-900">{farm.owner.name}</p>
                <p className="text-sm text-slate-500 mt-1">{farm.owner.email}</p>
              </div>
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Pemilik
              </div>
            </div>
          </div>

          {/* Members Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Anggota Peternakan</h2>
              <Link
                href={`/admin/farms/${farm.id}/owner`}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded hover:bg-teal-200 transition"
              >
                <Users size={16} />
                Kelola
              </Link>
            </div>

            {members.length === 0 ? (
              <p className="text-slate-600">Belum ada anggota</p>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{member.user.name}</p>
                      <p className="text-sm text-slate-600">{member.user.email}</p>
                    </div>
                    <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {member.role}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Statistics Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Statistik</h2>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-3xl font-bold text-teal-600">{members.length}</p>
                <p className="text-sm text-slate-600">Total Anggota</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">1</p>
                <p className="text-sm text-slate-600">Pemilik</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{members.length - 1}</p>
                <p className="text-sm text-slate-600">Operator</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
