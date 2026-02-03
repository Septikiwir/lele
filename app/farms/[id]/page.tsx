'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Edit2, Users, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface Farm {
  id: string;
  nama: string;
  alamat?: string;
  createdAt: string;
  owner: {
    name: string;
    email: string;
  };
  _count: {
    kolam: number;
  };
}

export default function FarmDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const farmId = params.id as string;

  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch farm data
  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchFarm = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/farms/${farmId}`);
        if (!res.ok) throw new Error('Failed to fetch farm');
        
        const data = await res.json();
        setFarm(data);
        setIsOwner(data.ownerId === session?.user?.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading farm');
      } finally {
        setLoading(false);
      }
    };

    fetchFarm();
  }, [farmId, status, session?.user?.id]);

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

  if (!farm) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Peternakan Tidak Ditemukan</h1>
          <Link
            href="/farms"
            className="text-teal-600 hover:text-teal-700"
          >
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/farms"
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-4"
          >
            <ArrowLeft size={20} />
            Kembali
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{farm.nama}</h1>
              {farm.alamat && (
                <p className="text-slate-600 mt-1">{farm.alamat}</p>
              )}
              <p className="text-sm text-slate-500 mt-2">
                Pemilik: {farm.owner.name} ({farm.owner.email})
              </p>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <Link
                  href={`/farms/${farm.id}/edit`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Edit2 size={20} />
                  Edit
                </Link>
                <Link
                  href={`/farms/${farm.id}/members`}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  <Users size={20} />
                  Anggota
                </Link>
              </div>
            )}
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

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-100 rounded-lg">
                <BarChart3 size={24} className="text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Kolam</p>
                <p className="text-3xl font-bold text-slate-900">{farm._count.kolam}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Status</p>
                <p className="text-3xl font-bold text-slate-900">Aktif</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l10-10V2.586A1.586 1.586 0 0 0 16.414 1H3.586A1.586 1.586 0 0 0 2 2.586v12.828l10-10V1.586z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-600">Dibuat</p>
                <p className="text-lg font-semibold text-slate-900">
                  {new Date(farm.createdAt).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Navigasi</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href={`/kolam?farm=${farm.id}`}
              className="p-4 border border-slate-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition"
            >
              <h3 className="font-semibold text-slate-900">Kolam</h3>
              <p className="text-sm text-slate-600">Kelola kolam/tambak</p>
            </Link>
            <Link
              href={`/pakan?farm=${farm.id}`}
              className="p-4 border border-slate-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition"
            >
              <h3 className="font-semibold text-slate-900">Pakan</h3>
              <p className="text-sm text-slate-600">Pantau pemberian pakan</p>
            </Link>
            <Link
              href={`/kualitas-air?farm=${farm.id}`}
              className="p-4 border border-slate-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition"
            >
              <h3 className="font-semibold text-slate-900">Kualitas Air</h3>
              <p className="text-sm text-slate-600">Monitor kondisi air</p>
            </Link>
            <Link
              href={`/keuangan?farm=${farm.id}`}
              className="p-4 border border-slate-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition"
            >
              <h3 className="font-semibold text-slate-900">Keuangan</h3>
              <p className="text-sm text-slate-600">Laporan keuangan</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
