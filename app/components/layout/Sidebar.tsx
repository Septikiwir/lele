'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Box,
  Map,
  Container,
  Droplets,
  BarChart3,
  FileText,
  DollarSign,
  CreditCard,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Fish,
  User,
  Shield,
  Users,
  Wallet,
  Calculator
} from 'lucide-react';

const navigationGroups = [
  {
    title: 'Overview',
    items: [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }]
  },
  {
    title: 'Operasional',
    items: [
      { name: 'Kolam', href: '/kolam', icon: Box },
      { name: 'Denah Tambak', href: '/denah', icon: Map },
      { name: 'Pakan & FCR', href: '/pakan', icon: Container },
      { name: 'Kualitas Air', href: '/kualitas-air', icon: Droplets }
    ]
  },
  {
    title: 'Keuangan',
    items: [
      { name: 'Keuangan', href: '/keuangan', icon: Wallet },
      { name: 'Arus Kas', href: '/arus-kas', icon: FileText },
      { name: 'Simulasi', href: '/simulasi-keuangan', icon: Calculator }
    ]
  }
];

interface SidebarProps {
  isCollapsed?: boolean;
  toggleCollapse?: () => void;
  onPanenClick?: () => void;
}

export default function Sidebar({ isCollapsed = false, toggleCollapse, onPanenClick }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { activeFarmId } = useApp();

  // Dynamic Navigation Groups
  const dynamicGroups = [...navigationGroups];

  // Add Manajemen group for Owners/Admins if farm is active
  if (activeFarmId && user && ['OWNER', 'ADMIN', 'SUPERADMIN', 'owner', 'admin'].includes(user.role)) {
    dynamicGroups.push({
      title: 'Manajemen',
      items: [
        { name: 'Anggota', href: '/anggota', icon: Users }
      ]
    });
  }

  // Role-based filtering
  const filteredGroups = dynamicGroups.filter(group => {
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
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          {/* 2. Kolam */}
          <Link href="/kolam" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname.startsWith('/kolam') ? 'text-teal-600' : 'text-slate-400'}`}>
            <Box className="w-5 h-5" />
            <span className="text-[10px] font-medium">Kolam</span>
          </Link>

          {/* 3. CENTER FAB (Input Panen) */}
          <div className="relative -top-5">
            <button
              onClick={onPanenClick}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-teal-600 text-white shadow-lg shadow-teal-500/40 hover:scale-105 transition-transform"
            >
              <span className="text-2xl mb-1">+</span>
            </button>
          </div>

          {/* 4. Keuangan */}
          <Link href="/keuangan" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname.startsWith('/keuangan') ? 'text-teal-600' : 'text-slate-400'}`}>
            <Wallet className="w-5 h-5" />
            <span className="text-[10px] font-medium">Keuangan</span>
          </Link>

          {/* 5. Menu (Triggers Sidebar) */}
          <button
            onClick={() => setIsOpen(true)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isOpen ? 'text-teal-600' : 'text-slate-400'}`}
          >
            <Menu className="w-5 h-5" />
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
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Logo & Toggle (Desktop Only) */}
        <div className={`hidden md:flex items-center gap-3 px-6 py-6 border-b border-slate-800 bg-[#0f2937] z-10 flex-shrink-0 transition-all ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
          <div className="flex items-center gap-3">
            <div className={`rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20 transition-all ${isCollapsed ? 'w-10 h-10' : 'w-10 h-10'}`}>
              <Fish className="w-5 h-5 text-white" />
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
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Toggle Button when Collapsed (Centered) */}
        {isCollapsed && toggleCollapse && (
          <button onClick={toggleCollapse} className="hidden md:flex justify-center py-2 text-slate-500 hover:text-white transition-colors border-b border-slate-800 bg-slate-800/20">
            <ChevronRight className="w-5 h-5" />
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
                            <Icon className="w-5 h-5" />
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
          <div className="p-4 border-t border-slate-800 bg-[#0f2937] flex-shrink-0 space-y-3">
            {/* Admin Panel Link - Only for SUPERADMIN */}
            {user.role === 'SUPERADMIN' && (
              <Link
                href="/farms"
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600 transition-all shadow-md shadow-purple-500/30 ${isCollapsed && !isOpen ? 'px-0' : 'w-full'}`}
              >
                <Shield className="w-4 h-4" />
                {(!isCollapsed || isOpen) && <span>Panel Admin</span>}
              </Link>
            )}

            <div className={`flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 transition-colors cursor-pointer group ${isCollapsed && !isOpen ? 'justify-center px-0 bg-transparent hover:bg-transparent' : ''}`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-sm ring-2 ring-slate-800 shadow-md text-white">
                {user.avatar ? user.avatar : <User className="w-5 h-5" />}
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
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors ${isCollapsed && !isOpen ? 'px-0' : ''}`}
            >
              <LogOut className="w-5 h-5" />
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
