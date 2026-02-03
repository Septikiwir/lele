'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Plus, Trash2, AlertCircle } from 'lucide-react';

interface FarmMember {
  id: string;
  userId: string;
  farmId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Farm {
  nama: string;
}

export default function FarmOwnerManagementPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.farmId as string;
  const { data: session, status } = useSession();

  const [farm, setFarm] = useState<Farm | null>(null);
  const [members, setMembers] = useState<FarmMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        await Promise.all([loadFarmInfo(), loadMembers()]);
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

  const loadFarmInfo = async () => {
    try {
      const res = await fetch(`/api/admin/farms/${farmId}`);
      if (!res.ok) throw new Error('Farm not found');
      const farmData = await res.json();
      setFarm(farmData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading farm');
    }
  };

  const loadMembers = async () => {
    try {
      const res = await fetch(`/api/admin/farms/${farmId}/members`);
      if (res.ok) {
        const membersData = await res.json();
        setMembers(membersData);
      }
    } catch (err) {
      console.error('Error loading members:', err);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const usersData = await res.json();
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const handleAddMember = async () => {
    if (!newUserName.trim()) {
      setError('Nama operator harus diisi');
      return;
    }
    if (!newUserEmail.trim()) {
      setError('Email operator harus diisi');
      return;
    }
    if (!newUserPassword.trim()) {
      setError('Password operator harus diisi');
      return;
    }

    try {
      // Create new user first
      const createUserRes = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: 'OPERATOR',
        }),
      });

      if (!createUserRes.ok) {
        const errorData = await createUserRes.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      const newUser = await createUserRes.json();

      // Add user as member to farm
      const addMemberRes = await fetch(`/api/admin/farms/${farmId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newUser.id,
          role: 'OPERATOR',
        }),
      });

      if (!addMemberRes.ok) {
        const errorData = await addMemberRes.json();
        throw new Error(errorData.message || 'Failed to add member');
      }

      await loadMembers();
      setShowAddMember(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding member');
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
      const res = await fetch(`/api/admin/farms/${farmId}/members/${memberToDelete}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to remove member');
      }

      await loadMembers();
      setMemberToDelete(null);
      setShowDeleteConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error removing member');
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
            Kembali ke Daftar Farm
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Kelola Anggota Peternakan</h1>
          <p className="text-slate-600 mt-2">{farm?.nama}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              ✕
            </button>
          </div>
        )}

        <div className="grid gap-6">
          {/* Current Members */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Anggota Saat Ini</h2>
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
              >
                <Plus size={18} />
                Tambah Anggota
              </button>
            </div>

            {members.length === 0 ? (
              <p className="text-slate-600 py-4">Belum ada anggota</p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{member.user.name}</p>
                      <p className="text-sm text-slate-600">{member.user.email}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {member.role}
                      </div>

                      {member.role !== 'OWNER' && (
                        <button
                          onClick={() => {
                            setMemberToDelete(member.id);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                          title="Hapus anggota"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Member Form */}
          {showAddMember && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Tambah Anggota Baru</h3>

              <div className="space-y-4">
                {/* User Name Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nama Operator
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan nama operator..."
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Masukkan email operator..."
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Masukkan password operator..."
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleAddMember}
                    className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium"
                  >
                    Tambah Anggota
                  </button>
                  <button
                    onClick={() => {
                      setShowAddMember(false);
                      setNewUserName('');
                      setNewUserEmail('');
                      setNewUserPassword('');
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Hapus Anggota?</h3>
            <p className="text-slate-600 mb-6">
              Anggota akan dihapus dari peternakan ini dan kehilangan akses.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteMember}
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
