'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user.role === 'admin' || (user.groups && user.groups.includes('admins'));
  const status = user.status || 'pending';

  // Admins always get through
  if (isAdmin) return <>{children}</>;

  // Pending users see a waiting screen
  if (status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 text-center border border-slate-700">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Cuenta pendiente de aprobacion</h2>
          <p className="text-slate-400 mb-6">
            Tu cuenta ha sido registrada correctamente. Un administrador debe aprobar tu acceso antes de que puedas utilizar la plataforma.
          </p>
          <p className="text-sm text-slate-500">
            Si crees que esto es un error, contacta con tu profesor.
          </p>
          <button
            onClick={signOut}
            className="mt-6 text-sm text-primary hover:underline"
          >
            Cerrar sesion
          </button>
        </div>
      </div>
    );
  }

  // Suspended users
  if (status === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 text-center border border-slate-700">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Cuenta suspendida</h2>
          <p className="text-slate-400 mb-4">
            Tu cuenta ha sido suspendida. Contacta con tu profesor para mas informacion.
          </p>
          <button onClick={signOut} className="text-sm text-primary hover:underline">Cerrar sesion</button>
        </div>
      </div>
    );
  }

  // Expired users
  if (status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 text-center border border-slate-700">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Acceso expirado</h2>
          <p className="text-slate-400 mb-4">
            Tu periodo de acceso ha finalizado. Contacta con tu profesor para renovar tu acceso.
          </p>
          <button onClick={signOut} className="text-sm text-primary hover:underline">Cerrar sesion</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
