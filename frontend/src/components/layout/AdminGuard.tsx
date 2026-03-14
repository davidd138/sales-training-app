'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === 'admin' || (user?.groups && user.groups.includes('admins'));

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) return null;

  return <>{children}</>;
}
