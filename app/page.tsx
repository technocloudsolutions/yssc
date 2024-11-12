'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
      } else if (userData?.role === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/user-dashboard');
      }
    }
  }, [user, userData, loading, router]);

  // Show loading state or return null
  return null;
}
