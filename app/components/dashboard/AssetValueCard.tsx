'use client';
import { useApp } from '../../context/AppContext';
import { useState } from 'react';
import { EyeIcon } from '../ui/Icons'; // Re-using existing icons if possible, or just emoji

export default function AssetValueCard() {
    const { calculateTotalAssetValue, hargaPasarPerKg, setHargaPasarPerKg } = useApp();
    const [isEditing, setIsEditing] = useState(false);

    const assetValue = calculateTotalAssetValue(hargaPasarPerKg);

    return (
        <div className="stat-card p-6 bg-white border border-slate-100 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="flex items-center justify-between z-10 relative">
                <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Estimasi Omzet</p>
                    <div className="flex items-baseline gap-1 mt-1">
                        <p className="text-2xl font-bold text-slate-900">Rp {assetValue.toLocaleString('id-ID')}</p>
                    </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                    <span className="text-xl">💎</span>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                    {isEditing ? 'Selesai' : 'Atur Harga Pasar'}
                </button>
                <span className="text-xs text-slate-400">*Berat 85-150g/ekor</span>
            </div>

            {isEditing && (
                <div className="mt-2 bg-slate-50 p-2 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-1">
                    <label className="block text-xs text-slate-500 mb-1">
                        Harga (Rp/kg)
                    </label>
                    <input
                        type="number"
                        value={hargaPasarPerKg}
                        onChange={(e) => setHargaPasarPerKg(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>
            )}
        </div>
    );
}
