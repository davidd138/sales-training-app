'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@/hooks/useGraphQL';
import { GET_ANALYTICS, LIST_CONVERSATIONS, LIST_ALL_USERS } from '@/lib/graphql/queries';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { StatsCard } from '@/components/ui/StatsCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Analytics, User } from '@/types';
import { ACHIEVEMENTS, getUnlockedAchievements } from '@/lib/achievements';
import type { AchievementStats } from '@/lib/achievements';
import { useToast } from '@/components/ui/Toast';

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function scoreGradient(score: number): 'emerald' | 'amber' | 'blue' {
  if (score >= 80) return 'emerald';
  if (score >= 60) return 'amber';
  return 'blue';
}

const DAILY_TIPS = [
  'El 80% de las ventas requieren 5 seguimientos. La mayoria de los comerciales abandonan despues del primero.',
  'Los mejores vendedores escuchan el 70% del tiempo y hablan solo el 30%.',
  'Cada objecion es una oportunidad disfrazada. El cliente que objeta esta interesado.',
  'Las preguntas de Implicacion (SPIN) son las que mas impacto tienen en el cierre.',
  'Un "no" de hoy puede ser un "si" manana. El timing lo es todo en ventas.',
  'Los clientes compran soluciones a sus problemas, no productos ni servicios.',
  'La confianza se construye con consistencia, no con un unico gesto grande.',
  'Personaliza cada interaccion. Los clientes notan cuando les tratas como un numero mas.',
  'El silencio es una herramienta poderosa. No temas las pausas tras una pregunta importante.',
  'Prepara cada llamada: investiga al cliente, su sector y sus posibles necesidades.',
  'Las historias venden mas que los datos. Usa casos de exito para ilustrar el valor.',
  'El mejor momento para pedir una referencia es justo despues de entregar valor.',
  'No vendas caracteristicas, vende la transformacion que el cliente experimentara.',
  'La urgencia real funciona mejor que la urgencia artificial. Encuentra el motivo genuino.',
  'Dominar la escucha activa te diferencia del 90% de los comerciales.',
  'Las primeras impresiones se forman en 7 segundos. Cuida tu apertura.',
  'Haz preguntas abiertas para descubrir necesidades ocultas del cliente.',
  'El seguimiento puntual demuestra profesionalidad y compromiso.',
  'Adapta tu estilo de comunicacion al perfil de tu interlocutor.',
  'Celebra los pequenos avances. Cada conversacion es una oportunidad de aprendizaje.',
  'Un buen CRM es tu mejor aliado. Registra cada interaccion sin excepcion.',
  'La venta consultiva genera relaciones a largo plazo, no solo transacciones.',
  'Conoce a tu competencia, pero enfocate en tu propuesta de valor unica.',
  'El rechazo no es personal. Cada "no" te acerca al siguiente "si".',
  'Practica tu pitch hasta que suene natural, no ensayado.',
  'Los compradores B2B valoran a los vendedores que entienden su negocio.',
  'Establece expectativas claras desde el principio para evitar sorpresas.',
  'La empatia genuina no se puede fingir. Interesate de verdad por tu cliente.',
  'Mide tus resultados semanalmente y ajusta tu estrategia segun los datos.',
  'El networking es una inversion a largo plazo. Cultiva relaciones sin esperar retorno inmediato.',
  'Termina cada llamada con un siguiente paso concreto acordado con el cliente.',
];

