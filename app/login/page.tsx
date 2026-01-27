'use client';

import { useAuth, UserRole } from '../context/AuthContext';
import { useState } from 'react';

export default function LoginPage() {
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (role: UserRole) => {
        setIsLoading(true);
        // Simulate network delay
        setTimeout(() => {
            login(role);
            setIsLoading(false);
        }, 800);
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-700">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                        <span className="text-3xl">🐟</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">LeleFarm Login</h1>
                    <p className="text-slate-400">Pilih role untuk simulasi akses</p>
                </div>

                <div className="space-y-4">
                    <LoginButton
                        role="admin"
                        title="Administrator"
                        desc="Akses Penuh (Edit, Hapus, Keuangan)"
                        icon="👨‍💼"
                        color="bg-blue-600 hover:bg-blue-500"
                        onClick={() => handleLogin('admin')}
                        isLoading={isLoading}
                    />

                    <LoginButton
                        role="operator"
                        title="Operator Kolam"
                        desc="Input Data Harian (Pakan, Air, Kolam)"
                        icon="👷"
                        color="bg-emerald-600 hover:bg-emerald-500"
                        onClick={() => handleLogin('operator')}
                        isLoading={isLoading}
                    />

                    <LoginButton
                        role="viewer"
                        title="Viewer / Tamu"
                        desc="Hanya Melihat Data (Read Only)"
                        icon="👀"
                        color="bg-slate-600 hover:bg-slate-500"
                        onClick={() => handleLogin('viewer')}
                        isLoading={isLoading}
                    />
                </div>

                <p className="mt-8 text-center text-xs text-slate-500">
                    LeleFarm Management System v2.0
                </p>
            </div>
        </div>
    );
}

function LoginButton({
    role,
    title,
    desc,
    icon,
    color,
    onClick,
    isLoading
}: {
    role: string;
    title: string;
    desc: string;
    icon: string;
    color: string;
    onClick: () => void;
    isLoading: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all duration-200 group ${color} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xl backdrop-blur-sm">
                {icon}
            </div>
            <div className="text-left flex-1">
                <h3 className="text-white font-bold">{title}</h3>
                <p className="text-white/70 text-xs">{desc}</p>
            </div>
            <div className="text-white/50 group-hover:translate-x-1 transition-transform">
                →
            </div>
        </button>
    );
}
