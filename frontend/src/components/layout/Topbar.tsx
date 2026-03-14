'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export function Topbar() {
  const { user, signOut } = useAuth();

  return (
    <header className="h-16 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 flex items-center justify-end px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-200">{user?.name || user?.email}</p>
          <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
          {(user?.name || user?.email || '?')[0].toUpperCase()}
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>
          Salir
        </Button>
      </div>
    </header>
  );
}
