import Sidebar from './Sidebar';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />

            {/* Main Content */}
            <main className="md:ml-64 min-h-screen">
                <div className="p-4 md:p-8 pt-16 md:pt-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
