'use client';

import { useEffect } from 'react';
import { useQuery } from '@/hooks/useGraphQL';
import { GET_ANALYTICS, GET_LEADERBOARD } from '@/lib/graphql/queries';
import { Spinner } from '@/components/ui/Spinner';
import { StatsCard } from '@/components/ui/StatsCard';
import type { Analytics, LeaderboardEntry } from '@/types';
import { useAuth } from '@/hooks/useAuth';

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function barGradient(isUser: boolean) {
  return isUser
    ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
    : 'bg-gradient-to-r from-slate-600 to-slate-500';
}

const CATEGORIES = [
  { key: 'Rapport', userKey: 'avgRapport', teamKey: 'teamAvgRapport', icon: '🤝' },
  { key: 'Discovery', userKey: 'avgDiscovery', teamKey: 'teamAvgDiscovery', icon: '🔍' },
  { key: 'Presentacion', userKey: 'avgPresentation', teamKey: 'teamAvgPresentation', icon: '💡' },
  { key: 'Objeciones', userKey: 'avgObjectionHandling', teamKey: 'teamAvgObjectionHandling', icon: '🛡' },
  { key: 'Cierre', userKey: 'avgClosing', teamKey: 'teamAvgClosing', icon: '🎯' },
] as const;

const IMPROVEMENT_TIPS: Record<string, string[]> = {
  'Rapport': [
    'Dedica los primeros 2-3 minutos a conectar personalmente antes de hablar de negocios.',
    'Investiga a tu interlocutor en LinkedIn antes de la llamada para encontrar puntos en comun.',
    'Usa el nombre del cliente con frecuencia y muestra interes genuino por su contexto.',
  ],
  'Discovery': [
    'Usa mas preguntas de Implicacion (SPIN) para amplificar el dolor del cliente.',
    'No saltes a la solucion demasiado pronto. Profundiza con "¿Y que impacto tiene eso?".',
    'Prepara al menos 10 preguntas de descubrimiento antes de cada llamada.',
  ],
  'Presentacion': [
    'Estructura tu propuesta con el framework "Problema - Solucion - Beneficio".',
    'Usa historias de clientes similares para hacer tu presentacion mas creible.',
    'Conecta cada caracteristica con un beneficio concreto y cuantificable para el cliente.',
  ],
  'Objeciones': [
    'Usa la tecnica "Siente, Sintio, Descubrio" para empatizar antes de responder.',
    'Nunca contradigas directamente. Valida primero con "Entiendo tu preocupacion...".',
    'Prepara respuestas para las 5 objeciones mas comunes de tu sector.',
  ],
  'Cierre': [
    'Usa cierres de prueba durante la conversacion: "¿Esto resolveria tu problema?".',
    'No tengas miedo de pedir el cierre. Muchas ventas se pierden por no preguntar.',
    'Propone siempre un siguiente paso concreto con fecha y hora.',
  ],
};

