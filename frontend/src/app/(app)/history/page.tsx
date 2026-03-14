'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@/hooks/useGraphQL';
import { LIST_CONVERSATIONS } from '@/lib/graphql/queries';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBorder(score: number) {
  if (score >= 80) return 'border-emerald-500/30';
  if (score >= 60) return 'border-amber-500/30';
  return 'border-red-500/30';
}

function scoreRingBg(score: number) {
  if (score >= 80) return 'from-emerald-500 to-emerald-400';
  if (score >= 60) return 'from-amber-500 to-amber-400';
  return 'from-red-500 to-red-400';
}

export default function HistoryPage() {
  const router = useRouter();
  const { data, loading, execute } = useQuery<{ items: any[]; nextToken: string | null }>(LIST_CONVERSATIONS);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);

  const loadMore = useCallback(async (token?: string | null) => {
    const result = await execute({ limit: 15, nextToken: token || undefined });
    if (result) {
      setAllItems(prev => token ? [...prev, ...result.items] : result.items);
      setNextToken(result.nextToken);
    }
  }, [execute]);

  useEffect(() => { loadMore().catch(() => {}); }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-0 animate-fade-in">
      {/* Header */}
      <div className="mb-6 animate-slide-up">
        <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Historial de sesiones</h1>
        <p className="text-slate-400 text-sm mt-1">Revisa tus conversaciones anteriores y su analisis</p>
      </div>

      {loading && allItems.length === 0 ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : allItems.length === 0 ? (
        <div className="glass rounded-2xl">
          <EmptyState
            title="Sin sesiones todavia"
            description="Completa tu primera sesion de entrenamiento para ver tu historial aqui."
            action={{ label: 'Iniciar entrenamiento', onClick: () => router.push('/scenarios') }}
          />
        </div>
      ) : (
        <>
          {/* Mobile: Card layout / Desktop: Table */}
          {/* Mobile cards */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {allItems.map((c: any, idx: number) => (
              <div
                key={c.id}
                className="glass rounded-xl p-4 cursor-pointer hover:border-cyan-500/30 transition-all duration-200 animate-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
                onClick={() => router.push(`/analysis?id=${c.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{c.scenarioName || c.clientName}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {new Date(c.startedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <Badge value={c.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">
                    {c.duration ? `${Math.floor(c.duration / 60)}:${String(c.duration % 60).padStart(2, '0')} min` : '--:--'}
                  </span>
                  {c.overallScore != null && (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${scoreRingBg(c.overallScore)}`}
                          style={{ width: `${c.overallScore}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold ${scoreColor(c.overallScore)}`}>{Math.round(c.overallScore)}</span>
                    </div>
                  )}
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block glass rounded-2xl overflow-hidden animate-slide-up">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Escenario</th>
                  <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Duracion</th>
                  <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Puntuacion</th>
                  <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {allItems.map((c: any) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-700/20 hover:bg-slate-700/20 cursor-pointer transition-colors group"
                    onClick={() => router.push(`/analysis?id=${c.id}`)}
                  >
                    <td className="px-5 py-4">
                      <p className="text-white font-medium text-sm group-hover:text-cyan-300 transition-colors">{c.scenarioName || c.clientName}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-sm">
                      {new Date(c.startedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-sm">
                      {c.duration ? `${Math.floor(c.duration / 60)}:${String(c.duration % 60).padStart(2, '0')}` : '--:--'}
                    </td>
                    <td className="px-5 py-4">
                      {c.overallScore != null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${scoreRingBg(c.overallScore)} transition-all`}
                              style={{ width: `${c.overallScore}%` }}
                            />
                          </div>
                          <span className={`text-sm font-bold min-w-[2rem] ${scoreColor(c.overallScore)}`}>{Math.round(c.overallScore)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-sm">--</span>
                      )}
                    </td>
                    <td className="px-5 py-4"><Badge value={c.status} /></td>
                    <td className="px-3 py-4">
                      <svg className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {nextToken && (
            <div className="flex justify-center mt-6">
              <Button variant="secondary" onClick={() => loadMore(nextToken)} loading={loading}>
                Cargar mas sesiones
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
