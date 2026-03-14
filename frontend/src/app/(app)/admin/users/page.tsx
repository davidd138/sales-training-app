'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminGuard } from '@/components/layout/AdminGuard';
import { useQuery, useMutation } from '@/hooks/useGraphQL';
import { LIST_ALL_USERS } from '@/lib/graphql/queries';
import { UPDATE_USER_STATUS } from '@/lib/graphql/mutations';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { User, UserStatus } from '@/types';

const STATUS_COLORS: Record<UserStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-400',
  active: 'bg-green-500/20 text-green-400',
  suspended: 'bg-red-500/20 text-red-400',
  expired: 'bg-orange-500/20 text-orange-400',
};

const STATUS_LABELS: Record<UserStatus, string> = {
  pending: 'Pendiente',
  active: 'Activo',
  suspended: 'Suspendido',
  expired: 'Expirado',
};

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <UsersContent />
    </AdminGuard>
  );
}

function UsersContent() {
  const { data: users, loading, error, execute: fetchUsers } = useQuery<User[]>(LIST_ALL_USERS);
  const { execute: updateStatus, loading: updating } = useMutation(UPDATE_USER_STATUS);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');

  useEffect(() => { fetchUsers().catch(() => {}); }, [fetchUsers]);

  const handleUpdateStatus = useCallback(async (userId: string, status: UserStatus, from?: string, until?: string) => {
    const input: Record<string, string> = { userId, status };
    if (from) input.validFrom = new Date(from).toISOString();
    if (until) input.validUntil = new Date(until).toISOString();

    await updateStatus({ input });
    setEditingUser(null);
    fetchUsers();
  }, [updateStatus, fetchUsers]);

  if (loading && !users) return <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-400">Error: {error}</p>;

  const items = (users as any)?.items || users || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Gestion de Usuarios</h1>
        <p className="text-slate-400 mt-1">Aprueba, suspende o configura el acceso de los usuarios.</p>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Usuario</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Rol</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Estado</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Periodo</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u: User) => {
              const status = (u.status || 'pending') as UserStatus;
              const isEditing = editingUser === u.userId;
              return (
                <tr key={u.userId} className="border-b border-slate-700/50 last:border-0">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-white">{u.name || '-'}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-300 capitalize">{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[status]}`}>
                      {STATUS_LABELS[status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {u.validFrom && <span>Desde: {new Date(u.validFrom).toLocaleDateString('es-ES')}</span>}
                    {u.validFrom && u.validUntil && <br />}
                    {u.validUntil && <span>Hasta: {new Date(u.validUntil).toLocaleDateString('es-ES')}</span>}
                    {!u.validFrom && !u.validUntil && <span className="text-slate-500">Sin periodo</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.role === 'admin' ? (
                      <span className="text-xs text-slate-500">Admin</span>
                    ) : isEditing ? (
                      <div className="flex flex-col gap-2 items-end">
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={validFrom}
                            onChange={(e) => setValidFrom(e.target.value)}
                            className="bg-slate-700 text-white text-xs rounded px-2 py-1 border border-slate-600"
                          />
                          <input
                            type="date"
                            value={validUntil}
                            onChange={(e) => setValidUntil(e.target.value)}
                            className="bg-slate-700 text-white text-xs rounded px-2 py-1 border border-slate-600"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(u.userId, 'active', validFrom, validUntil)}
                            disabled={updating}
                          >
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingUser(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        {status === 'pending' && (
                          <Button size="sm" onClick={() => { setEditingUser(u.userId); setValidFrom(''); setValidUntil(''); }}>
                            Aprobar
                          </Button>
                        )}
                        {status === 'active' && (
                          <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(u.userId, 'suspended')}>
                            Suspender
                          </Button>
                        )}
                        {(status === 'suspended' || status === 'expired') && (
                          <Button size="sm" onClick={() => { setEditingUser(u.userId); setValidFrom(''); setValidUntil(''); }}>
                            Reactivar
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="text-center py-8 text-slate-400">No hay usuarios registrados.</p>
        )}
      </div>
    </div>
  );
}
