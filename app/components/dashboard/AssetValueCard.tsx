'use client';
import { useApp } from '../../context/AppContext';
import { useState } from 'react';
import { Banknote } from 'lucide-react';

export default function AssetValueCard() {
    const { calculateTotalAssetValue, hargaPasarPerKg, setHargaPasarPerKg } = useApp();
    const [isEditing, setIsEditing] = useState(false);

    const assetValue = calculateTotalAssetValue(hargaPasarPerKg);

    // Format currency: convert to "jt" if >= 1,000,000, else "k" if >= 1,000
    const formatCurrency = (value: number) => {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'jt';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'k';
        }
        return value.toLocaleString('id-ID');
    };

    return (
        <div className="w-full p-4 sm:p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Banknote className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Total Aset</p>
            </div>
            <h5 className="mb-2 text-lg sm:text-2xl font-semibold tracking-tight text-slate-900">Rp {formatCurrency(assetValue)}</h5>
            <p className="mb-3 text-sm text-slate-600">
                *Berat 85-150g/ekor
            </p>
            <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex font-medium items-center text-blue-600 hover:underline text-sm"
            >
                {isEditing ? 'Selesai' : 'Atur Harga Pasar'}
                <svg className="w-3 h-3 ms-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </button>

            {isEditing && (
                <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-1">
                    <label className="block text-xs text-slate-500 mb-1 font-medium">
                        Harga (Rp/kg)
                    </label>
                    <input
                        type="number"
                        value={hargaPasarPerKg}
                        onChange={(e) => setHargaPasarPerKg(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            )}
        </div>
    );
}