function getMedalIcon(position: number) {
  if (position === 0) return <span className="text-lg">🥇</span>;
  if (position === 1) return <span className="text-lg">🥈</span>;
  if (position === 2) return <span className="text-lg">🥉</span>;
  return <span className="text-sm text-slate-500 font-bold w-6 text-center">{position + 1}</span>;
}

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
    return (
      <div className="flex justify-center items-center h-[60vh] animate-fade-in">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-6 lg:px-0 pb-8 animate-fade-in">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Analiticas</h1>
        <p className="text-slate-400 text-sm mt-1">Tu rendimiento y progreso en detalle</p>
      </div>

      {/* Summary stats */}
      {a && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up">
          <StatsCard
            label="Sesiones totales"
            value={a.totalSessions}
            gradient="blue"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            }
          />
          <StatsCard
            label="Puntuacion media"
            value={Math.round(a.avgOverallScore)}
            gradient={a.avgOverallScore >= 80 ? 'emerald' : a.avgOverallScore >= 60 ? 'amber' : 'blue'}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
            }
          />
          <StatsCard
            label="Percentil"
            value={`Top ${Math.round(a.percentile)}%`}
            gradient="purple"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m4.23-9.008h0" />
              </svg>
            }
          />
        </div>
      )}

      {/* Category comparison */}
      {a && (
        <div className="glass rounded-2xl p-5 sm:p-6 animate-slide-up">
          <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
            </svg>
            Tu vs Equipo
          </h2>
          <p className="text-slate-500 text-xs mb-5">Comparativa por categoria de ventas</p>

          <div className="flex items-center gap-4 mb-5 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"></span>
              <span className="text-slate-400">Tu</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-slate-600 to-slate-500"></span>
              <span className="text-slate-400">Equipo</span>
            </span>
          </div>

          <div className="space-y-5">
            {CATEGORIES.map(({ key, userKey, teamKey, icon }) => {
              const userVal = (a as any)[userKey] as number;
              const teamVal = (a as any)[teamKey] as number;
              const diff = userVal - teamVal;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300 flex items-center gap-2">
                      <span>{icon}</span>
                      <span className="font-medium">{key}</span>
                    </span>
                    <span className={`text-xs font-medium ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {diff >= 0 ? '+' : ''}{Math.round(diff)}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-cyan-400 w-14 font-medium">Tu</span>
                      <div className="flex-1 h-3 bg-slate-700/50 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${barGradient(true)}`} style={{ width: `${userVal}%` }} />
                      </div>
                      <span className="text-xs text-cyan-400 w-8 text-right font-bold">{Math.round(userVal)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-14">Equipo</span>
                      <div className="flex-1 h-3 bg-slate-700/50 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${barGradient(false)}`} style={{ width: `${teamVal}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 w-8 text-right font-bold">{Math.round(teamVal)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent scores */}
      {a && a.recentScores.length > 0 && (
        <div className="glass rounded-2xl p-5 sm:p-6 animate-slide-up">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Puntuaciones recientes
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {a.recentScores.map((rs, i) => {
              const circumference = 2 * Math.PI * 18;
              const dashLen = (rs.overallScore / 100) * circumference;
              return (
                <div key={i} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/30 text-center hover:border-cyan-500/20 transition-colors">
                  <div className="relative w-12 h-12 mx-auto mb-2">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-700/50" />
                      <circle
                        cx="20" cy="20" r="18" fill="none"
                        stroke="currentColor" strokeWidth="3"
                        className={scoreColor(rs.overallScore)}
                        strokeDasharray={`${dashLen} ${circumference}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${scoreColor(rs.overallScore)}`}>
                      {Math.round(rs.overallScore)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{rs.scenarioName}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {lb && lb.entries.length > 0 && (
        <div className="glass rounded-2xl p-5 sm:p-6 animate-slide-up">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m4.23-9.008h0" />
            </svg>
            Clasificacion
          </h2>
          <div className="space-y-2">
            {lb.entries.map((entry, i) => {
              const isMe = entry.userId === user?.userId;
              return (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-3 sm:gap-4 p-3 rounded-xl transition-colors ${
                    isMe
                      ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/5 border border-cyan-500/20'
                      : 'bg-slate-800/40 border border-transparent hover:border-slate-700/50'
                  }`}
                >
                  <div className="w-8 flex justify-center shrink-0">
                    {getMedalIcon(i)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isMe ? 'text-cyan-300' : 'text-white'}`}>
                      {entry.name || entry.email}
                      {isMe && <span className="text-xs text-cyan-500 ml-2">(Tu)</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isMe ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-slate-500'}`}
                          style={{ width: `${entry.avgScore}%` }}
                        />
                      </div>
                    </div>
                    <span className={`text-sm font-bold min-w-[2rem] text-right ${scoreColor(entry.avgScore)}`}>
                      {Math.round(entry.avgScore)}
                    </span>
                    <span className="text-xs text-slate-500 min-w-[3rem] text-right hidden sm:block">
                      {entry.totalSessions} ses.
                    </span>
                    <span className="text-[10px] text-slate-600 sm:hidden">
                      {entry.totalSessions}s
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Motivational tips based on weakest category */}
      {a && (() => {
        const scores = CATEGORIES.map(c => ({
          key: c.key,
          value: (a as any)[c.userKey] as number,
          icon: c.icon,
        }));
        const weakest = scores.reduce((min, s) => s.value < min.value ? s : min, scores[0]);
        const tips = IMPROVEMENT_TIPS[weakest.key] || [];
        return (
          <div className="glass rounded-2xl p-5 sm:p-6 animate-slide-up">
            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
              Consejos para mejorar
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              Tu punto mas debil es <span className="text-amber-400 font-semibold">{weakest.icon} {weakest.key}</span> con una puntuacion de <span className="text-amber-400 font-semibold">{Math.round(weakest.value)}</span>. Aqui tienes consejos para mejorar:
            </p>
            <div className="space-y-2 sm:space-y-3">
              {tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5 sm:gap-3 bg-slate-800/40 rounded-xl p-3 sm:p-4 border border-slate-700/30">
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-amber-400 text-xs font-bold">{i + 1}</span>
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
