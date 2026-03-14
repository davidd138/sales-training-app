'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@/hooks/useGraphQL';
import { LIST_CONVERSATIONS } from '@/lib/graphql/queries';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Historial de sesiones</h1>

      {loading && allItems.length === 0 ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : allItems.length === 0 ? (
        <Card><p className="text-slate-400 text-center">No tienes sesiones todavía.</p></Card>
      ) : (
        <>
          <div className="bg-slate-800 rounded-xl border border-slate-700/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Escenario</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Duración</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody>
                {allItems.map((c: any) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-700/30 hover:bg-slate-700/30 cursor-pointer transition-colors"
                    onClick={() => router.push(`/analysis?id=${c.id}`)}
                  >
                    <td className="px-5 py-3">
                      <p className="text-white font-medium text-sm">{c.scenarioName || c.clientName}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-sm">
                      {new Date(c.startedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-sm">
                      {c.duration ? `${Math.floor(c.duration / 60)}:${String(c.duration % 60).padStart(2, '0')}` : '—'}
                    </td>
                    <td className="px-5 py-3"><Badge value={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {nextToken && (
            <div className="flex justify-center mt-4">
              <Button variant="secondary" onClick={() => loadMore(nextToken)} loading={loading}>
                Cargar más
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
