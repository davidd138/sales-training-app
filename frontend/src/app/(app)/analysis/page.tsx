'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@/hooks/useGraphQL';
import { GET_CONVERSATION } from '@/lib/graphql/queries';
import { ANALYZE_CONVERSATION } from '@/lib/graphql/mutations';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { Score, Conversation } from '@/types';

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function scoreGradient(score: number) {
  if (score >= 80) return ['#10B981', '#34D399'];
  if (score >= 60) return ['#F59E0B', '#FBBF24'];
  return ['#EF4444', '#F87171'];
}

function scoreBgBar(score: number) {
  if (score >= 80) return 'bg-gradient-to-r from-emerald-500 to-emerald-400';
  if (score >= 60) return 'bg-gradient-to-r from-amber-500 to-amber-400';
  return 'bg-gradient-to-r from-red-500 to-red-400';
}

const CATEGORIES = [
  { key: 'rapport', label: 'Apertura y Rapport', weight: '15%', icon: '🤝' },
  { key: 'discovery', label: 'Descubrimiento (SPIN)', weight: '25%', icon: '🔍' },
  { key: 'presentation', label: 'Propuesta de Valor', weight: '20%', icon: '💡' },
  { key: 'objectionHandling', label: 'Manejo de Objeciones', weight: '20%', icon: '🛡' },
  { key: 'closing', label: 'Cierre y Proximos Pasos', weight: '10%', icon: '🎯' },
  { key: 'communication', label: 'Comunicacion', weight: '10%', icon: '🗣' },
] as const;

