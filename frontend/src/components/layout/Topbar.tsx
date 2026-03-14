'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export function Topbar() {
  const { user, signOut } = useAuth();
  const isAdmin = user?.role === 'admin' || (user?.groups && user.groups.includes('admins'));

  return (
    <header role="banner" className="h-16 glass border-b border-slate-700/50 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
      <div className="md:hidden">
        <span className="text-sm font-bold">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Sales</span>
          <span className="text-white">Pulse</span>
        </span>
      </div>
      <div className="flex items-center gap-3" aria-label="Menu de usuario">
        <div className="text-right hidden sm:block">
          <div className="flex items-center gap-2 justify-end">
            <p className="text-sm font-medium text-slate-200">{user?.name || user?.email}</p>
            {isAdmin && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 rounded border border-amber-500/30">
                Admin
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">{user?.email}</p>
        </div>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ring-2 ${
          isAdmin
            ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30 text-amber-400 ring-amber-500/30'
            : 'bg-gradient-to-br from-blue-500/30 to-cyan-500/30 text-blue-400 ring-blue-500/30'
        }`}>
          {(user?.name || user?.email || '?')[0].toUpperCase()}
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>
          Salir
        </Button>
      </div>
    </header>
  );
}
