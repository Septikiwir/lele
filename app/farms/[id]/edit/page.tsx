'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Loader } from 'lucide-react';
import Link from 'next/link';

interface FarmFormData {
  nama: string;
  alamat: string;
}

export default function EditFarmPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const farmId = params.id as string;

  const [formData, setFormData] = useState<FarmFormData>({
    nama: '',
    alamat: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setFormData({
          nama: data.nama,
          alamat: data.alamat || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading farm');
      } finally {
        setLoading(false);
      }
    };

    fetchFarm();
  }, [farmId, status]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.nama.trim()) {
      setError('Nama peternakan harus diisi');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/farms/${farmId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update farm');
      }

      router.push('/farms');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating farm');
    } finally {
      setSubmitting(false);
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/farms"
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-4"
          >
            <ArrowLeft size={20} />
            Kembali
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Edit Peternakan</h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-8">
          <div className="space-y-6">
            {/* Nama */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Nama Peternakan *
              </label>
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                placeholder="Contoh: Tambak Lele Jaya"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            {/* Alamat */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Alamat
              </label>
              <textarea
                name="alamat"
                value={formData.alamat}
                onChange={handleChange}
                placeholder="Jl. Merdeka No. 1, Jakarta"
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <Loader size={16} className="animate-spin" />}
                Simpan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
