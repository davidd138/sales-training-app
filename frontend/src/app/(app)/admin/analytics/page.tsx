'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/layout/AdminGuard';
import { useQuery } from '@/hooks/useGraphQL';
import { GET_LEADERBOARD, LIST_ALL_USERS } from '@/lib/graphql/queries';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { StatsCard } from '@/components/ui/StatsCard';
import { EmptyState } from '@/components/ui/EmptyState';
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
  if (loading && !leaderboard) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const entries = leaderboard?.entries || [];
  const users = (usersData as any)?.items || [];
  const activeUsers = users.filter((u: User) => u.status === 'active' && u.role !== 'admin').length;
  const pendingUsers = users.filter((u: User) => u.status === 'pending').length;
  const totalSessions = entries.reduce((sum: number, e: LeaderboardEntry) => sum + e.totalSessions, 0);
  const avgScore = entries.length > 0 ? Math.round(entries.reduce((sum: number, e: LeaderboardEntry) => sum + e.avgScore, 0) / entries.length) : 0;
  const bestScore = entries.length > 0 ? Math.max(...entries.map((e: LeaderboardEntry) => e.avgScore)) : 0;

  const summary = useMemo(() => {
    if (entries.length === 0) return null;
    const bestEntry = entries.reduce((best, e) => e.avgScore > best.avgScore ? e : best, entries[0]);
    const mostActiveEntry = entries.reduce((best, e) => e.totalSessions > best.totalSessions ? e : best, entries[0]);
    return {
      totalUsers: entries.length,
      avgScore,
      bestPerformer: bestEntry,
      mostActive: mostActiveEntry,
    };
  }, [entries, avgScore]);

  const maxScore = useMemo(() => {
    if (entries.length === 0) return 100;
    return Math.max(...entries.map(e => e.avgScore), 1);
  }, [entries]);

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
          Rendimiento Global
        </span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          Rendimiento Global
        </h1>
        <p className="text-slate-400 mt-2">Vista general del rendimiento de todos los usuarios.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatsCard
          label="Usuarios Activos"
          value={activeUsers}
          gradient="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
        <StatsCard
          label="Pendientes"
          value={pendingUsers}
          gradient="amber"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          label="Sesiones Totales"
          value={totalSessions}
          gradient="blue"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          }
        />
        <StatsCard
          label="Puntuacion Media"
          value={avgScore}
          gradient="purple"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
        />
        <StatsCard
          label="Mejor Puntuacion"
          value={bestScore}
          gradient="amber"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          }
        />
      </div>

      {/* Summary Highlights */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="!p-4 border-l-4 border-l-blue-500">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Usuarios en Ranking</p>
            <p className="text-2xl font-bold text-white">{summary.totalUsers}</p>
          </Card>
          <Card className="!p-4 border-l-4 border-l-purple-500">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Puntuacion Promedio Global</p>
            <p className="text-2xl font-bold text-white">{summary.avgScore}<span className="text-sm text-slate-400 ml-1">/ 100</span></p>
          </Card>
          <Card className="!p-4 border-l-4 border-l-emerald-500">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Mejor Rendimiento</p>
            <p className="text-lg font-bold text-white truncate">{summary.bestPerformer.name || summary.bestPerformer.email}</p>
            <p className="text-sm text-emerald-400 font-semibold">{summary.bestPerformer.avgScore} puntos</p>
          </Card>
          <Card className="!p-4 border-l-4 border-l-amber-500">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Mas Activo</p>
            <p className="text-lg font-bold text-white truncate">{summary.mostActive.name || summary.mostActive.email}</p>
            <p className="text-sm text-amber-400 font-semibold">{summary.mostActive.totalSessions} sesiones</p>
          </Card>
        </div>
      )}

      {/* Bar Chart Visualization */}
      {entries.length > 0 && (
        <Card className="!p-0 overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-slate-700/50 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              Puntuaciones por Usuario
            </h2>
          </div>
          <div className="p-5 space-y-3">
            {entries.slice(0, 10).map((e: LeaderboardEntry, i: number) => {
              const barWidth = maxScore > 0 ? (e.avgScore / maxScore) * 100 : 0;
              const isTop3 = i < 3;
              const medalColors = ['from-amber-400 to-yellow-500', 'from-slate-300 to-slate-400', 'from-amber-600 to-orange-700'];
              const barGradient = e.avgScore >= 80
                ? 'from-emerald-500 to-green-400'
                : e.avgScore >= 60
                ? 'from-amber-500 to-orange-400'
                : 'from-red-500 to-rose-400';
              const scoreColor = e.avgScore >= 80
                ? 'text-emerald-400'
                : e.avgScore >= 60
                ? 'text-amber-400'
                : 'text-red-400';

              return (
                <div key={e.userId} className="group">
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className="w-7 shrink-0 text-center">
                      {isTop3 ? (
                        <div className={`w-6 h-6 mx-auto rounded-full bg-gradient-to-br ${medalColors[i]} flex items-center justify-center text-[10px] font-bold text-white shadow-lg`}>
                          {i + 1}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">{i + 1}</span>
                      )}
                    </div>

                    {/* Name */}
                    <div className="w-28 sm:w-36 md:w-44 shrink-0 truncate">
                      <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                        {e.name || e.email || '-'}
                      </span>
                    </div>

                    {/* Bar */}
                    <div className="flex-1 h-7 bg-slate-700/40 rounded-md overflow-hidden relative">
                      <div
                        className={`h-full rounded-md bg-gradient-to-r ${barGradient} transition-all duration-700 ease-out relative`}
                        style={{ width: `${barWidth}%`, minWidth: barWidth > 0 ? '2rem' : '0' }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-white/5 rounded-md" />
                      </div>
                    </div>

                    {/* Score */}
                    <div className={`w-12 text-right shrink-0 text-sm font-bold ${scoreColor}`}>
                      {e.avgScore}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {entries.length > 10 && (
            <div className="px-5 pb-4">
              <p className="text-xs text-slate-500 text-center">Mostrando los 10 mejores de {entries.length} usuarios</p>
            </div>
          )}
        </Card>
      )}

      {/* Desktop Ranking Table */}
      <div className="hidden md:block">
        <Card className="overflow-hidden !p-0">
          <div className="px-5 py-4 border-b border-slate-700/50 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.704 6.023 6.023 0 01-2.77-.704" />
              </svg>
              Ranking de Usuarios — Detalle
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-12">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Usuario</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Sesiones</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Puntuacion Media</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e: LeaderboardEntry, i: number) => {
                  const isTop3 = i < 3;
                  const medalColors = ['from-amber-400 to-yellow-500', 'from-slate-300 to-slate-400', 'from-amber-600 to-orange-700'];
                  return (
                    <tr key={e.userId} className="border-b border-slate-700/30 last:border-0 hover:bg-slate-700/20 transition-colors">
                      <td className="px-5 py-4">
                        {isTop3 ? (
                          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${medalColors[i]} flex items-center justify-center text-xs font-bold text-white shadow-lg`}>
                            {i + 1}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500 pl-1.5">{i + 1}</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                            isTop3
                              ? `bg-gradient-to-br ${medalColors[i]} text-white`
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {(e.name || e.email || '?')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{e.name || '-'}</p>
                            <p className="text-xs text-slate-400 truncate">{e.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-300">{e.totalSessions}</span>
                          <span className="text-xs text-slate-500">sesiones</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2.5 bg-slate-700 rounded-full max-w-[120px] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                e.avgScore >= 80
                                  ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                                  : e.avgScore >= 60
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                                  : 'bg-gradient-to-r from-red-500 to-rose-400'
                              }`}
                              style={{ width: `${e.avgScore}%` }}
                            />
                          </div>
                          <span className={`text-sm font-bold min-w-[2.5rem] ${
                            e.avgScore >= 80
                              ? 'text-emerald-400'
                              : e.avgScore >= 60
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }`}>
                            {e.avgScore}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {entries.length === 0 && (
            <EmptyState
              title="Sin datos de rendimiento"
              description="Los datos apareceran aqui cuando los usuarios completen sesiones de entrenamiento."
            />
          )}
        </Card>
      </div>

      {/* Mobile User Cards */}
      <div className="md:hidden space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.704 6.023 6.023 0 01-2.77-.704" />
          </svg>
          Ranking de Usuarios — Detalle
        </h2>
        {entries.map((e: LeaderboardEntry, i: number) => {
          const isTop3 = i < 3;
          const medalColors = ['from-amber-400 to-yellow-500', 'from-slate-300 to-slate-400', 'from-amber-600 to-orange-700'];
          return (
            <Card key={e.userId} className="!p-4">
              <div className="flex items-center gap-3 mb-3">
                {isTop3 ? (
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${medalColors[i]} flex items-center justify-center text-xs font-bold text-white shadow-lg shrink-0`}>
                    {i + 1}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-400 shrink-0">
                    {i + 1}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{e.name || '-'}</p>
                  <p className="text-xs text-slate-400 truncate">{e.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-700/30 rounded-lg p-2.5 text-center">
                  <p className="text-xs text-slate-400 mb-0.5">Sesiones</p>
                  <p className="text-lg font-bold text-white">{e.totalSessions}</p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-2.5 text-center">
                  <p className="text-xs text-slate-400 mb-0.5">Puntuacion</p>
                  <p className={`text-lg font-bold ${
                    e.avgScore >= 80
                      ? 'text-emerald-400'
                      : e.avgScore >= 60
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}>
                    {e.avgScore}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      e.avgScore >= 80
                        ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                        : e.avgScore >= 60
                        ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                        : 'bg-gradient-to-r from-red-500 to-rose-400'
                    }`}
                    style={{ width: `${e.avgScore}%` }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
        {entries.length === 0 && (
          <EmptyState
            title="Sin datos de rendimiento"
            description="Los datos apareceran aqui cuando los usuarios completen sesiones de entrenamiento."
          />
        )}
      </div>
    </div>
  );
}
