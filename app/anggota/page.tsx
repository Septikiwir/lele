'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useApp } from '../context/AppContext';
import { useSession } from 'next-auth/react';
import { Users, Plus, Trash2, Shield, User, Mail, Loader2, AlertCircle } from 'lucide-react';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';

interface FarmMember {
    id: string;
    userId: string;
    role: 'OWNER' | 'ADMIN' | 'OPERATOR' | 'VIEWER';
    user: {
        name: string;
        email: string;
    };
}

export default function AnggotaPage() {
    const { activeFarmId } = useApp();
    const { data: session } = useSession();
    const { showToast } = useToast();

    const [members, setMembers] = useState<FarmMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState<{ name: string; email: string; password: string; role: 'OPERATOR' }>({
        name: '',
        email: '',
        password: '',
        role: 'OPERATOR'
    });

    useEffect(() => {
        if (activeFarmId) {
            fetchMembers();
        }
    }, [activeFarmId]);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/farms/${activeFarmId}/members`);
            if (res.ok) {
                const data = await res.json();
                setMembers(data);
            }
        } catch (error) {
            console.error('Failed to fetch members:', error);
            showToast('Gagal memuat data anggota', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeFarmId) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/farms/${activeFarmId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to add member');
            }

            setMembers([...members, data]);
            setShowAddModal(false);
            setFormData({ name: '', email: '', password: '', role: 'OPERATOR' });
            showToast('Akun operator berhasil dibuat & ditambahkan', 'success');
        } catch (error) {
            console.error('Error adding member:', error);
            showToast(error instanceof Error ? error.message : 'Gagal menambahkan anggota', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteMember = async (memberId: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus anggota ini? Akses mereka akan dicabut.')) return;
        if (!activeFarmId) return;

        try {
            const res = await fetch(`/api/farms/${activeFarmId}/members/${memberId}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                throw new Error('Failed to delete member');
            }

            setMembers(members.filter(m => m.id !== memberId));
            showToast('Anggota berhasil dihapus', 'success');
        } catch (error) {
            console.error('Error deleting member:', error);
            showToast('Gagal menghapus anggota', 'error');
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Anggota</h1>
                        <p className="text-slate-500 text-sm">Kelola akses operator dan staf untuk tambak ini.</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Tambah Operator
                    </button>
                </div>

                {/* Info Card */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Informasi Akses</p>
                        <p>Operator hanya dapat mengakses menu operasional (Kolam, Pakan, Kualitas Air) dan tidak dapat melihat data keuangan atau profitabilitas tambak.</p>
                    </div>
                </div>

                {/* Members Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                    </div>
                ) : members.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Users className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-slate-900 font-medium mb-1">Belum ada anggota</h3>
                        <p className="text-slate-500 text-sm mb-4">Buat akun operator baru untuk membantu mengelola tambak.</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="text-teal-600 font-medium text-sm hover:underline"
                        >
                            + Tambah Operator Sekarang
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {members.map((member) => (
                            <div key={member.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow relative group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                                    ${member.role === 'OWNER' ? 'bg-purple-600' :
                                                member.role === 'ADMIN' ? 'bg-blue-600' : 'bg-teal-600'}`}>
                                            {member.user.name ? member.user.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{member.user.name || 'User Tanpa Nama'}</h3>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                                        ${member.role === 'OWNER' ? 'bg-purple-100 text-purple-700' :
                                                    member.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
                                                {member.role}
                                            </span>
                                        </div>
                                    </div>

                                    {member.role !== 'OWNER' && (
                                        <button
                                            onClick={() => handleDeleteMember(member.id)}
                                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                            title="Hapus Anggota"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                        <span className="truncate">{member.user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Shield className="w-4 h-4 text-slate-400" />
                                        <span>Akses: {member.role === 'OPERATOR' ? 'Terbatas (Ops)' : 'Penuh'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Member Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Buat Akun Operator Baru"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setShowAddModal(false)}
                            className="btn btn-secondary"
                            disabled={isSubmitting}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            form="add-member-form"
                            className="btn btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {isSubmitting ? 'Membuat Akun...' : 'Buat Akun Operator'}
                        </button>
                    </>
                }
            >
                <form id="add-member-form" onSubmit={handleAddMember} className="space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 mb-4">
                        Anda sedang membuat akun baru untuk operator. Pastikan email belum terdaftar di sistem.
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Contoh: Budi Santoso"
                                className="pl-9 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="op1@example.com"
                                className="pl-9 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Password</label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Minimal 6 karakter"
                                minLength={6}
                                className="pl-9 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Peran / Role</label>
                        <div className="p-3 rounded-xl border border-teal-500 bg-teal-50 ring-1 ring-teal-500 text-left transition-all relative">
                            <span className="font-semibold text-slate-900 block mb-1">Operator</span>
                            <span className="text-xs text-slate-500 block">Akses operasional kolam & pakan.</span>
                        </div>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
