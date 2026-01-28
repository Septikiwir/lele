'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Types
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    toasts: Toast[];
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { id, message, type };

        setToasts(prev => [...prev, newToast]);

        // Auto remove after 3-5 seconds
        setTimeout(() => {
            removeToast(id);
        }, 3000);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast, toasts, removeToast }}>
            {children}
            {/* Render Toast Container Here or separately */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

// Internal Toast Container Component
function ToastContainer({ toasts, removeToast }: { toasts: Toast[], removeToast: (id: string) => void }) {
    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`
                        pointer-events-auto min-w-[300px] max-w-sm w-full bg-white shadow-lg rounded-lg border-l-4 p-4 transform transition-all animate-in slide-in-from-right duration-300
                        ${toast.type === 'success' ? 'border-emerald-500' : ''}
                        ${toast.type === 'error' ? 'border-red-500' : ''}
                        ${toast.type === 'warning' ? 'border-amber-500' : ''}
                        ${toast.type === 'info' ? 'border-blue-500' : ''}
                    `}
                >
                    <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                            <p className={`font-semibold text-sm mb-0.5
                                ${toast.type === 'success' ? 'text-emerald-800' : ''}
                                ${toast.type === 'error' ? 'text-red-800' : ''}
                                ${toast.type === 'warning' ? 'text-amber-800' : ''}
                                ${toast.type === 'info' ? 'text-blue-800' : ''}
                            `}>
                                {toast.type === 'success' && 'Berhasil'}
                                {toast.type === 'error' && 'Gagal'}
                                {toast.type === 'warning' && 'Peringatan'}
                                {toast.type === 'info' && 'Info'}
                            </p>
                            <p className="text-slate-600 text-sm leading-tight">{toast.message}</p>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
