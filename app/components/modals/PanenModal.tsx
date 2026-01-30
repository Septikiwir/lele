'use client';

import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { PlusIcon, LoadingSpinner } from '../ui/Icons';
import { useApp, TipePembeli, Kolam } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils';

interface PanenModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultKolamId?: string;
}

export default function PanenModal({ isOpen, onClose, defaultKolamId }: PanenModalProps) {
    const { kolam, pembeli, addRiwayatPanen, addPenjualan, addPembeli, getLatestSampling } = useApp();
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter kolam yang ada ikannya
    const activeKolam = kolam.filter(k => k.jumlahIkan > 0);

    // Check if kolam should be fixed (from defaultKolamId)
    const isKolamFixed = !!defaultKolamId;

    const [panenForm, setPanenForm] = useState({
        kolamId: defaultKolamId || '',
        pembeliId: '',
        tanggal: new Date().toISOString().split('T')[0],
        beratTotalKg: '',
        jumlahEkor: '',
        hargaPerKg: '25000',
        tipe: 'PARSIAL' as 'PARSIAL' | 'TOTAL',
        catatan: ''
    });

    // Sync kolamId when defaultKolamId changes and modal opens
    useEffect(() => {
        if (isOpen && defaultKolamId) {
            setPanenForm(prev => ({
                ...prev,
                kolamId: defaultKolamId
            }));
        }
    }, [isOpen, defaultKolamId]);

    const [isBuyerModalOpen, setIsBuyerModalOpen] = useState(false);
    const [buyerForm, setBuyerForm] = useState({
        nama: '',
        tipe: 'TENGKULAK' as TipePembeli,
        kontak: '',
        alamat: ''
    });

    const handlePanenSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!panenForm.pembeliId) {
            showToast('Harap pilih Pembeli untuk mencatat panen.', 'error');
            return;
        }

        // Validasi jumlah ekor tidak melebihi populasi kolam
        const selectedKolam = kolam.find(k => k.id === panenForm.kolamId);
        if (selectedKolam && panenForm.jumlahEkor) {
            const jumlahPanen = Number(panenForm.jumlahEkor);
            if (jumlahPanen > selectedKolam.jumlahIkan) {
                showToast(`Gagal: Jumlah panen (${jumlahPanen} ekor) melebihi populasi kolam (${selectedKolam.jumlahIkan.toLocaleString()} ekor).`, 'error');
                return;
            }
        }

        setIsSubmitting(true);
        try {
            await addRiwayatPanen({
                kolamId: panenForm.kolamId,
                tanggal: panenForm.tanggal,
                beratTotalKg: Number(panenForm.beratTotalKg),
                jumlahEkor: Number(panenForm.jumlahEkor),
                hargaPerKg: Number(panenForm.hargaPerKg),
                tipe: panenForm.tipe,
                catatan: panenForm.catatan
            });

            if (panenForm.pembeliId) {
                await addPenjualan({
                    kolamId: panenForm.kolamId,
                    pembeliId: panenForm.pembeliId,
                    tanggal: panenForm.tanggal,
                    beratKg: Number(panenForm.beratTotalKg),
                    hargaPerKg: Number(panenForm.hargaPerKg),
                    jumlahIkan: Number(panenForm.jumlahEkor),
                    keterangan: panenForm.catatan || 'Panen Otomatis'
                });
            }

            onClose();
            setPanenForm({
                kolamId: defaultKolamId || '',
                pembeliId: '',
                tanggal: new Date().toISOString().split('T')[0],
                beratTotalKg: '',
                jumlahEkor: '',
                hargaPerKg: '25000',
                tipe: 'PARSIAL',
                catatan: ''
            });
            showToast('Panen & Penjualan berhasil dicatat', 'success');
        } catch (error: any) {
            showToast(error.message || 'Gagal mencatat panen', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBuyerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newBuyer = await addPembeli(buyerForm);
            if (newBuyer) {
                setPanenForm({ ...panenForm, pembeliId: newBuyer.id });
            }
            setIsBuyerModalOpen(false);
            setBuyerForm({ nama: '', tipe: 'TENGKULAK', kontak: '', alamat: '' });
            showToast('Pembeli berhasil ditambahkan', 'success');
        } catch (error) {
            showToast('Gagal menambahkan pembeli', 'error');
        }
    };

    return (
        <>
            <Modal 
                isOpen={isOpen} 
                onClose={onClose} 
                title="Catat Panen Ikan"
                footer={
                    <>
                        <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>Batal</button>
                        <button type="submit" form="form-panen" className="btn bg-emerald-600 text-white hover:bg-emerald-700 border-transparent disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <LoadingSpinner className="w-5 h-5" />
                                    Menyimpan...
                                </span>
                            ) : 'Simpan Panen'}
                        </button>
                    </>
                }
            >
                <form id="form-panen" onSubmit={handlePanenSubmit} className="space-y-4">
                    {!isKolamFixed && (
                        <div className="form-group">
                            <label className="form-label">Kolam</label>
                            <select
                                value={panenForm.kolamId}
                                onChange={(e) => setPanenForm({ ...panenForm, kolamId: e.target.value })}
                                className="input w-full"
                                required
                            >
                                <option value="">-- Pilih Kolam --</option>
                                {activeKolam.map(k => (
                                    <option key={k.id} value={k.id}>{k.nama} ({k.jumlahIkan.toLocaleString()} ekor)</option>
                                ))}
                            </select>
                            {activeKolam.length === 0 && (
                                <p className="text-xs text-red-500 mt-1">Tidak ada kolam dengan ikan aktif</p>
                            )}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Tanggal</label>
                        <input type="date" className="input w-full" required
                            value={panenForm.tanggal} onChange={e => setPanenForm({ ...panenForm, tanggal: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Pembeli</label>
                        <div className="flex gap-2">
                            <select
                                className="input w-full"
                                value={panenForm.pembeliId}
                                onChange={e => setPanenForm({ ...panenForm, pembeliId: e.target.value })}
                                required
                            >
                                <option value="">-- Pilih Pembeli --</option>
                                {pembeli.map(p => (
                                    <option key={p.id} value={p.id}>{p.nama} ({p.tipe})</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => setIsBuyerModalOpen(true)}
                                className="btn btn-secondary px-3"
                                title="Tambah Pembeli Baru"
                            >
                                <PlusIcon />
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Data akan otomatis masuk ke menu Penjualan.</p>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tipe</label>
                        <select
                            className="input w-full"
                            value={panenForm.tipe}
                            onChange={e => {
                                const newTipe = e.target.value as 'PARSIAL' | 'TOTAL';
                                setPanenForm(prev => {
                                    const updates: any = { ...prev, tipe: newTipe };
                                    
                                    // Auto-fill semua ikan jika TOTAL
                                    if (newTipe === 'TOTAL' && prev.kolamId) {
                                        const selectedKolam = kolam.find(k => k.id === prev.kolamId);
                                        if (selectedKolam) {
                                            updates.jumlahEkor = selectedKolam.jumlahIkan.toString();
                                            
                                            // Calculate berat dari jumlah ekor
                                            const latestSampling = getLatestSampling(selectedKolam.id);
                                            if (latestSampling && latestSampling.jumlahIkanPerKg > 0) {
                                                const estimatedBerat = (selectedKolam.jumlahIkan / latestSampling.jumlahIkanPerKg).toFixed(1);
                                                updates.beratTotalKg = estimatedBerat;
                                            }
                                        }
                                    }
                                    return updates;
                                });
                            }}
                        >
                            <option value="PARSIAL">Parsial</option>
                            <option value="TOTAL">Total (Panen Raya)</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Berat Total (Kg)</label>
                            <input 
                                type="number" 
                                step="0.1" 
                                className="input w-full" 
                                required 
                                placeholder="0"
                                value={panenForm.beratTotalKg} 
                                onChange={e => {
                                    const beratKg = e.target.value;
                                    setPanenForm(prev => {
                                        const updates: any = { ...prev, beratTotalKg: beratKg };
                                        
                                        // Auto-calculate jumlah ekor dari berat jika ada sampling
                                        if (beratKg && prev.kolamId) {
                                            const selectedKolam = kolam.find(k => k.id === prev.kolamId);
                                            if (selectedKolam) {
                                                const latestSampling = getLatestSampling(selectedKolam.id);
                                                if (latestSampling && latestSampling.jumlahIkanPerKg > 0) {
                                                    const estimatedEkor = Math.round(parseFloat(beratKg) * latestSampling.jumlahIkanPerKg);
                                                    updates.jumlahEkor = estimatedEkor.toString();
                                                }
                                            }
                                        }
                                        return updates;
                                    });
                                }} 
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Jlh Ekor</label>
                            <input 
                                type="number" 
                                className="input w-full" 
                                placeholder="0"
                                value={panenForm.jumlahEkor} 
                                onChange={e => {
                                    const jumlahEkor = e.target.value;
                                    setPanenForm(prev => {
                                        const updates: any = { ...prev, jumlahEkor };
                                        
                                        // Auto-calculate berat dari jumlah ekor jika ada sampling
                                        if (jumlahEkor && prev.kolamId) {
                                            const selectedKolam = kolam.find(k => k.id === prev.kolamId);
                                            if (selectedKolam) {
                                                const latestSampling = getLatestSampling(selectedKolam.id);
                                                if (latestSampling && latestSampling.jumlahIkanPerKg > 0) {
                                                    const estimatedBerat = (parseFloat(jumlahEkor) / latestSampling.jumlahIkanPerKg).toFixed(1);
                                                    updates.beratTotalKg = estimatedBerat;
                                                }
                                            }
                                        }
                                        return updates;
                                    });
                                }} 
                            />
                            {panenForm.kolamId && (() => {
                                const selectedKolam = kolam.find(k => k.id === panenForm.kolamId);
                                return selectedKolam && (
                                    <p className="text-xs text-slate-500 mt-1">Maks: {selectedKolam.jumlahIkan.toLocaleString()} ekor</p>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Harga Jual (Rp/kg)</label>
                        <input type="text" className="input w-full" required
                            value={formatCurrencyInput(panenForm.hargaPerKg)}
                            onChange={e => setPanenForm({ ...panenForm, hargaPerKg: parseCurrencyInput(e.target.value) })} />
                    </div>

                    {panenForm.beratTotalKg && panenForm.hargaPerKg && (
                        <div className="p-4 bg-green-50 rounded-xl">
                            <p className="text-sm text-green-700">Total: <span className="font-bold">Rp {(parseFloat(panenForm.beratTotalKg) * parseFloat(panenForm.hargaPerKg)).toLocaleString('id-ID')}</span></p>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Catatan (Opsional)</label>
                        <textarea
                            className="input w-full"
                            rows={2}
                            placeholder="Contoh: Panen parsial..."
                            value={panenForm.catatan}
                            onChange={e => setPanenForm({ ...panenForm, catatan: e.target.value })}
                        />
                    </div>
                </form>
            </Modal>

            {/* Quick Add Buyer Modal */}
            <Modal 
                isOpen={isBuyerModalOpen} 
                onClose={() => setIsBuyerModalOpen(false)} 
                title="Tambah Pembeli Baru"
                footer={
                    <>
                        <button type="button" onClick={() => setIsBuyerModalOpen(false)} className="btn btn-secondary">Batal</button>
                        <button type="submit" form="form-buyer" className="btn btn-primary">Simpan</button>
                    </>
                }
            >
                <form id="form-buyer" onSubmit={handleBuyerSubmit} className="space-y-4">
                    <div className="form-group">
                        <label className="form-label">Nama Pembeli</label>
                        <input
                            type="text"
                            value={buyerForm.nama}
                            onChange={(e) => setBuyerForm({ ...buyerForm, nama: e.target.value })}
                            className="input w-full"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tipe</label>
                        <select
                            value={buyerForm.tipe}
                            onChange={(e) => setBuyerForm({ ...buyerForm, tipe: e.target.value as TipePembeli })}
                            className="input w-full"
                        >
                            <option value="TENGKULAK">Tengkulak</option>
                            <option value="PASAR">Pasar</option>
                            <option value="RESTORAN">Restoran</option>
                            <option value="LAINNYA">Lainnya</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Kontak (Opsional)</label>
                        <input
                            type="text"
                            value={buyerForm.kontak}
                            onChange={(e) => setBuyerForm({ ...buyerForm, kontak: e.target.value })}
                            className="input w-full"
                            placeholder="No. HP atau Email"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Alamat (Opsional)</label>
                        <textarea
                            value={buyerForm.alamat}
                            onChange={(e) => setBuyerForm({ ...buyerForm, alamat: e.target.value })}
                            className="input w-full"
                            rows={2}
                        />
                    </div>
                </form>
            </Modal>
        </>
    );
}
