'use client';

import DashboardLayout from '../components/layout/DashboardLayout';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import { useState } from 'react';

import { PlusIcon, EditIcon, TrashIcon, EyeIcon } from '../components/ui/Icons';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';

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
    const { kolam, deleteKolam, calculateKepadatan, getUnifiedStatus } = useApp();
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
                <EmptyState
                    title="Belum Ada Kolam"
                    description="Mulai dengan menambahkan kolam pertama Anda"
                    icon="🐟"
                    action={{ label: "Tambah Kolam Baru", href: "/kolam/tambah" }}
                />
            ) : (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-6">
                    {kolam.map(k => {
                        const unifiedStatus = getUnifiedStatus(k.id);
                        const displayStatus = unifiedStatus.status;

                        const volume = k.panjang * k.lebar * k.kedalaman;
                        const luas = k.panjang * k.lebar;
                        const colors = statusColors[displayStatus];

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
                                                {statusLabels[displayStatus]}
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
                                        <span className={`text-sm font-medium ${colors.text}`}>
                                            Kepadatan {unifiedStatus.source === 'berat' ? '(Biomassa)' : '(Populasi)'}
                                        </span>
                                        <span className={`text-lg font-bold ${colors.text}`}>
                                            {unifiedStatus.source === 'berat'
                                                ? `${unifiedStatus.kepadatanBerat.toFixed(2)} kg/m³`
                                                : `${unifiedStatus.kepadatanEkor.toFixed(1)} ekor/m³`}
                                        </span>
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
            {/* Delete Modal */}
            <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)}>
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
                            onClick={() => handleDelete(deleteModal!)}
                            className="flex-1 btn btn-danger"
                        >
                            Ya, Hapus
                        </button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
