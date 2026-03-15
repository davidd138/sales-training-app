'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@/hooks/useGraphQL';
import { GET_CONVERSATION, LIST_SCENARIOS } from '@/lib/graphql/queries';
import { ANALYZE_CONVERSATION } from '@/lib/graphql/mutations';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { Score, Conversation, Scenario } from '@/types';

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

function difficultyBadge(difficulty: string) {
  switch (difficulty) {
    case 'easy':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75" />
          </svg>
          Facil
        </span>
      );
    case 'medium':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
          Intermedio
        </span>
      );
    case 'hard':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/20">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
          </svg>
          Dificil
        </span>
      );
    default:
      return null;
  }
}

const ANALYSIS_STEPS = [
  { icon: '📖', text: 'Leyendo transcripcion...' },
  { icon: '🔬', text: 'Evaluando categorias SPIN...' },
  { icon: '✍️', text: 'Generando feedback...' },
];

function AnalysisLoadingSteps() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % ANALYSIS_STEPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
        <p className="text-white font-semibold text-lg mb-4">Analizando tu conversacion</p>
        <div className="space-y-3 w-72">
          {ANALYSIS_STEPS.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500 ${
                i === step
                  ? 'bg-cyan-500/10 border border-cyan-500/30 scale-105'
                  : i < step
                  ? 'bg-slate-700/30 border border-slate-700/30 opacity-50'
                  : 'bg-slate-800/30 border border-slate-700/20 opacity-30'
              }`}
            >
              <span className="text-lg">{s.icon}</span>
              <span className={`text-sm font-medium ${
                i === step ? 'text-cyan-300' : 'text-slate-400'
              }`}>
                {s.text}
              </span>
              {i === step && (
                <div className="ml-auto flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
  const { data: scenarios, execute: loadScenarios } = useQuery<Scenario[]>(LIST_SCENARIOS);
  const analyzeMutation = useMutation<Score>(ANALYZE_CONVERSATION);
  const [analyzing, setAnalyzing] = useState(false);
  const [score, setScore] = useState<Score | null>(null);

  useEffect(() => {
    if (!conversationId) { router.replace('/history'); return; }
    loadConversation({ id: conversationId }).then(result => {
      if (result?.score) setScore(result.score);
    });
    loadScenarios();
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

  async function handleReanalyze() {
    setScore(null);
    setAnalyzing(true);
    try {
      const s = await analyzeMutation.execute({ conversationId });
      if (s) setScore(s);
    } finally {
      setAnalyzing(false);
    }
  }

  const displayScore = score || data?.score;

  // Find the matching scenario to get difficulty
  const matchedScenario = scenarios?.find(
    (sc) => sc.id === data?.conversation.scenarioId
  );

  if (loading && !data) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] gap-4 animate-fade-in">
        <Spinner className="h-12 w-12" />
        <p className="text-slate-400">Cargando datos...</p>
      </div>
    );
  }

  if (analyzing || (!displayScore && !analyzeMutation.error)) {
    return <AnalysisLoadingSteps />;
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
          <div className="flex items-center gap-3 mt-1.5">
            <p className="text-slate-400 text-sm">{data?.conversation.scenarioName}</p>
            {matchedScenario && difficultyBadge(matchedScenario.difficulty)}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button variant="secondary" onClick={handleReanalyze} disabled={analyzing}>
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
              </svg>
              Re-analizar
            </span>
          </Button>
          <Button variant="secondary" onClick={() => router.push('/history')}>
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Volver al historial
            </span>
          </Button>
        </div>
      </div>

      {/* Score Ring */}
      <div className="glass rounded-2xl p-6 sm:p-10 flex flex-col items-center animate-slide-up">
        <p className="text-slate-400 text-sm font-medium mb-4 uppercase tracking-wider">Puntuacion general</p>
        <div className="relative w-32 h-32 sm:w-48 sm:h-48">
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
            <span className={`text-4xl sm:text-6xl font-bold ${scoreColor(s.overallScore)}`}>
              {Math.round(s.overallScore)}
            </span>
            <span className="text-slate-500 text-xs font-medium mt-1">de 100</span>
          </div>
        </div>
      </div>

      {/* Conversation map */}
      <div className="glass rounded-2xl p-5 sm:p-6 animate-slide-up">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
          Mapa de la conversacion
        </h2>
        <div className="flex items-center gap-1 sm:gap-2">
          {[
            { phase: 'Apertura', key: 'rapport', emoji: '👋' },
            { phase: 'Descubrimiento', key: 'discovery', emoji: '🔍' },
            { phase: 'Presentacion', key: 'presentation', emoji: '💡' },
            { phase: 'Objeciones', key: 'objectionHandling', emoji: '🛡' },
            { phase: 'Cierre', key: 'closing', emoji: '🎯' },
          ].map((p, i) => {
            const score = (s[p.key as keyof Score] as number) || 0;
            const covered = score > 20;
            return (
              <React.Fragment key={p.key}>
                {i > 0 && (
                  <div className={`h-0.5 flex-1 ${covered ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-slate-700'}`} />
                )}
                <div className={`flex flex-col items-center gap-1 ${covered ? '' : 'opacity-40'}`}>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm ${
                    score >= 70 ? 'bg-emerald-500/20 ring-2 ring-emerald-500/30' :
                    score >= 40 ? 'bg-amber-500/20 ring-2 ring-amber-500/30' :
                    covered ? 'bg-red-500/20 ring-2 ring-red-500/30' :
                    'bg-slate-700/50 ring-1 ring-slate-600'
                  }`}>
                    {p.emoji}
                  </div>
                  <span className="text-[10px] text-slate-400 text-center leading-tight hidden sm:block">{p.phase}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
        <p className="text-xs text-slate-500 mt-3 text-center">
          Las fases iluminadas indican que el comercial las cubrio durante la llamada
        </p>
      </div>

      {/* SPIN question analysis */}
      {data?.conversation.transcript && (() => {
        try {
          const transcript = JSON.parse(data.conversation.transcript);
          const userMessages = transcript.filter((e: any) => e.role === 'user');
          const totalQuestions = userMessages.filter((e: any) => e.text?.includes('?')).length;

          // Simple heuristic keyword detection
          const situationKeywords = ['actualmente', 'ahora mismo', 'que proveedor', 'cuanto', 'cuantos', 'desde cuando', 'como es', 'que tipo'];
          const problemKeywords = ['problema', 'preocupa', 'dificultad', 'frustrar', 'molesta', 'insatisf', 'falla', 'queja'];
          const implicationKeywords = ['impacto', 'consecuencia', 'afecta', 'significa', 'si eso sigue', 'costar', 'perder', 'riesgo'];
          const needPayoffKeywords = ['si pudiera', 'que significaria', 'como mejoraria', 'que valor', 'imagina', 'beneficio', 'solucion'];

          const countByType = (keywords: string[]) =>
            userMessages.filter((e: any) => keywords.some(k => e.text?.toLowerCase().includes(k))).length;

          const s_count = countByType(situationKeywords);
          const p_count = countByType(problemKeywords);
          const i_count = countByType(implicationKeywords);
          const nb_count = countByType(needPayoffKeywords);
          const maxCount = Math.max(s_count, p_count, i_count, nb_count, 1);

          if (totalQuestions === 0) return null;

          return (
            <div className="glass rounded-2xl p-5 sm:p-6 animate-slide-up">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
                Analisis de preguntas SPIN
              </h2>
              <p className="text-xs text-slate-500 mb-3">Preguntas detectadas: {totalQuestions} | Estimacion basada en analisis de palabras clave</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Situacion', count: s_count, color: 'blue', desc: 'Contexto actual' },
                  { label: 'Problema', count: p_count, color: 'amber', desc: 'Dolores y retos' },
                  { label: 'Implicacion', count: i_count, color: 'purple', desc: 'Consecuencias' },
                  { label: 'Necesidad', count: nb_count, color: 'emerald', desc: 'Valor de resolver' },
                ].map(item => (
                  <div key={item.label} className="text-center p-3 rounded-xl bg-slate-700/30 border border-slate-700/50">
                    <p className={`text-2xl font-bold text-${item.color}-400`}>{item.count}</p>
                    <p className="text-xs text-slate-300 font-medium mt-1">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                    <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full bg-${item.color}-500 rounded-full`} style={{ width: `${(item.count / maxCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 mt-3 text-center italic">
                Los mejores comerciales progresan de S → P → I → N de forma natural durante la conversacion
              </p>
            </div>
          );
        } catch { return null; }
      })()}

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
          {/* Talk ratio estimate */}
          {data?.conversation.transcript && (() => {
            try {
              const t = JSON.parse(data.conversation.transcript);
              const userWords = t.filter((e: any) => e.role === 'user').reduce((sum: number, e: any) => sum + (e.text?.split(' ').length || 0), 0);
              const clientWords = t.filter((e: any) => e.role === 'assistant').reduce((sum: number, e: any) => sum + (e.text?.split(' ').length || 0), 0);
              const total = userWords + clientWords;
              if (total === 0) return null;
              const userPct = Math.round((userWords / total) * 100);
              const clientPct = 100 - userPct;
              const isGood = userPct <= 40;
              return (
                <div className="mt-4 pt-4 border-t border-slate-700/30">
                  <p className="text-xs text-slate-500 mb-2">Ratio de habla (objetivo: 30% tu / 70% cliente)</p>
                  <div className="flex h-3 rounded-full overflow-hidden bg-slate-700/50">
                    <div className={`${isGood ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gradient-to-r from-amber-500 to-red-500'} transition-all`} style={{ width: `${userPct}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-slate-400">Tu: {userPct}%</span>
                    <span className="text-[10px] text-slate-400">Cliente: {clientPct}%</span>
                  </div>
                </div>
              );
            } catch { return null; }
          })()}
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
                    <div className={`max-w-[80%] sm:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm ${
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

      {/* Recommended next step */}
      {displayScore && (
        <div className="glass rounded-2xl p-5 sm:p-6 animate-slide-up">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            Siguiente paso recomendado
          </h3>
          {s.overallScore >= 70 ? (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-emerald-400 text-sm font-medium mb-1">Excelente trabajo! Sube de nivel</p>
              <p className="text-slate-300 text-sm">Tu puntuacion de {Math.round(s.overallScore)} demuestra que dominas este nivel. Prueba un escenario de mayor dificultad para seguir mejorando.</p>
            </div>
          ) : s.overallScore >= 50 ? (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <p className="text-blue-400 text-sm font-medium mb-1">Buen progreso. Practica con otro escenario</p>
              <p className="text-slate-300 text-sm">Tu puntuacion de {Math.round(s.overallScore)} muestra que vas por buen camino. Prueba un escenario diferente del mismo nivel para consolidar tus habilidades.</p>
            </div>
          ) : (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <p className="text-amber-400 text-sm font-medium mb-1">Hay margen de mejora. Vuelve a intentarlo</p>
              <p className="text-slate-300 text-sm">Tu puntuacion de {Math.round(s.overallScore)} indica areas de mejora. Revisa el feedback del coach y vuelve a practicar con este mismo escenario para mejorar tu tecnica.</p>
            </div>
          )}
          {/* Weakest area tip */}
          {(() => {
            const categories = [
              { key: 'rapport', label: 'Rapport', tip: 'Practica la escucha activa y busca puntos en comun con el cliente.' },
              { key: 'discovery', label: 'Descubrimiento', tip: 'Usa mas preguntas de Implicacion y Necesidad-Beneficio (SPIN).' },
              { key: 'presentation', label: 'Presentacion', tip: 'Conecta cada beneficio con una necesidad especifica del cliente.' },
              { key: 'objectionHandling', label: 'Objeciones', tip: 'Valida la preocupacion antes de responder. Usa la tecnica Feel-Felt-Found.' },
              { key: 'closing', label: 'Cierre', tip: 'Propone siempre un siguiente paso concreto con fecha y hora.' },
              { key: 'communication', label: 'Comunicacion', tip: 'Habla menos y escucha mas. Objetivo: 30% tu, 70% cliente.' },
            ];
            const weakest = categories.reduce((min, cat) => {
              const score = (s[cat.key as keyof Score] as number) || 100;
              const minScore = (s[min.key as keyof Score] as number) || 100;
              return score < minScore ? cat : min;
            });
            const weakScore = (s[weakest.key as keyof Score] as number) || 0;
            if (weakScore < 70) {
              return (
                <div className="mt-3 flex items-start gap-2 text-sm">
                  <span className="text-amber-400 mt-0.5">💡</span>
                  <p className="text-slate-400">
                    <span className="text-slate-300 font-medium">Area a trabajar: {weakest.label} ({Math.round(weakScore)}).</span>{' '}
                    {weakest.tip}
                  </p>
                </div>
              );
            }
            return null;
          })()}
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
