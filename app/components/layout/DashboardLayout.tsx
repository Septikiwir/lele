'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import PanenModal from '../modals/PanenModal';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useOnline } from '@/lib/use-online';
import { WifiOff, Wifi, CloudOff } from 'lucide-react';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { data: session, status } = useSession();
    const { user: effectiveUser } = useAuth(); // Use cached user if online session unavailable
    const router = useRouter();
    const { isSidebarCollapsed, toggleSidebar } = useApp();
    const { isOnline, wasOffline } = useOnline();

    // Panen Modal - Must be declared before any conditional returns
    const [isPanenModalOpen, setIsPanenModalOpen] = useState(false);
    const [showReconnectedToast, setShowReconnectedToast] = useState(false);

    // Redirect to login if not authenticated (no session AND no cached user)
    useEffect(() => {
        // If we have cached user, don't wait for online session check
        if (effectiveUser) return;
        
        // Only wait for loading if we're online (otherwise it takes too long)
        if (status === 'loading' && isOnline) return;
        
        // No cached user and (not loading OR offline) - redirect to login
        if (!session && !effectiveUser) {
            router.push('/login');
        }
    }, [session, effectiveUser, status, isOnline, router]);

    // Show reconnection toast
    useEffect(() => {
        if (isOnline && wasOffline) {
            setShowReconnectedToast(true);
            const timer = setTimeout(() => {
                setShowReconnectedToast(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, wasOffline]);

    // Show minimal loading only when online and actually loading (not when using cached session)
    if (status === 'loading' && isOnline && !effectiveUser) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render if not authenticated (no online session AND no cached user)
    if (!session && !effectiveUser) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Offline/Online Status Banner */}
            {!isOnline && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-orange-600 text-white px-4 py-2 flex items-center justify-center gap-2 shadow-lg">
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm font-medium">
                        Anda sedang offline - Menampilkan data tersimpan
                    </span>
                    <CloudOff className="w-4 h-4" />
                </div>
            )}
            
            {/* Reconnected Toast */}
            {showReconnectedToast && (
                <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-slide-in-right">
                    <Wifi className="w-5 h-5" />
                    <span className="font-medium">Kembali online - Data disinkronkan</span>
                </div>
            )}

            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleCollapse={toggleSidebar}
                onPanenClick={() => setIsPanenModalOpen(true)}
            />

            {/* Main Content */}
            <main className={`min-h-screen transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} ${!isOnline ? 'mt-10' : ''}`}>
                <div className="p-4 md:p-8 pt-4 md:pt-8 w-full mx-auto pb-20 md:pb-8">
                    {children}
                </div>
            </main>

            {/* Panen Modal */}
            <PanenModal
                isOpen={isPanenModalOpen}
                onClose={() => setIsPanenModalOpen(false)}
            />
        </div>
    );
}
