'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@/hooks/useGraphQL';
import { GET_ANALYTICS, LIST_CONVERSATIONS } from '@/lib/graphql/queries';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { Analytics } from '@/types';

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const analytics = useQuery<Analytics>(GET_ANALYTICS);
  const conversations = useQuery<{ items: any[]; nextToken: string | null }>(LIST_CONVERSATIONS);

  useEffect(() => {
    analytics.execute();
    conversations.execute({ limit: 5 });
  }, []);

  const a = analytics.data;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Hola, {user?.name || user?.email?.split('@')[0]}
        </h1>
        <p className="text-slate-400 mt-1">Bienvenido a tu plataforma de entrenamiento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-slate-400 text-sm">Sesiones totales</p>
          <p className="text-3xl font-bold text-white mt-1">{a?.totalSessions ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-slate-400 text-sm">Puntuación media</p>
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

      <div className="flex items-center justify-between">
        <Button size="lg" onClick={() => router.push('/scenarios')}>
          Empezar entrenamiento
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Sesiones recientes</h2>
        {conversations.loading && !conversations.data ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : conversations.data?.items.length === 0 ? (
          <Card><p className="text-slate-400 text-center">No tienes sesiones todavía. ¡Empieza tu primer entrenamiento!</p></Card>
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
