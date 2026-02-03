'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { ArrowLeft, Loader } from 'lucide-react';
import Link from 'next/link';

export default function CreateFarmAdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [step, setStep] = useState<'create-owner' | 'create-farm'>('create-owner');
  const [ownerForm, setOwnerForm] = useState({
    email: '',
    name: '',
    password: '',
  });
  const [farmForm, setFarmForm] = useState({
    nama: '',
    alamat: '',
    ownerEmail: '',
  });
  const [createdOwner, setCreatedOwner] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleCreateOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!ownerForm.email || !ownerForm.name || !ownerForm.password) {
      setError('Semua field harus diisi');
      return;
    }

    if (ownerForm.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ownerForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create owner');
      }

      const owner = await res.json();
      setCreatedOwner(owner);
      setFarmForm(prev => ({
        ...prev,
        ownerEmail: owner.email
      }));
      setStep('create-farm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating owner');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!farmForm.nama.trim()) {
      setError('Nama peternakan harus diisi');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/farms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(farmForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create farm');
      }

      router.push('/farms');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating farm');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
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
          <h1 className="text-3xl font-bold text-slate-900">Buat Peternakan Baru</h1>
          <p className="text-slate-600 mt-2">
            {step === 'create-owner' 
              ? 'Langkah 1: Buat akun pemilik (Owner)' 
              : 'Langkah 2: Buat peternakan'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: Create Owner */}
        {step === 'create-owner' && (
          <form onSubmit={handleCreateOwner} className="bg-white rounded-lg border border-slate-200 p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Data Pemilik Peternakan</h2>
            
            <div className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={ownerForm.email}
                  onChange={(e) => setOwnerForm(prev => ({...prev, email: e.target.value}))}
                  placeholder="owner@example.com"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              {/* Nama */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={ownerForm.name}
                  onChange={(e) => setOwnerForm(prev => ({...prev, name: e.target.value}))}
                  placeholder="Budi Santoso"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={ownerForm.password}
                  onChange={(e) => setOwnerForm(prev => ({...prev, password: e.target.value}))}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
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
                  Lanjut
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Step 2: Create Farm */}
        {step === 'create-farm' && createdOwner && (
          <form onSubmit={handleCreateFarm} className="bg-white rounded-lg border border-slate-200 p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Data Peternakan</h2>
            
            {/* Created Owner Info */}
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-teal-700">
                <strong>✓ Akun pemilik berhasil dibuat:</strong> {createdOwner.name} ({createdOwner.email})
              </p>
            </div>

            <div className="space-y-6">
              {/* Nama */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Nama Peternakan *
                </label>
                <input
                  type="text"
                  value={farmForm.nama}
                  onChange={(e) => setFarmForm(prev => ({...prev, nama: e.target.value}))}
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
                  value={farmForm.alamat}
                  onChange={(e) => setFarmForm(prev => ({...prev, alamat: e.target.value}))}
                  placeholder="Jl. Merdeka No. 1, Jakarta"
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Owner Email (read-only) */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Pemilik
                </label>
                <input
                  type="email"
                  value={farmForm.ownerEmail}
                  disabled
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep('create-owner');
                    setCreatedOwner(null);
                  }}
                  className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader size={16} className="animate-spin" />}
                  Buat Peternakan
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
