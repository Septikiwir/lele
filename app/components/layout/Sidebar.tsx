'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { WalletIcon } from '../ui/Icons';

// Icons ... (Keep existing icons)
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const KolamIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const MapIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const PakanIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const AirIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const PanenIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const LaporanIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PengeluaranIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PenjualanIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const navigationGroups = [
  {
    title: 'Overview',
    items: [{ name: 'Dashboard', href: '/', icon: DashboardIcon }]
  },
  {
    title: 'Operasional',
    items: [
      { name: 'Kolam', href: '/kolam', icon: KolamIcon },
      { name: 'Denah Tambak', href: '/denah', icon: MapIcon },
      { name: 'Pakan & FCR', href: '/pakan', icon: PakanIcon },
      { name: 'Kualitas Air', href: '/kualitas-air', icon: AirIcon },
      { name: 'Prediksi Panen', href: '/panen', icon: PanenIcon }
    ]
  },
  {
    title: 'Keuangan',
    items: [
      { name: 'Keuangan', href: '/keuangan', icon: WalletIcon },
      { name: 'Laporan', href: '/laporan', icon: LaporanIcon }
    ]
  }
];

interface SidebarProps {
  isCollapsed?: boolean;
  toggleCollapse?: () => void;
}

export default function Sidebar({ isCollapsed = false, toggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  // Role-based filtering
  const filteredGroups = navigationGroups.filter(group => {
    if (user?.role === 'operator') {
      return group.title !== 'Keuangan';
    }
    return true; // Admin and Viewer see everything in menu
  });

  return (
    <>
      {/* Mobile Bottom Navigation - Visible below md */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 md:hidden pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {/* 1. Home */}
          <Link href="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === '/' ? 'text-teal-600' : 'text-slate-400'}`}>
            <DashboardIcon />
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          {/* 2. Kolam */}
          <Link href="/kolam" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname.startsWith('/kolam') ? 'text-teal-600' : 'text-slate-400'}`}>
            <KolamIcon />
            <span className="text-[10px] font-medium">Kolam</span>
          </Link>

          {/* 3. CENTER FAB (Input Panen) */}
          <div className="relative -top-5">
            <Link href="/panen" className="flex items-center justify-center w-14 h-14 rounded-full bg-teal-600 text-white shadow-lg shadow-teal-500/40 hover:scale-105 transition-transform">
              <span className="text-2xl mb-1">+</span>
            </Link>
          </div>

          {/* 4. Keuangan */}
          <Link href="/keuangan" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname.startsWith('/keuangan') ? 'text-teal-600' : 'text-slate-400'}`}>
            <WalletIcon />
            <span className="text-[10px] font-medium">Keuangan</span>
          </Link>

          {/* 5. Menu (Triggers Sidebar) */}
          <button
            onClick={() => setIsOpen(true)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isOpen ? 'text-teal-600' : 'text-slate-400'}`}
          >
            <MenuIcon />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Fixed on desktop, Drawer on mobile */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-[#0f2937] text-slate-300 z-50 transition-all duration-300 ease-in-out flex flex-col border-r border-slate-800 ${isOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full md:translate-x-0'} ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Mobile Drawer Header (Close Button) */}
        <div className="md:hidden flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f2937]">
          <span className="font-bold text-white text-lg">Menu</span>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
            <CloseIcon />
          </button>
        </div>

        {/* Logo & Toggle (Desktop Only) */}
        <div className={`hidden md:flex items-center gap-3 px-6 py-6 border-b border-slate-800 bg-[#0f2937] z-10 flex-shrink-0 transition-all ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
          <div className="flex items-center gap-3">
            <div className={`rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20 transition-all ${isCollapsed ? 'w-10 h-10' : 'w-10 h-10'}`}>
              <span className="text-xl">🐟</span>
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">LeleFarm</h1>
                <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Management System</p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          {toggleCollapse && !isCollapsed && (
            <button onClick={toggleCollapse} className="hidden md:flex text-slate-500 hover:text-white transition-colors">
              <ChevronLeftIcon />
            </button>
          )}
        </div>

        {/* Toggle Button when Collapsed (Centered) */}
        {isCollapsed && toggleCollapse && (
          <button onClick={toggleCollapse} className="hidden md:flex justify-center py-2 text-slate-500 hover:text-white transition-colors border-b border-slate-800 bg-slate-800/20">
            <ChevronRightIcon />
          </button>
        )}

        {/* Navigation Groups - Scrollable Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
          <nav className={`py-6 space-y-8 ${isCollapsed ? 'md:px-2' : 'px-4'}`}>
            {filteredGroups.map((group) => (
              <div key={group.title}>
                {(!isCollapsed || isOpen) && (
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3 whitespace-nowrap overflow-hidden">
                    {group.title}
                  </h3>
                )}
                {isCollapsed && !isOpen && (
                  <div className="w-8 mx-auto border-b border-slate-800 mb-4 opacity-50"></div>
                )}
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href ||
                      (item.href !== '/' && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${isActive
                            ? 'text-white bg-teal-600/10'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            } ${isCollapsed && !isOpen ? 'justify-center px-0 py-3' : ''}`}
                          title={isCollapsed ? item.name : undefined}
                        >
                          {isActive && (
                            <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-teal-500 rounded-r-full ${isCollapsed ? 'left-0 h-8' : 'left-0'}`} />
                          )}
                          <span className={`transition-colors ${isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                            <Icon />
                          </span>
                          {(!isCollapsed || isOpen) && <span>{item.name}</span>}

                          {/* Hover Tooltip for Collapsed Mode (Desktop) */}
                          {isCollapsed && !isOpen && (
                            <div className="hidden md:block absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-slate-700">
                              {item.name}
                            </div>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Section: Profile & Logout - Fixed at bottom */}
        {user ? (
          <div className="p-4 border-t border-slate-800 bg-[#0f2937] flex-shrink-0">
            <div className={`flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 transition-colors cursor-pointer group ${isCollapsed && !isOpen ? 'justify-center px-0 bg-transparent hover:bg-transparent' : ''}`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-sm ring-2 ring-slate-800 shadow-md">
                {user.avatar || '👤'}
              </div>
              {(!isCollapsed || isOpen) && (
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-teal-400 transition-colors">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate capitalize">{user.role} • {user.plan || 'Free'}</p>
                </div>
              )}
            </div>

            <button
              onClick={logout}
              className={`w-full mt-4 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors ${isCollapsed && !isOpen ? 'mt-2 px-0' : ''}`}
            >
              <LogoutIcon />
              {(!isCollapsed || isOpen) && <span>Keluar Aplikasi</span>}
            </button>
          </div>
        ) : (
          <div className="p-4 border-t border-slate-800 bg-[#0f2937] flex-shrink-0">
            <Link href="/login" className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold bg-teal-600 text-white hover:bg-teal-500 transition-colors ${isCollapsed && !isOpen ? 'px-0' : 'w-full'}`}>
              {isCollapsed && !isOpen ? <span>Login</span> : <span>Login / Masuk</span>}
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
