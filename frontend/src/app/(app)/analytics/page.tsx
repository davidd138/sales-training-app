'use client';

import { useEffect } from 'react';
import { useQuery } from '@/hooks/useGraphQL';
import { GET_ANALYTICS, GET_LEADERBOARD } from '@/lib/graphql/queries';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import type { Analytics, LeaderboardEntry } from '@/types';
import { useAuth } from '@/hooks/useAuth';

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

const CATEGORIES = [
  { key: 'Rapport', userKey: 'avgRapport', teamKey: 'teamAvgRapport' },
  { key: 'Discovery', userKey: 'avgDiscovery', teamKey: 'teamAvgDiscovery' },
  { key: 'Presentación', userKey: 'avgPresentation', teamKey: 'teamAvgPresentation' },
  { key: 'Objeciones', userKey: 'avgObjectionHandling', teamKey: 'teamAvgObjectionHandling' },
  { key: 'Cierre', userKey: 'avgClosing', teamKey: 'teamAvgClosing' },
] as const;

export default function AnalyticsPage() {
  const { user } = useAuth();
  const analytics = useQuery<Analytics>(GET_ANALYTICS);
  const leaderboard = useQuery<{ entries: LeaderboardEntry[] }>(GET_LEADERBOARD);

  useEffect(() => {
    analytics.execute().catch(() => {});
    leaderboard.execute().catch(() => {});
  }, []);

  const a = analytics.data;
  const lb = leaderboard.data;

  if (analytics.loading && !a) {
    return <div className="flex justify-center items-center h-[60vh]"><Spinner /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Analytics</h1>

      {/* Summary stats */}
      {a && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <p className="text-slate-400 text-sm">Sesiones totales</p>
            <p className="text-3xl font-bold text-white mt-1">{a.totalSessions}</p>
          </Card>
          <Card>
            <p className="text-slate-400 text-sm">Puntuación media</p>
            <p className={`text-3xl font-bold mt-1 ${scoreColor(a.avgOverallScore)}`}>{Math.round(a.avgOverallScore)}</p>
          </Card>
          <Card>
            <p className="text-slate-400 text-sm">Percentil</p>
            <p className="text-3xl font-bold text-primary mt-1">Top {Math.round(a.percentile)}%</p>
          </Card>
        </div>
      )}

      {/* Category comparison */}
      {a && (
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Tú vs Equipo</h2>
          <div className="space-y-5">
            {CATEGORIES.map(({ key, userKey, teamKey }) => {
              const userVal = (a as any)[userKey] as number;
              const teamVal = (a as any)[teamKey] as number;
              return (
                <div key={key}>
                  <p className="text-sm text-slate-300 mb-2">{key}</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-primary w-12">Tú</span>
                      <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${userVal}%` }} />
                      </div>
                      <span className="text-xs text-primary w-8 text-right">{Math.round(userVal)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-12">Equipo</span>
                      <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-500 rounded-full" style={{ width: `${teamVal}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 w-8 text-right">{Math.round(teamVal)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Recent scores */}
      {a && a.recentScores.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Puntuaciones recientes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {a.recentScores.map((rs, i) => (
              <div key={i} className="bg-slate-700/50 rounded-lg p-3 text-center">
                <p className={`text-2xl font-bold ${scoreColor(rs.overallScore)}`}>{Math.round(rs.overallScore)}</p>
                <p className="text-xs text-slate-400 mt-1 truncate">{rs.scenarioName}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Leaderboard */}
      {lb && lb.entries.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Leaderboard</h2>
          <div className="overflow-hidden rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-4 py-2 text-xs font-medium text-slate-400 uppercase">#</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-slate-400 uppercase">Nombre</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-slate-400 uppercase">Media</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-slate-400 uppercase">Sesiones</th>
                </tr>
              </thead>
              <tbody>
                {lb.entries.map((entry, i) => (
                  <tr key={entry.userId} className={`border-b border-slate-700/30 ${entry.userId === user?.userId ? 'bg-primary/5' : ''}`}>
                    <td className="px-4 py-2.5">
                      <span className={`text-sm font-bold ${i < 3 ? 'text-amber-400' : 'text-slate-400'}`}>{i + 1}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-sm ${entry.userId === user?.userId ? 'text-primary font-medium' : 'text-white'}`}>
                        {entry.name || entry.email}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-sm font-medium ${scoreColor(entry.avgScore)}`}>{Math.round(entry.avgScore)}</span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-slate-400">{entry.totalSessions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
