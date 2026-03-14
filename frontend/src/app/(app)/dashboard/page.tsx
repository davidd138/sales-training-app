'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@/hooks/useGraphQL';
import { GET_ANALYTICS, LIST_CONVERSATIONS, LIST_ALL_USERS } from '@/lib/graphql/queries';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { Analytics, User } from '@/types';

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === 'admin' || (user?.groups && user.groups.includes('admins'));
  const analytics = useQuery<Analytics>(GET_ANALYTICS);
  const conversations = useQuery<{ items: any[]; nextToken: string | null }>(LIST_CONVERSATIONS);
  const allUsers = useQuery<{ items: User[] }>(LIST_ALL_USERS);

  useEffect(() => {
    analytics.execute().catch(() => {});
    conversations.execute({ limit: 5 }).catch(() => {});
    if (isAdmin) allUsers.execute().catch(() => {});
  }, []);

  const a = analytics.data;
  const pendingCount = (allUsers.data as any)?.items?.filter((u: User) => (u.status || 'pending') === 'pending' && u.role !== 'admin').length || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Hola, {user?.name || user?.email?.split('@')[0]}
        </h1>
        <p className="text-slate-400 mt-1">
          {isAdmin ? 'Panel de administracion' : 'Bienvenido a tu plataforma de entrenamiento'}
        </p>
      </div>

      {/* Admin alert for pending users */}
      {isAdmin && pendingCount > 0 && (
        <div
          className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-amber-500/15 transition-colors"
          onClick={() => router.push('/admin/users')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="text-amber-400 font-medium">{pendingCount} usuario{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''} de aprobacion</p>
              <p className="text-amber-400/60 text-sm">Haz clic para gestionar usuarios</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-slate-400 text-sm">Sesiones totales</p>
          <p className="text-3xl font-bold text-white mt-1">{a?.totalSessions ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-slate-400 text-sm">Puntuacion media</p>
          <p className={`text-3xl font-bold mt-1 ${a ? scoreColor(a.avgOverallScore) : 'text-white'}`}>
            {a ? Math.round(a.avgOverallScore) : '—'}
          </p>
        </Card>
        <Card>
          <p className="text-slate-400 text-sm">Percentil</p>
          <p className="text-3xl font-bold text-primary mt-1">
            {a?.percentile != null ? `Top ${Math.round(a.percentile)}%` : '—'}
          </p>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Button size="lg" onClick={() => router.push('/scenarios')}>
          Empezar entrenamiento
        </Button>
        {isAdmin && (
          <Button size="lg" variant="secondary" onClick={() => router.push('/admin/users')}>
            Gestionar usuarios
          </Button>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Sesiones recientes</h2>
        {conversations.loading && !conversations.data ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : conversations.data?.items.length === 0 ? (
          <Card><p className="text-slate-400 text-center">No tienes sesiones todavia. Empieza tu primer entrenamiento!</p></Card>
        ) : (
          <div className="space-y-2">
            {conversations.data?.items.map((c: any) => (
              <Card key={c.id} onClick={() => router.push(`/analysis?id=${c.id}`)} className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{c.scenarioName || c.clientName}</p>
                  <p className="text-slate-400 text-sm">{new Date(c.startedAt).toLocaleDateString('es-ES')}</p>
                </div>
                <div className="flex items-center gap-3">
                  {c.duration && <span className="text-slate-400 text-sm">{Math.floor(c.duration / 60)}:{String(c.duration % 60).padStart(2, '0')}</span>}
                  <Badge value={c.status} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
