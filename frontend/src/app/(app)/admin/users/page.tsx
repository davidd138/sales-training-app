'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/layout/AdminGuard';
import { useQuery, useMutation } from '@/hooks/useGraphQL';
import { LIST_ALL_USERS } from '@/lib/graphql/queries';
import { UPDATE_USER_STATUS } from '@/lib/graphql/mutations';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatsCard } from '@/components/ui/StatsCard';
import type { User, UserStatus } from '@/types';

const STATUS_COLORS: Record<UserStatus, string> = {
  pending: 'from-amber-500 to-orange-500',
  active: 'from-emerald-500 to-green-500',
  suspended: 'from-red-500 to-rose-500',
  expired: 'from-slate-500 to-slate-600',
};

const STATUS_BG: Record<UserStatus, string> = {
  pending: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30',
  active: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border border-emerald-500/30',
  suspended: 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border border-red-500/30',
  expired: 'bg-gradient-to-r from-slate-500/20 to-slate-600/20 text-slate-400 border border-slate-500/30',
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

  if (loading && !users) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <Card className="border-red-500/30 bg-red-500/10">
          <p className="text-red-400 text-sm">Error al cargar usuarios: {error}</p>
        </Card>
      </div>
    );
  }

  const items: User[] = (users as any)?.items || users || [];
  const activeCount = items.filter(u => u.status === 'active').length;
  const pendingCount = items.filter(u => u.status === 'pending').length;
  const suspendedCount = items.filter(u => u.status === 'suspended').length;

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6">
        <Link href="/admin" className="text-slate-400 hover:text-amber-400 transition-colors">
          Admin
        </Link>
        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent font-medium">
          Usuarios
        </span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          Gestion de Usuarios
        </h1>
        <p className="text-slate-400 mt-2">Aprueba, suspende o configura el acceso de los usuarios.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatsCard
          label="Total Usuarios"
          value={items.length}
          gradient="amber"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
        <StatsCard
          label="Activos"
          value={activeCount}
          gradient="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          label="Pendientes"
          value={pendingCount}
          gradient="amber"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          label="Suspendidos"
          value={suspendedCount}
          gradient="purple"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          }
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block">
        <Card className="overflow-hidden !p-0">
          <div className="px-5 py-4 border-b border-slate-700/50 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
            <h2 className="text-sm font-semibold text-white">Listado de Usuarios</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Usuario</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Rol</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Periodo</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u: User) => {
                const status = (u.status || 'pending') as UserStatus;
                const isEditing = editingUser === u.userId;
                return (
                  <tr key={u.userId} className="border-b border-slate-700/30 last:border-0 hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${STATUS_COLORS[status]} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                          {(u.name || u.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{u.name || '-'}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-300 capitalize">{u.role === 'admin' ? 'Administrador' : 'Usuario'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_BG[status]}`}>
                        {STATUS_LABELS[status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      {u.validFrom && <span>Desde: {new Date(u.validFrom).toLocaleDateString('es-ES')}</span>}
                      {u.validFrom && u.validUntil && <br />}
                      {u.validUntil && <span>Hasta: {new Date(u.validUntil).toLocaleDateString('es-ES')}</span>}
                      {!u.validFrom && !u.validUntil && <span className="text-slate-500 italic">Sin periodo</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <UserActions
                        user={u}
                        status={status}
                        isEditing={isEditing}
                        updating={updating}
                        validFrom={validFrom}
                        validUntil={validUntil}
                        setValidFrom={setValidFrom}
                        setValidUntil={setValidUntil}
                        setEditingUser={setEditingUser}
                        handleUpdateStatus={handleUpdateStatus}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {items.length === 0 && (
            <EmptyState
              title="Sin usuarios registrados"
              description="Los usuarios apareceran aqui cuando se registren en la plataforma."
            />
          )}
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {items.map((u: User) => {
          const status = (u.status || 'pending') as UserStatus;
          const isEditing = editingUser === u.userId;
          return (
            <Card key={u.userId} className="!p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${STATUS_COLORS[status]} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                    {(u.name || u.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{u.name || '-'}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_BG[status]}`}>
                  {STATUS_LABELS[status]}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 mb-3 pl-[52px]">
                <span className="capitalize">{u.role === 'admin' ? 'Administrador' : 'Usuario'}</span>
                {u.validFrom && (
                  <>
                    <span className="text-slate-600">|</span>
                    <span>Desde: {new Date(u.validFrom).toLocaleDateString('es-ES')}</span>
                  </>
                )}
                {u.validUntil && (
                  <>
                    <span className="text-slate-600">|</span>
                    <span>Hasta: {new Date(u.validUntil).toLocaleDateString('es-ES')}</span>
                  </>
                )}
              </div>

              <div className="pl-[52px]">
                <UserActions
                  user={u}
                  status={status}
                  isEditing={isEditing}
                  updating={updating}
                  validFrom={validFrom}
                  validUntil={validUntil}
                  setValidFrom={setValidFrom}
                  setValidUntil={setValidUntil}
                  setEditingUser={setEditingUser}
                  handleUpdateStatus={handleUpdateStatus}
                />
              </div>
            </Card>
          );
        })}
        {items.length === 0 && (
          <EmptyState
            title="Sin usuarios registrados"
            description="Los usuarios apareceran aqui cuando se registren en la plataforma."
          />
        )}
      </div>
    </div>
  );
}

function UserActions({
  user: u,
  status,
  isEditing,
  updating,
  validFrom,
  validUntil,
  setValidFrom,
  setValidUntil,
  setEditingUser,
  handleUpdateStatus,
}: {
  user: User;
  status: UserStatus;
  isEditing: boolean;
  updating: boolean;
  validFrom: string;
  validUntil: string;
  setValidFrom: (v: string) => void;
  setValidUntil: (v: string) => void;
  setEditingUser: (v: string | null) => void;
  handleUpdateStatus: (userId: string, status: UserStatus, from?: string, until?: string) => void;
}) {
  if (u.role === 'admin') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30">
        Admin
      </span>
    );
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-3 items-end">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Desde</label>
            <input
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              className="bg-slate-700/80 text-white text-xs rounded-lg px-3 py-2 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all w-full"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Hasta</label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="bg-slate-700/80 text-white text-xs rounded-lg px-3 py-2 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all w-full"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="!bg-gradient-to-r !from-amber-500 !to-orange-500 hover:!from-amber-600 hover:!to-orange-600"
            onClick={() => handleUpdateStatus(u.userId, 'active', validFrom, validUntil)}
            disabled={updating}
          >
            Confirmar
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
    );
  }

  return (
    <div className="flex gap-2 justify-end flex-wrap">
      {status === 'pending' && (
        <Button
          size="sm"
          className="!bg-gradient-to-r !from-amber-500 !to-orange-500 hover:!from-amber-600 hover:!to-orange-600"
          onClick={() => { setEditingUser(u.userId); setValidFrom(''); setValidUntil(''); }}
        >
          Aprobar
        </Button>
      )}
      {status === 'active' && (
        <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(u.userId, 'suspended')}>
          Suspender
        </Button>
      )}
      {(status === 'suspended' || status === 'expired') && (
        <Button
          size="sm"
          className="!bg-gradient-to-r !from-amber-500 !to-orange-500 hover:!from-amber-600 hover:!to-orange-600"
          onClick={() => { setEditingUser(u.userId); setValidFrom(''); setValidUntil(''); }}
        >
          Reactivar
        </Button>
      )}
    </div>
  );
}
