'use client';

import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { Loader2, X } from 'lucide-react';
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

    interface Distribution {
        kolamId: string;
        jumlah: string;
    }

    const [sortirForm, setSortirForm] = useState({
        kolamId: defaultKolamId || '',
        tanggal: new Date().toLocaleDateString('en-CA'),
        periode: defaultPeriode || 1,
        jumlahIkanSebelum: '',
        jumlahKematian: '', // Explicit mortality input
        bobotRataRata: '',
        catatan: '',
        withDistribution: false, // Distribute to multiple ponds
    });

    const [distributions, setDistributions] = useState<Distribution[]>([]);

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

    const calculateSurvivors = () => {
        const sebelum = Number(sortirForm.jumlahIkanSebelum) || 0;
        const kematian = Number(sortirForm.jumlahKematian) || 0;
        return Math.max(0, sebelum - kematian);
    };

    const calculateTotalDistributed = () => {
        return distributions.reduce((sum, d) => sum + (Number(d.jumlah) || 0), 0);
    };

    const survivors = calculateSurvivors();
    const totalDistributed = calculateTotalDistributed();
    const mortalitas = Number(sortirForm.jumlahKematian) || 0;
    const mortalitasPercent = sortirForm.jumlahIkanSebelum 
        ? ((mortalitas / Number(sortirForm.jumlahIkanSebelum)) * 100).toFixed(1)
        : '0';
    const remainingInSource = survivors - totalDistributed;
    const isDistributionValid = !sortirForm.withDistribution || (totalDistributed >= 0 && totalDistributed <= survivors);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Validasi
        const sebelum = Number(sortirForm.jumlahIkanSebelum);
        const kematian = Number(sortirForm.jumlahKematian);

        if (sebelum <= 0) {
            showToast('Jumlah ikan sebelum harus valid', 'error');
            return;
        }

        if (kematian < 0 || kematian > sebelum) {
            showToast('Jumlah kematian tidak valid', 'error');
            return;
        }

        // Validate distribution if enabled
        if (sortirForm.withDistribution) {
            if (distributions.length === 0) {
                showToast('Tambahkan minimal 1 kolam tujuan', 'error');
                return;
            }

            const hasInvalidAmount = distributions.some(d => !d.kolamId || Number(d.jumlah) <= 0);
            if (hasInvalidAmount) {
                showToast('Semua distribusi harus memiliki kolam dan jumlah valid', 'error');
                return;
            }

            if (totalDistributed > survivors) {
                showToast(`Total distribusi (${totalDistributed}) tidak boleh melebihi survivors (${survivors})`, 'error');
                return;
            }
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
                jumlahIkanSesudah: survivors,
                mortalitas: kematian,
                bobotRataRata: sortirForm.bobotRataRata ? Number(sortirForm.bobotRataRata) : undefined,
                catatan: sortirForm.catatan,
                distributions: sortirForm.withDistribution 
                    ? distributions.map(d => ({ kolamId: d.kolamId, jumlah: Number(d.jumlah) }))
                    : undefined
            });

            onClose();
            setSortirForm({
                kolamId: defaultKolamId || '',
                tanggal: new Date().toLocaleDateString('en-CA'),
                periode: 1,
                jumlahIkanSebelum: '',
                jumlahKematian: '',
                bobotRataRata: '',
                catatan: '',
                withDistribution: false,
            });
            setDistributions([]);
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
                        <label className="form-label">Jumlah Ikan yang Mati</label>
                        <input 
                            type="number" 
                            className="input w-full" 
                            required
                            min="0"
                            max={sortirForm.jumlahIkanSebelum}
                            value={sortirForm.jumlahKematian}
                            onChange={e => setSortirForm({ ...sortirForm, jumlahKematian: e.target.value })} 
                            placeholder="Jumlah ikan yang mati saat sortir"
                        />
                        <p className="text-xs text-slate-500 mt-1">Input jumlah kematian eksplisit</p>
                    </div>
                </div>

                {/* Survivors Display */}
                {sortirForm.jumlahKematian && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex flex-col">
                                <span className="text-xs font-medium text-amber-700">Mortalitas</span>
                                <span className="text-xl font-bold text-amber-900">
                                    {mortalitas.toLocaleString()} ekor
                                </span>
                                <span className="text-xs text-amber-600">({mortalitasPercent}%)</span>
                            </div>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                            <div className="flex flex-col">
                                <span className="text-xs font-medium text-emerald-700">Survivors</span>
                                <span className="text-xl font-bold text-emerald-900">
                                    {survivors.toLocaleString()} ekor
                                </span>
                                <span className="text-xs text-emerald-600">
                                    ({((survivors / Number(sortirForm.jumlahIkanSebelum)) * 100).toFixed(1)}%)
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Distribution Option */}
                {survivors > 0 && (
                    <div className="border-t border-slate-200 pt-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={sortirForm.withDistribution}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setSortirForm({ 
                                        ...sortirForm, 
                                        withDistribution: checked
                                    });
                                    if (!checked) {
                                        setDistributions([]);
                                    } else if (distributions.length === 0) {
                                        setDistributions([{ kolamId: '', jumlah: '' }]);
                                    }
                                }}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-slate-700">
                                Distribusikan survivors ke beberapa kolam
                            </span>
                        </label>
                        <p className="text-xs text-slate-500 mt-1 ml-6">
                            Distribusikan ikan ke beberapa kolam. Sisa ikan akan tetap di kolam ini.
                        </p>
                    </div>
                )}

                {/* Multi-Pond Distribution */}
                {sortirForm.withDistribution && survivors > 0 && (
                    <div className="space-y-3 animate-in fade-in duration-300 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className="form-label mb-0">Distribusi Ikan</label>
                            <button
                                type="button"
                                onClick={() => setDistributions([...distributions, { kolamId: '', jumlah: '' }])}
                                className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                + Tambah Kolam
                            </button>
                        </div>

                        {distributions.map((dist, idx) => (
                            <div key={idx} className="flex gap-2 items-start">
                                <div className="flex-1">
                                    <select
                                        value={dist.kolamId}
                                        onChange={(e) => {
                                            const newDists = [...distributions];
                                            newDists[idx].kolamId = e.target.value;
                                            setDistributions(newDists);
                                        }}
                                        className="input w-full text-sm"
                                        required
                                    >
                                        <option value="">-- Pilih Kolam --</option>
                                        {kolam
                                            .filter(k => k.id !== sortirForm.kolamId)
                                            .map(k => (
                                                <option key={k.id} value={k.id}>
                                                    {k.nama} ({k.jumlahIkan.toLocaleString()} ekor)
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>
                                <div className="w-32">
                                    <input
                                        type="number"
                                        value={dist.jumlah}
                                        onChange={(e) => {
                                            const newDists = [...distributions];
                                            newDists[idx].jumlah = e.target.value;
                                            setDistributions(newDists);
                                        }}
                                        className="input w-full text-sm"
                                        placeholder="Jumlah"
                                        min="1"
                                        required
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDistributions(distributions.filter((_, i) => i !== idx))}
                                    className="px-2 py-2 text-red-600 hover:bg-red-50 rounded"
                                    disabled={distributions.length === 1}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        {/* Distribution Summary */}
                        <div className="mt-3 pt-3 border-t border-blue-200">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-blue-700">Total Survivors:</span>
                                <span className="font-bold text-blue-900">{survivors.toLocaleString()} ekor</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-blue-700">Didistribusi:</span>
                                <span className={`font-bold ${
                                    totalDistributed <= survivors ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {totalDistributed.toLocaleString()} ekor
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-blue-700">Tetap di Kolam Ini:</span>
                                <span className={`font-bold ${
                                    remainingInSource >= 0 ? 'text-emerald-600' : 'text-red-600'
                                }`}>
                                    {remainingInSource.toLocaleString()} ekor
                                </span>
                            </div>
                            {!isDistributionValid && (
                                <p className="text-xs text-red-600 mt-2">
                                    ⚠️ Total distribusi tidak boleh melebihi jumlah survivors
                                </p>
                            )}
                            {remainingInSource > 0 && (
                                <p className="text-xs text-slate-600 mt-2">
                                    ℹ️ {remainingInSource.toLocaleString()} ekor akan tetap di kolam sumber
                                </p>
                            )}
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
