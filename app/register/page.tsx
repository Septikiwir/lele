'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to login page
        router.push('/login');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <p className="text-slate-600">Redirecting...</p>
            </div>
        </div>
    );
}
