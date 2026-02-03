'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Plus, Trash2, AlertCircle, Search } from 'lucide-react';

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

interface User {
  id: string;
  name: string;
  email: string;
}

interface Farm {
  nama: string;
}

export default function FarmOwnerManagementPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.id as string;
  const { data: session, status } = useSession();

  const [farm, setFarm] = useState<Farm | null>(null);
  const [members, setMembers] = useState<FarmMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('OPERATOR');
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
        await Promise.all([loadFarmInfo(), loadMembers(), loadAvailableUsers()]);
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
        setAvailableUsers(usersData);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) {
      setError('Pilih pengguna');
      return;
    }

    try {
      const res = await fetch(`/api/admin/farms/${farmId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          role: selectedRole,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add member');
      }

      await loadMembers();
      setShowAddMember(false);
      setSelectedUserId('');
      setSelectedRole('OPERATOR');
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

      if (!res.ok) throw new Error('Failed to remove member');

      await loadMembers();
      setMemberToDelete(null);
      setShowDeleteConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error removing member');
    }
  };

  const filteredUsers = availableUsers.filter(user =>
    !members.some(m => m.userId === user.id) &&
    (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
            href={`/admin/farms/${farmId}`}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-4"
          >
            <ArrowLeft size={20} />
            Kembali ke Detail
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
                {/* Search Users */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cari Pengguna
                  </label>
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Cari berdasarkan nama atau email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* User List */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Pilih Pengguna
                  </label>
                  {filteredUsers.length === 0 ? (
                    <p className="text-slate-600 text-sm py-4">
                      {availableUsers.length === 0
                        ? 'Tidak ada pengguna tersedia'
                        : 'Tidak ada hasil pencarian'}
                    </p>
                  ) : (
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">-- Pilih pengguna --</option>
                      {filteredUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Peran
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="OPERATOR">Operator</option>
                    <option value="OWNER">Pemilik</option>
                  </select>
                  <p className="text-xs text-slate-600 mt-2">
                    Operator memiliki akses terbatas. Pemilik memiliki kontrol penuh.
                  </p>
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
                      setSearchTerm('');
                      setSelectedUserId('');
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