export default function AnalysisPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get('id');
  const { data, loading, execute: loadConversation } = useQuery<{
    conversation: Conversation;
    score: Score | null;
  }>(GET_CONVERSATION);
  const analyzeMutation = useMutation<Score>(ANALYZE_CONVERSATION);
  const [analyzing, setAnalyzing] = useState(false);
  const [score, setScore] = useState<Score | null>(null);

  useEffect(() => {
    if (!conversationId) { router.replace('/history'); return; }
    loadConversation({ id: conversationId }).then(result => {
      if (result?.score) setScore(result.score);
    });
  }, [conversationId]);

  useEffect(() => {
    if (data && !data.score && !analyzing && !score) {
      setAnalyzing(true);
      analyzeMutation.execute({ conversationId }).then(s => {
        if (s) setScore(s);
      }).finally(() => setAnalyzing(false));
    }
  }, [data]);

  async function handleRetry() {
    setAnalyzing(true);
    try {
      const s = await analyzeMutation.execute({ conversationId });
      if (s) setScore(s);
    } finally {
      setAnalyzing(false);
    }
  }

  const displayScore = score || data?.score;

  if (loading && !data) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] gap-4 animate-fade-in">
        <Spinner className="h-12 w-12" />
        <p className="text-slate-400">Cargando datos...</p>
      </div>
    );
  }

  if (analyzing || (!displayScore && !analyzeMutation.error)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6 animate-fade-in">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-slate-700 border-t-cyan-400 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-lg">Analizando tu conversacion</p>
          <p className="text-slate-400 text-sm mt-1">La IA esta evaluando tu rendimiento...</p>
        </div>
      </div>
    );
  }

  if (analyzeMutation.error && !displayScore) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <p className="text-red-400 font-medium">Error al analizar: {analyzeMutation.error}</p>
        <div className="flex gap-3">
          <Button onClick={handleRetry}>Reintentar</Button>
          <Button variant="secondary" onClick={() => router.push('/history')}>Volver</Button>
        </div>
      </div>
    );
  }

  if (!displayScore) return null;
  const s = displayScore;
  let categoryDetails: Record<string, any> = {};
  try {
    if (s.categoryDetails) {
      categoryDetails = typeof s.categoryDetails === 'string' ? JSON.parse(s.categoryDetails) : s.categoryDetails;
    }
  } catch { /* ignore */ }

  const [gradStart, gradEnd] = scoreGradient(s.overallScore);
  const circumference = 2 * Math.PI * 56;
  const dashLen = (s.overallScore / 100) * circumference;

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6 lg:px-0 pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="animate-slide-up">
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Analisis de sesion</h1>
          <p className="text-slate-400 text-sm mt-1">{data?.conversation.scenarioName}</p>
        </div>
        <Button variant="secondary" onClick={() => router.push('/history')}>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Volver al historial
          </span>
        </Button>
      </div>

      {/* Score Ring */}
      <div className="glass rounded-2xl p-6 sm:p-10 flex flex-col items-center animate-slide-up">
        <p className="text-slate-400 text-sm font-medium mb-4 uppercase tracking-wider">Puntuacion general</p>
        <div className="relative w-40 h-40 sm:w-48 sm:h-48">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={gradStart} />
                <stop offset="100%" stopColor={gradEnd} />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-700/50" />
            <circle
              cx="60" cy="60" r="56" fill="none"
              stroke="url(#scoreGrad)" strokeWidth="8"
              strokeDasharray={`${dashLen} ${circumference}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl sm:text-6xl font-bold ${scoreColor(s.overallScore)}`}>
              {Math.round(s.overallScore)}
            </span>
            <span className="text-slate-500 text-xs font-medium mt-1">de 100</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="glass rounded-2xl p-5 sm:p-6 animate-slide-up">
        <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
          Desglose por categoria
        </h2>
        <div className="space-y-5">
          {CATEGORIES.map(({ key, label, weight, icon }) => {
            const val = (s[key as keyof Score] as number) || 0;
            const details = categoryDetails?.[key];
            const subcriteria = details?.subcriteria;
            return (
              <div key={key} className="group">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-300 flex items-center gap-2">
                    <span className="text-base">{icon}</span>
                    <span className="font-medium">{label}</span>
                    <span className="text-slate-600 text-xs hidden sm:inline">({weight})</span>
                  </span>
                  <span className={`font-bold text-lg ${scoreColor(val)}`}>{Math.round(val)}</span>
                </div>
                <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${scoreBgBar(val)}`}
                    style={{ width: `${val}%` }}
                  />
                </div>
                {details?.comment && (
                  <p className="text-xs text-slate-400 mt-1.5 pl-7">{details.comment}</p>
                )}
                {details?.evidence && (
                  <p className="text-xs text-slate-500 mt-0.5 pl-7 italic">&quot;{details.evidence}&quot;</p>
                )}
                {subcriteria && Object.keys(subcriteria).length > 0 && (
                  <div className="mt-2 pl-7 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {Object.entries(subcriteria).map(([subKey, subVal]) => (
                      <div key={subKey} className="flex items-center gap-1.5 text-[11px]">
                        <div className="w-8 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${scoreBgBar(subVal as number)}`} style={{ width: `${subVal}%` }} />
                        </div>
                        <span className={`${scoreColor(subVal as number)} font-medium`}>{Math.round(subVal as number)}</span>
                        <span className="text-slate-500 truncate">{subKey}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5 animate-slide-up">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            Fortalezas
          </h3>
          <ul className="space-y-3">
            {s.strengths?.map((str, i) => (
              <li key={i} className="text-slate-300 text-sm flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </span>
                {str}
              </li>
            ))}
          </ul>
        </div>
        <div className="glass rounded-2xl p-5 animate-slide-up">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            Areas de mejora
          </h3>
          <ul className="space-y-3">
            {s.improvements?.map((imp, i) => (
              <li key={i} className="text-slate-300 text-sm flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                  </svg>
                </span>
                {imp}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Coach Feedback */}
      {s.detailedFeedback && (
        <div className="glass rounded-2xl p-5 sm:p-6 animate-slide-up">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
            </div>
            Feedback del Coach
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
            {s.detailedFeedback}
          </p>
        </div>
      )}

      {/* Transcript */}
      {data?.conversation.transcript && (
        <div className="glass rounded-2xl p-5 sm:p-6 animate-slide-up">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
            </div>
            Transcripcion de la conversacion
          </h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {(() => {
              try {
                const transcript = JSON.parse(data.conversation.transcript);
                return transcript.map((entry: any, i: number) => (
                  <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                      entry.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10 text-slate-200 border border-blue-500/20 rounded-br-sm'
                        : 'bg-slate-700/60 text-slate-300 border border-slate-600/30 rounded-bl-sm'
                    }`}>
                      <p className={`text-[10px] font-semibold mb-1 ${
                        entry.role === 'user' ? 'text-cyan-400' : 'text-slate-500'
                      }`}>
                        {entry.role === 'user' ? 'Comercial (Tu)' : data.conversation.clientName || 'Cliente'}
                      </p>
                      <p className="leading-relaxed">{entry.text}</p>
                    </div>
                  </div>
                ));
              } catch { return <p className="text-slate-500 text-sm text-center py-4">No se pudo cargar la transcripcion.</p>; }
            })()}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 pb-6 animate-slide-up">
        <Button onClick={() => router.push('/scenarios')}>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
            Nuevo entrenamiento
          </span>
        </Button>
        <Button variant="secondary" onClick={() => router.push('/history')}>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Ver historial
          </span>
        </Button>
      </div>
    </div>
  );
}
