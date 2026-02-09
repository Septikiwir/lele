'use client';

import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';

interface SortirModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultKolamId?: string;
    defaultPeriode?: number;
}

export default function SortirModal({ isOpen, onClose, defaultKolamId, defaultPeriode }: SortirModalProps) {
    const { kolam, addRiwayatSortir } = useApp();
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter kolam yang ada ikannya
    const activeKolam = kolam.filter(k => k.jumlahIkan > 0);

    // Check if kolam should be fixed (from defaultKolamId)
    const isKolamFixed = !!defaultKolamId;

    const [sortirForm, setSortirForm] = useState({
        kolamId: defaultKolamId || '',
        tanggal: new Date().toLocaleDateString('en-CA'),
        periode: defaultPeriode || 1,
        jumlahIkanSebelum: '',
        jumlahIkanSesudah: '',
        bobotRataRata: '',
        catatan: ''
    });

    // Sync form when modal opens
    useEffect(() => {
        if (isOpen) {
            // Get current fish count from selected kolam
            const selectedKolam = kolam.find(k => k.id === (defaultKolamId || sortirForm.kolamId));
            setSortirForm(prev => ({
                ...prev,
                kolamId: defaultKolamId || prev.kolamId,
                periode: defaultPeriode || prev.periode,
                jumlahIkanSebelum: selectedKolam ? String(selectedKolam.jumlahIkan) : prev.jumlahIkanSebelum
            }));
        }
    }, [isOpen, defaultKolamId, defaultPeriode, kolam]);

    // Update jumlahIkanSebelum when kolam changes
    useEffect(() => {
        if (sortirForm.kolamId) {
            const selectedKolam = kolam.find(k => k.id === sortirForm.kolamId);
            if (selectedKolam) {
                setSortirForm(prev => ({
                    ...prev,
                    jumlahIkanSebelum: String(selectedKolam.jumlahIkan)
                }));
            }
        }
    }, [sortirForm.kolamId, kolam]);

    const calculateMortalitas = () => {
        const sebelum = Number(sortirForm.jumlahIkanSebelum) || 0;
        const sesudah = Number(sortirForm.jumlahIkanSesudah) || 0;
        return Math.max(0, sebelum - sesudah);
    };

    const mortalitas = calculateMortalitas();
    const mortalitasPercent = sortirForm.jumlahIkanSebelum 
        ? ((mortalitas / Number(sortirForm.jumlahIkanSebelum)) * 100).toFixed(1)
        : '0';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Validasi
        const sebelum = Number(sortirForm.jumlahIkanSebelum);
        const sesudah = Number(sortirForm.jumlahIkanSesudah);

        if (sebelum <= 0 || sesudah < 0) {
            showToast('Jumlah ikan harus valid', 'error');
            return;
        }

        if (sesudah > sebelum) {
            showToast('Jumlah ikan sesudah tidak boleh lebih banyak dari sebelum', 'error');
            return;
        }

        // Combine selected date with CURRENT time
        const now = new Date();
        const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS
        const combinedDate = new Date(`${sortirForm.tanggal}T${currentTime}`);
        const isoString = combinedDate.toISOString();

        setIsSubmitting(true);
        try {
            await addRiwayatSortir({
                kolamId: sortirForm.kolamId,
                tanggal: isoString,
                periode: sortirForm.periode,
                jumlahIkanSebelum: sebelum,
                jumlahIkanSesudah: sesudah,
                mortalitas,
                bobotRataRata: sortirForm.bobotRataRata ? Number(sortirForm.bobotRataRata) : undefined,
                catatan: sortirForm.catatan
            });

            onClose();
            setSortirForm({
                kolamId: defaultKolamId || '',
                tanggal: new Date().toLocaleDateString('en-CA'),
                periode: 1,
                jumlahIkanSebelum: '',
                jumlahIkanSesudah: '',
                bobotRataRata: '',
                catatan: ''
            });
        } catch (error: any) {
            console.error('Error submitting sortir:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPeriodeLabel = (p: number) => {
        const labels: Record<number, string> = {
            1: 'Periode 1 (Minggu 2 / 15-25g)',
            2: 'Periode 2 (Minggu 4 / 40-55g)',
            3: 'Periode 3 (Minggu 6 / 70-90g)',
            4: 'Periode 4 (Minggu 8 / 100-125g)'
        };
        return labels[p] || `Periode ${p}`;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Catat Sortir Ikan"
            footer={
                <>
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="btn btn-secondary" 
                        disabled={isSubmitting}
                    >
                        Batal
                    </button>
                    <button 
                        type="submit" 
                        form="form-sortir" 
                        className="btn bg-blue-600 text-white hover:bg-blue-700 border-transparent disabled:opacity-50 disabled:cursor-not-allowed" 
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Menyimpan...
                            </span>
                        ) : 'Simpan Sortir'}
                    </button>
                </>
            }
        >
            <form id="form-sortir" onSubmit={handleSubmit} className="space-y-4">
                {!isKolamFixed && (
                    <div className="form-group">
                        <label className="form-label">Kolam</label>
                        <select
                            value={sortirForm.kolamId}
                            onChange={(e) => setSortirForm({ ...sortirForm, kolamId: e.target.value })}
                            className="input w-full"
                            required
                        >
                            <option value="">-- Pilih Kolam --</option>
                            {activeKolam.map(k => (
                                <option key={k.id} value={k.id}>
                                    {k.nama} ({k.jumlahIkan.toLocaleString()} ekor)
                                </option>
                            ))}
                        </select>
                        {activeKolam.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">Tidak ada kolam dengan ikan aktif</p>
                        )}
                    </div>
                )}

                {isKolamFixed && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                            <span className="font-semibold">Kolam:</span>{' '}
                            {kolam.find(k => k.id === defaultKolamId)?.nama}
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                        <label className="form-label">Tanggal</label>
                        <input 
                            type="date" 
                            className="input w-full" 
                            required
                            value={sortirForm.tanggal} 
                            onChange={e => setSortirForm({ ...sortirForm, tanggal: e.target.value })} 
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Periode</label>
                        <select
                            value={sortirForm.periode}
                            onChange={(e) => setSortirForm({ ...sortirForm, periode: Number(e.target.value) })}
                            className="input w-full"
                            required
                            disabled={!!defaultPeriode}
                        >
                            {[1, 2, 3, 4].map(p => (
                                <option key={p} value={p}>{getPeriodeLabel(p)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                        <label className="form-label">Jumlah Ikan Sebelum</label>
                        <input 
                            type="number" 
                            className="input w-full bg-slate-50" 
                            required
                            value={sortirForm.jumlahIkanSebelum}
                            readOnly
                        />
                        <p className="text-xs text-slate-500 mt-1">Otomatis dari populasi kolam</p>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Jumlah Ikan Sesudah</label>
                        <input 
                            type="number" 
                            className="input w-full" 
                            required
                            min="0"
                            value={sortirForm.jumlahIkanSesudah}
                            onChange={e => setSortirForm({ ...sortirForm, jumlahIkanSesudah: e.target.value })} 
                        />
                    </div>
                </div>

                {/* Mortalitas Display */}
                {sortirForm.jumlahIkanSesudah && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-amber-900">Mortalitas:</span>
                            <span className="text-lg font-bold text-amber-900">
                                {mortalitas.toLocaleString()} ekor ({mortalitasPercent}%)
                            </span>
                        </div>
                    </div>
                )}

                <div className="form-group">
                    <label className="form-label">Bobot Rata-rata (gram)</label>
                    <input 
                        type="number" 
                        className="input w-full" 
                        placeholder="Opsional - bobot per ekor"
                        step="0.1"
                        min="0"
                        value={sortirForm.bobotRataRata}
                        onChange={e => setSortirForm({ ...sortirForm, bobotRataRata: e.target.value })} 
                    />
                    <p className="text-xs text-slate-500 mt-1">Bobot rata-rata per ekor saat sortir</p>
                </div>

                <div className="form-group">
                    <label className="form-label">Catatan</label>
                    <textarea 
                        className="input w-full" 
                        rows={3}
                        placeholder="Catatan tambahan tentang sortir..."
                        value={sortirForm.catatan}
                        onChange={e => setSortirForm({ ...sortirForm, catatan: e.target.value })} 
                    />
                </div>
            </form>
        </Modal>
    );
}
