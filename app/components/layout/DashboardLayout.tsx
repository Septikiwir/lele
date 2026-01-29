'use client';

import Sidebar from './Sidebar';
import { useApp } from '../../context/AppContext';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { isSidebarCollapsed, toggleSidebar } = useApp();

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleCollapse={toggleSidebar} />

            {/* Main Content */}
            <main className={`min-h-screen transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
                <div className="p-4 md:p-8 pt-4 md:pt-8 w-full mx-auto pb-20 md:pb-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
