'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Quick redirect without waiting too long
    const timeout = setTimeout(() => {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [user, router]);

  // Don't wait for isLoading - just redirect quickly
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isLoading, user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500">Redirecting...</p>
      </div>
    </div>
  );
}
