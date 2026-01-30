'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import PanenModal from '../modals/PanenModal';
import { useApp } from '../../context/AppContext';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { isSidebarCollapsed, toggleSidebar } = useApp();

    // Panen Modal - Must be declared before any conditional returns
    const [isPanenModalOpen, setIsPanenModalOpen] = useState(false);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (status === 'loading') return; // Wait for session to load
        if (!session) {
            router.push('/login');
        }
    }, [session, status, router]);

    // Show loading while checking authentication
    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render if not authenticated
    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleCollapse={toggleSidebar}
                onPanenClick={() => setIsPanenModalOpen(true)}
            />

            {/* Main Content */}
            <main className={`min-h-screen transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
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
