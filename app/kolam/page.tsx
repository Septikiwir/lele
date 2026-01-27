'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import { useState } from 'react';

const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const EyeIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const statusColors = {
    aman: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    waspada: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    berisiko: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
};

const statusLabels = {
    aman: 'Aman',
    waspada: 'Waspada',
    berisiko: 'Berisiko',
};

export default function KolamPage() {
    const { kolam, deleteKolam, calculateKepadatan } = useApp();
    const [deleteModal, setDeleteModal] = useState<string | null>(null);

    const handleDelete = (id: string) => {
        deleteKolam(id);
        setDeleteModal(null);
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Manajemen Kolam</h1>
                    <p className="text-slate-500 mt-1">Kelola semua kolam peternakan Anda</p>
                </div>
                <Link href="/kolam/tambah" className="btn btn-primary">
                    <PlusIcon />
                    Tambah Kolam
                </Link>
            </div>

            {/* Kolam Grid */}
            {kolam.length === 0 ? (
                <div className="text-center py-16 card">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center text-4xl">
                        🐟
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Belum Ada Kolam</h3>
                    <p className="text-slate-500 mb-6">Mulai dengan menambahkan kolam pertama Anda</p>
                    <Link href="/kolam/tambah" className="btn btn-primary">
                        <PlusIcon />
                        Tambah Kolam Baru
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {kolam.map(k => {
                        const kepadatan = calculateKepadatan(k);
                        const volume = k.panjang * k.lebar * k.kedalaman;
                        const luas = k.panjang * k.lebar;
                        const colors = statusColors[k.status];

                        return (
                            <div key={k.id} className={`card p-6 border-l-4 ${colors.border}`}>
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center text-2xl`}>
                                            🐟
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900">{k.nama}</h3>
                                            <span className={`badge ${colors.bg} ${colors.text}`}>
                                                {statusLabels[k.status]}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <p className="text-xs text-slate-500 uppercase tracking-wide">Dimensi</p>
                                        <p className="font-semibold text-slate-900">{k.panjang}m × {k.lebar}m × {k.kedalaman}m</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <p className="text-xs text-slate-500 uppercase tracking-wide">Luas</p>
                                        <p className="font-semibold text-slate-900">{luas} m²</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <p className="text-xs text-slate-500 uppercase tracking-wide">Volume</p>
                                        <p className="font-semibold text-slate-900">{volume.toFixed(1)} m³</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <p className="text-xs text-slate-500 uppercase tracking-wide">Jumlah Ikan</p>
                                        <p className="font-semibold text-slate-900">{k.jumlahIkan.toLocaleString('id-ID')}</p>
                                    </div>
                                </div>

                                {/* Kepadatan */}
                                <div className={`${colors.bg} rounded-lg p-3 mb-4`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium ${colors.text}">Kepadatan</span>
                                        <span className={`text-lg font-bold ${colors.text}`}>{kepadatan.toFixed(1)} ekor/m³</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Link
                                        href={`/kolam/${k.id}`}
                                        className="flex-1 btn btn-secondary text-sm"
                                    >
                                        <EyeIcon /> Detail
                                    </Link>
                                    <Link
                                        href={`/kolam/${k.id}/edit`}
                                        className="btn btn-ghost text-sm"
                                    >
                                        <EditIcon />
                                    </Link>
                                    <button
                                        onClick={() => setDeleteModal(k.id)}
                                        className="btn btn-ghost text-red-600 hover:bg-red-50 text-sm"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Delete Modal */}
            {deleteModal && (
                <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center text-3xl">
                                ⚠️
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Hapus Kolam?</h3>
                            <p className="text-slate-500 mb-6">
                                Semua data terkait kolam ini (pakan, kondisi air) akan ikut terhapus. Aksi ini tidak dapat dibatalkan.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteModal(null)}
                                    className="flex-1 btn btn-secondary"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteModal)}
                                    className="flex-1 btn btn-danger"
                                >
                                    Ya, Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
