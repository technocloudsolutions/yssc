'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();

  useEffect(() => {
    console.log('Home page effect running:', { user, userData, loading });
    
    if (!loading) {
      if (!user) {
        console.log('No user, redirecting to login');
        router.push('/auth/login');
      } else if (userData?.role === 'admin') {
        console.log('Admin user, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.log('Non-admin user, redirecting to user dashboard');
        router.push('/user-dashboard');
      }
    }
  }, [user, userData, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  return null;
}