const WEEKLY_CHALLENGES = [
  { goal: 'Consigue una puntuacion mayor de 75 en Descubrimiento', category: 'discovery', target: 75 },
  { goal: 'Practica con un escenario de dificultad Experto', category: 'difficulty', target: 'hard' },
  { goal: 'Consigue que tu ratio de habla sea menor del 35%', category: 'talkRatio', target: 35 },
  { goal: 'Completa 3 sesiones esta semana', category: 'sessions', target: 3 },
  { goal: 'Intenta usar preguntas de Implicacion (SPIN) en cada sesion', category: 'spin', target: 0 },
  { goal: 'Consigue una puntuacion general mayor de 70', category: 'overall', target: 70 },
  { goal: 'Practica con 2 industrias diferentes esta semana', category: 'industries', target: 2 },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
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

  const achievementStats = useMemo<AchievementStats | null>(() => {
    if (!a) return null;
    const scores = a.recentScores || [];
    const bestScore = scores.length > 0 ? Math.max(...scores.map(s => s.overallScore)) : 0;
    const scenariosPlayed = new Set(scores.map(s => s.scenarioName)).size;

    // Calculate consecutive days from recent scores dates
    let consecutiveDays = 0;
    if (scores.length > 0) {
      const uniqueDates = [...new Set(scores.map(s => s.date.split('T')[0]))].sort().reverse();
      consecutiveDays = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prev = new Date(uniqueDates[i - 1]);
        const curr = new Date(uniqueDates[i]);
        const diffMs = prev.getTime() - curr.getTime();
        if (diffMs <= 86400000 * 1.5) {
          consecutiveDays++;
        } else {
          break;
        }
      }
    }

    // Heuristic for difficulties played based on session count
    const difficulties: string[] = [];
    if (a.totalSessions >= 1) difficulties.push('facil');
    if (a.totalSessions >= 3) difficulties.push('intermedio');
    if (a.totalSessions >= 6) difficulties.push('dificil');

    return {
      totalSessions: a.totalSessions,
      bestScore,
      avgScore: a.avgOverallScore,
      difficultiesPlayed: difficulties,
      consecutiveDays,
      scenariosPlayed,
    };
  }, [a]);

  const unlockedAchievements = useMemo(() => {
    if (!achievementStats) return [];
    return getUnlockedAchievements(achievementStats);
  }, [achievementStats]);

  const unlockedIds = useMemo(() => new Set(unlockedAchievements.map(ua => ua.id)), [unlockedAchievements]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400 mb-1">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Hola, {user?.name || user?.email?.split('@')[0]}
          </h1>
          <p className="text-slate-400 mt-1">
            {isAdmin ? 'Panel de administracion — SalesPulse AI' : 'Bienvenido a SalesPulse AI'}
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => router.push('/scenarios')}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0 shadow-lg shadow-blue-500/20"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
            </svg>
            Empezar entrenamiento
          </span>
        </Button>
      </div>

      {/* Admin alert */}
      {isAdmin && pendingCount > 0 && (
        <div
          className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:from-amber-500/15 hover:to-orange-500/15 transition-all"
          onClick={() => router.push('/admin/users')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse-soft">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="text-amber-400 font-medium">{pendingCount} usuario{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}</p>
              <p className="text-amber-400/60 text-sm">Requieren aprobacion para acceder</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </div>
      )}

      {/* Welcome banner for new users */}
      {!isAdmin && a && a.totalSessions === 0 && user?.status === 'active' && (
        <div className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 border border-blue-500/20 rounded-xl p-5 animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Bienvenido a SalesPulse AI</h2>
              <p className="text-slate-400 text-sm mt-1">Tu cuenta ha sido aprobada. Empieza tu primer entrenamiento y descubre como la IA puede ayudarte a mejorar tus ventas.</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          label="Sesiones totales"
          value={a?.totalSessions ?? '—'}
          gradient="blue"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
          }
        />
        <StatsCard
          label="Puntuacion media"
          value={a ? Math.round(a.avgOverallScore) : '—'}
          gradient={a ? scoreGradient(a.avgOverallScore) : 'blue'}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          }
        />
        <StatsCard
          label="Percentil"
          value={a?.percentile != null ? `Top ${Math.round(a.percentile)}%` : '—'}
          gradient="purple"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.016 6.016 0 01-4.27 1.772 6.016 6.016 0 01-4.27-1.772" />
            </svg>
          }
        />
      </div>

      {/* Achievements / Logros */}
      {a && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Logros</h2>
            <span className="text-sm text-slate-400">
              {unlockedAchievements.length} de {ACHIEVEMENTS.length} logros desbloqueados
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {ACHIEVEMENTS.map((achievement) => {
              const unlocked = unlockedIds.has(achievement.id);
              return (
                <div
                  key={achievement.id}
                  className={`relative group rounded-xl p-4 text-center transition-all ${
                    unlocked
                      ? 'bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-blue-500/30 shadow-lg shadow-blue-500/5'
                      : 'bg-slate-800/30 border border-slate-700/30 opacity-40'
                  }`}
                >
                  {unlocked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard?.writeText(`He desbloqueado el logro "${achievement.title}" en SalesPulse AI! ${achievement.description}`);
                        addToast('Logro copiado al portapapeles', 'info');
                      }}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-700/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Compartir logro"
                    >
                      <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                      </svg>
                    </button>
                  )}
                  <div className="text-3xl mb-2">
                    {unlocked ? achievement.icon : '🔒'}
                  </div>
                  <p className={`text-sm font-semibold ${unlocked ? 'text-white' : 'text-slate-500'}`}>
                    {achievement.title}
                  </p>
                  <p className={`text-xs mt-1 ${unlocked ? 'text-slate-400' : 'text-slate-600'}`}>
                    {achievement.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Category breakdown */}
      {a && a.totalSessions > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Rendimiento por categoria</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { key: 'avgRapport', label: 'Rapport', weight: '15%' },
              { key: 'avgDiscovery', label: 'Descubrimiento', weight: '25%' },
              { key: 'avgPresentation', label: 'Presentacion', weight: '20%' },
              { key: 'avgObjectionHandling', label: 'Objeciones', weight: '20%' },
              { key: 'avgClosing', label: 'Cierre', weight: '10%' },
              { key: 'avgCommunication', label: 'Comunicacion', weight: '10%' },
            ].map(cat => {
              const score = Math.round((a as any)[cat.key] || 0);
              return (
                <div key={cat.key} className="text-center p-3 rounded-lg bg-slate-700/30 border border-slate-700/50">
                  <p className={`text-2xl font-bold ${scoreColor(score)}`}>{score || '—'}</p>
                  <p className="text-xs text-slate-400 mt-1">{cat.label}</p>
                  <p className="text-[10px] text-slate-500">{cat.weight}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Skill profile */}
      {a && a.totalSessions > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-white mb-1">Tu perfil de ventas</h2>
          <p className="text-xs text-slate-500 mb-4">Basado en {a.totalSessions} sesiones</p>
          <div className="space-y-3">
            {[
              { key: 'avgRapport', label: 'Rapport', icon: '🤝' },
              { key: 'avgDiscovery', label: 'Descubrimiento SPIN', icon: '🔍' },
              { key: 'avgPresentation', label: 'Propuesta de valor', icon: '💡' },
              { key: 'avgObjectionHandling', label: 'Objeciones', icon: '🛡' },
              { key: 'avgClosing', label: 'Cierre', icon: '🎯' },
              { key: 'avgCommunication', label: 'Comunicacion', icon: '🗣' },
            ].map(cat => {
              const score = Math.round((a as any)[cat.key] || 0);
              const teamScore = Math.round((a as any)[cat.key.replace('avg', 'teamAvg')] || 0);
              return (
                <div key={cat.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-300 flex items-center gap-1.5">
                      <span className="text-xs">{cat.icon}</span>
                      {cat.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{score}</span>
                      <span className="text-[10px] text-slate-500">vs {teamScore} equipo</span>
                    </div>
                  </div>
                  <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className={`absolute inset-y-0 left-0 rounded-full ${score >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : score >= 60 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-red-500 to-red-400'}`} style={{ width: `${score}%` }} />
                    {teamScore > 0 && (
                      <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400/50" style={{ left: `${teamScore}%` }} title={`Equipo: ${teamScore}`} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Admin quick actions */}
      {isAdmin && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/admin/users', label: 'Usuarios', icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z', color: 'amber' },
            { href: '/admin/scenarios', label: 'Escenarios', icon: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z', color: 'blue' },
            { href: '/admin/guidelines', label: 'Criterios', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'cyan' },
            { href: '/admin/analytics', label: 'Rendimiento', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z', color: 'emerald' },
          ].map(item => (
            <Card key={item.href} onClick={() => router.push(item.href)} className="text-center group">
              <svg className={`w-6 h-6 mx-auto mb-2 text-${item.color}-400 group-hover:scale-110 transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <p className="text-sm text-slate-300 font-medium">{item.label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Quick start guide for new users */}
      {a && a.totalSessions === 0 && !isAdmin && (
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl border border-blue-500/20 p-6 animate-slide-up">
          <h2 className="text-lg font-semibold text-white mb-3">Como funciona SalesPulse AI</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Elige un escenario', desc: 'Selecciona un cliente virtual con diferente nivel de dificultad', icon: 'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z' },
              { step: '2', title: 'Practica la llamada', desc: 'Habla con el cliente IA que reacciona como una persona real', icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z' },
              { step: '3', title: 'Recibe feedback', desc: 'Un coach IA analiza tu conversacion con metodologia SPIN y Challenger', icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z' },
            ].map(({ step, title, desc, icon }) => (
              <div key={step} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0 text-white text-sm font-bold">
                  {step}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{title}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Sesiones recientes</h2>
          <button onClick={() => router.push('/history')} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            Ver todas
          </button>
        </div>
        {conversations.loading && !conversations.data ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonLoader key={i} variant="card" />
            ))}
          </div>
        ) : conversations.data?.items.length === 0 ? (
          <EmptyState
            title="Sin sesiones todavia"
            description="Empieza tu primer entrenamiento para ver tus resultados aqui"
            action={{ label: 'Empezar ahora', onClick: () => router.push('/scenarios') }}
          />
        ) : (
          <div className="space-y-2">
            {conversations.data?.items.map((c: any) => (
              <Card key={c.id} onClick={() => router.push(`/analysis?id=${c.id}`)} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium group-hover:text-blue-400 transition-colors">{c.scenarioName || c.clientName}</p>
                    <p className="text-slate-500 text-sm">{new Date(c.startedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {c.duration && <span className="text-slate-500 text-sm hidden sm:block">{Math.floor(c.duration / 60)}:{String(c.duration % 60).padStart(2, '0')}</span>}
                  <Badge value={c.status} />
                  <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* Tip del dia */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Tip del dia</p>
          <p className="text-sm text-slate-300">{DAILY_TIPS[new Date().getDate() % DAILY_TIPS.length]}</p>
        </div>
      </div>
      {/* Reto semanal */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-lg">🏋</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">Reto semanal</p>
          <p className="text-sm text-slate-300">{WEEKLY_CHALLENGES[Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % WEEKLY_CHALLENGES.length].goal}</p>
        </div>
      </div>
    </div>
  );
}
