'use client';

import { useEffect } from 'react';
import { AdminGuard } from '@/components/layout/AdminGuard';
import { useQuery } from '@/hooks/useGraphQL';
import { GET_LEADERBOARD, LIST_ALL_USERS } from '@/lib/graphql/queries';
import { Spinner } from '@/components/ui/Spinner';
import type { LeaderboardEntry, User } from '@/types';

export default function AdminAnalyticsPage() {
  return (
    <AdminGuard>
      <AnalyticsContent />
    </AdminGuard>
  );
}

function AnalyticsContent() {
  const { data: leaderboard, loading: loadingLb, execute: fetchLeaderboard } = useQuery<{ entries: LeaderboardEntry[] }>(GET_LEADERBOARD);
  const { data: usersData, loading: loadingUsers, execute: fetchUsers } = useQuery(LIST_ALL_USERS);

  useEffect(() => { fetchLeaderboard(); fetchUsers(); }, [fetchLeaderboard, fetchUsers]);

  const loading = loadingLb || loadingUsers;
  if (loading && !leaderboard) return <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>;

  const entries = leaderboard?.entries || [];
  const users = (usersData as any)?.items || [];
  const activeUsers = users.filter((u: User) => u.status === 'active' && u.role !== 'admin').length;
  const pendingUsers = users.filter((u: User) => u.status === 'pending').length;
  const totalSessions = entries.reduce((sum: number, e: LeaderboardEntry) => sum + e.totalSessions, 0);
  const avgScore = entries.length > 0 ? Math.round(entries.reduce((sum: number, e: LeaderboardEntry) => sum + e.avgScore, 0) / entries.length) : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Rendimiento Global</h1>
        <p className="text-slate-400 mt-1">Vista general del rendimiento de todos los usuarios.</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Usuarios Activos', value: activeUsers, color: 'text-green-400' },
          { label: 'Pendientes', value: pendingUsers, color: 'text-amber-400' },
          { label: 'Sesiones Totales', value: totalSessions, color: 'text-blue-400' },
          { label: 'Puntuacion Media', value: avgScore, color: 'text-primary' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <p className="text-xs text-slate-400 uppercase font-semibold">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700">
          <h2 className="text-sm font-semibold text-white">Ranking de Usuarios</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-4 py-2 text-xs font-semibold text-slate-400">#</th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-slate-400">Usuario</th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-slate-400">Sesiones</th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-slate-400">Puntuacion Media</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e: LeaderboardEntry, i: number) => (
              <tr key={e.userId} className="border-b border-slate-700/50 last:border-0">
                <td className="px-4 py-3 text-sm text-slate-400">{i + 1}</td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-white">{e.name || '-'}</p>
                  <p className="text-xs text-slate-400">{e.email}</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-300">{e.totalSessions}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-700 rounded-full max-w-[100px]">
                      <div className="h-2 bg-primary rounded-full" style={{ width: `${e.avgScore}%` }} />
                    </div>
                    <span className="text-sm font-medium text-white">{e.avgScore}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && (
          <p className="text-center py-8 text-slate-400">Aun no hay datos de rendimiento.</p>
        )}
      </div>
    </div>
  );
}
