'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { Logo } from '@/components/ui/Logo';

function StatusScreen({ icon, iconBg, title, description, note, onSignOut }: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  note?: string;
  onSignOut: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 text-center border border-slate-700/50 shadow-xl animate-fade-in">
        <Logo size="sm" className="justify-center mb-6" />
        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-400 mb-4">{description}</p>
        {note && <p className="text-sm text-slate-500 mb-4">{note}</p>}
        <button
          onClick={onSignOut}
          className="mt-2 px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
        >
          Cerrar sesion
        </button>
      </div>
    </div>
  );
}

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 gap-4">
        <Logo size="md" />
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user.role === 'admin' || (user.groups && user.groups.includes('admins'));
  const status = user.status || 'pending';

  if (isAdmin) return <>{children}</>;

  if (status === 'pending') {
    return (
      <StatusScreen
        iconBg="bg-amber-500/20"
        icon={<svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        title="Cuenta pendiente de aprobacion"
        description="Tu cuenta ha sido registrada correctamente. Un administrador debe aprobar tu acceso antes de que puedas utilizar la plataforma."
        note="Si crees que esto es un error, contacta con tu profesor."
        onSignOut={signOut}
      />
    );
  }

  if (status === 'suspended') {
    return (
      <StatusScreen
        iconBg="bg-red-500/20"
        icon={<svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
        title="Cuenta suspendida"
        description="Tu cuenta ha sido suspendida. Contacta con tu profesor para mas informacion."
        onSignOut={signOut}
      />
    );
  }

  if (status === 'expired') {
    return (
      <StatusScreen
        iconBg="bg-orange-500/20"
        icon={<svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>}
        title="Acceso expirado"
        description="Tu periodo de acceso ha finalizado. Contacta con tu profesor para renovar tu acceso."
        onSignOut={signOut}
      />
    );
  }

  return <>{children}</>;
}
