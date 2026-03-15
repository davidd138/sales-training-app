'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/ui/Logo';
import { Spinner } from '@/components/ui/Spinner';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(user ? '/dashboard' : '/login');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 gap-4">
      <Logo size="lg" />
      <p className="text-slate-400 text-sm mt-2">Entrena. Practica. Cierra.</p>
      <Spinner className="h-8 w-8 mt-4" />
      <p className="text-slate-500 text-xs">Cargando plataforma...</p>
    </div>
  );
}
