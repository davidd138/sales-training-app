'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@/hooks/useGraphQL';
import { useRealtimeTraining } from '@/hooks/useRealtimeTraining';
import { LIST_SCENARIOS } from '@/lib/graphql/queries';
import { CREATE_CONVERSATION, UPDATE_CONVERSATION, ANALYZE_CONVERSATION } from '@/lib/graphql/mutations';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Logo } from '@/components/ui/Logo';
import type { Scenario, TranscriptEntry } from '@/types';

const stateLabels: Record<string, string> = {
  idle: 'Desconectado',
  connecting: 'Conectando...',
  connected: 'Conectado — Habla cuando quieras',
  listening: 'Escuchando...',
  speaking: 'El cliente esta hablando...',
  error: 'Error de conexion',
};

const stateColors: Record<string, string> = {
  idle: 'bg-slate-500',
  connecting: 'bg-amber-500',
  connected: 'bg-emerald-500',
  listening: 'bg-emerald-500',
  speaking: 'bg-blue-500',
  error: 'bg-red-500',
};

const difficultyLabels: Record<string, { label: string; color: string; gradient: string; tips: string[] }> = {
  easy: {
    label: 'Principiante',
    color: 'text-emerald-400',
    gradient: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
    tips: [
      'El cliente es receptivo — aprovecha para practicar descubrimiento de necesidades',
      'Haz preguntas abiertas para que el cliente hable de su situacion',
      'Escucha activamente y adapta tu propuesta a lo que el cliente te cuente',
    ],
  },
  medium: {
    label: 'Intermedio',
    color: 'text-amber-400',
    gradient: 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
    tips: [
      'El cliente tiene objeciones reales — preparate para manejarlas con datos',
      'No asumas necesidades: pregunta antes de presentar soluciones',
      'Si el cliente compara con otros proveedores, diferencia tu oferta con hechos',
    ],
  },
  hard: {
    label: 'Experto',
    color: 'text-red-400',
    gradient: 'from-red-500/20 to-red-600/5 border-red-500/20',
    tips: [
      'Tienes 30 segundos para captar su atencion — se directo y aporta valor inmediato',
      'El cliente puede ser hostil o cortante — no te lo tomes como algo personal',
      'Busca el punto de dolor real — hay algo que le preocupa aunque no lo diga',
      'Si te dice que no le interesa, haz UNA pregunta relevante antes de rendirte',
    ],
  },
};

export default function TrainingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const scenarioId = searchParams.get('id');
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<'briefing' | 'call' | 'summary' | 'saving'>('briefing');
  const [notes, setNotes] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [selfReflection, setSelfReflection] = useState('');
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const summaryTranscriptRef = useRef<HTMLDivElement>(null);

  const scenarios = useQuery<Scenario[]>(LIST_SCENARIOS);
  const createConv = useMutation(CREATE_CONVERSATION);
  const updateConv = useMutation(UPDATE_CONVERSATION);
  const analyzeConv = useMutation(ANALYZE_CONVERSATION);

  const training = useRealtimeTraining(scenario || ({} as Scenario));

  useEffect(() => { document.title = 'Entrenamiento | SalesPulse AI'; }, []);
  useEffect(() => {
    if (!scenarioId) { router.replace('/scenarios'); return; }
    scenarios.execute().then((list: Scenario[]) => {
      const s = list?.find((s: Scenario) => s.id === scenarioId);
      if (s) setScenario(s);
      else router.replace('/scenarios');
    });
  }, [scenarioId]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [training.transcript]);

  const startCall = useCallback(async () => {
    if (!scenario) return;
    try {
      const conv = await createConv.execute({ input: { scenarioId: scenario.id } });
      if (conv?.id) {
        setConversationId(conv.id);
        setPhase('call');
        startTimeRef.current = Date.now();
        timerRef.current = setInterval(() => {
          setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
        training.connect();
      }
    } catch (e) {
      console.error('Failed to start training:', e);
    }
  }, [scenario, createConv, training]);

  const handleHangUp = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    training.disconnect();
    setPhase('summary');
  }, [training]);

  const handleProceedToAnalysis = useCallback(async () => {
    setPhase('saving');
    if (conversationId) {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const transcriptStr = JSON.stringify(training.transcript);
      await updateConv.execute({
        input: { id: conversationId, status: 'completed', duration, transcript: transcriptStr },
      });
      analyzeConv.execute({ conversationId }).catch(() => {});
      router.replace(`/analysis?id=${conversationId}`);
    }
  }, [conversationId, training, router]);

  if (!scenario) {
    return <div className="flex justify-center items-center h-[60vh]"><Spinner /></div>;
  }

  let persona: any = {};
  try { persona = typeof scenario.persona === 'string' ? JSON.parse(scenario.persona) : scenario.persona || {}; } catch {}

  const diffInfo = difficultyLabels[scenario.difficulty] || difficultyLabels.medium;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  // ===== BRIEFING SCREEN =====
  if (phase === 'briefing') {
    return (
      <div className="fixed inset-0 bg-slate-900 z-50 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4 sm:px-6 animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => router.push('/scenarios')} className="text-slate-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Volver
            </button>
            <Logo size="sm" />
          </div>

          {/* Scenario header */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${diffInfo.gradient} border mb-4`}>
            <div className={`w-2 h-2 rounded-full ${stateColors[scenario.difficulty === 'easy' ? 'connected' : scenario.difficulty === 'hard' ? 'error' : 'connecting']}`} />
            <span className={`text-xs font-bold ${diffInfo.color}`}>{diffInfo.label}</span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">{scenario.industry}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{scenario.name}</h1>
          <p className="text-slate-400 mb-6 sm:mb-8">{scenario.description}</p>

          {/* Client profile card */}
          <div className="bg-slate-800 rounded-xl border border-slate-700/50 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-6 py-4 border-b border-slate-700/50">
              <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Perfil del cliente
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-xl ${diffInfo.color === 'text-emerald-400' ? 'bg-emerald-500/20' : diffInfo.color === 'text-amber-400' ? 'bg-amber-500/20' : 'bg-red-500/20'} flex items-center justify-center text-2xl font-bold ${diffInfo.color}`}>
                  {scenario.clientName[0]}
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">{scenario.clientName}</p>
                  <p className="text-slate-400 text-sm">{scenario.clientTitle} — {scenario.clientCompany}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Sector</p>
                  <p className="text-slate-200 text-sm font-medium mt-0.5">{scenario.industry}</p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Dificultad</p>
                  <p className={`text-sm font-medium mt-0.5 ${diffInfo.color}`}>{diffInfo.label}</p>
                </div>
              </div>
              {persona.personality && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Personalidad</p>
                  <p className="text-sm text-slate-300 italic">"{persona.personality}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className={`bg-gradient-to-r ${diffInfo.gradient} rounded-xl border p-5 sm:p-6 mb-8`}>
            <h2 className={`text-sm font-semibold ${diffInfo.color} uppercase tracking-wider mb-3 flex items-center gap-2`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
              Consejos
            </h2>
            <ul className="space-y-2">
              {diffInfo.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className={`mt-1 ${diffInfo.color}`}>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={startCall}
              className="px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0 shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                Iniciar Llamada
              </span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ===== POST-CALL SUMMARY SCREEN =====
  if (phase === 'summary') {
    const summaryMins = Math.floor(elapsed / 60);
    const summarySecs = elapsed % 60;
    return (
      <div className="fixed inset-0 bg-slate-900 z-50 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4 sm:px-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Resumen de la llamada</h1>
            <Logo size="sm" />
          </div>

          {/* Call duration card */}
          <div className="bg-slate-800 rounded-xl border border-slate-700/50 p-5 mb-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Duracion de la llamada</p>
              <p className="text-2xl font-mono text-white tabular-nums">
                {String(summaryMins).padStart(2, '0')}:{String(summarySecs).padStart(2, '0')}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Cliente</p>
              <p className="text-sm text-slate-300 font-medium">{scenario.clientName}</p>
              <p className="text-xs text-slate-500">{scenario.clientCompany}</p>
            </div>
          </div>

          {/* Self-reflection prompt */}
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20 p-5 sm:p-6 mb-6">
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Autoevaluacion
            </h2>
            <p className="text-slate-300 text-sm mb-3">
              Antes de ver el analisis, ¿como crees que te ha ido?
            </p>
            <textarea
              value={selfReflection}
              onChange={(e) => setSelfReflection(e.target.value)}
              placeholder="Escribe tus impresiones sobre la llamada..."
              className="w-full bg-slate-800/80 border border-amber-500/20 rounded-lg p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/40 resize-none"
              rows={3}
            />
          </div>

          {/* Notes from the call (if any) */}
          {notes.trim() && (
            <div className="bg-slate-800 rounded-xl border border-slate-700/50 p-5 mb-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Tus notas durante la llamada
              </h2>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{notes}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Button
              onClick={handleProceedToAnalysis}
              className="flex-1 py-3 text-base bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0 shadow-lg shadow-blue-500/25"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Ver analisis
              </span>
            </Button>
            <button
              onClick={() => summaryTranscriptRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="flex-1 py-3 text-base rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Revisar transcripcion
            </button>
          </div>

          {/* Transcript section */}
          <div ref={summaryTranscriptRef} className="bg-slate-800 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700/50">
              <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                Transcripcion completa
                <span className="text-xs text-slate-500 font-normal ml-auto">{training.transcript.length} mensajes</span>
              </h2>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-4 space-y-3">
              {training.transcript.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">No se registro ninguna transcripcion.</p>
              ) : (
                training.transcript.map((entry: TranscriptEntry, i: number) => (
                  <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                      entry.role === 'user'
                        ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-200 border border-blue-500/20'
                        : 'bg-slate-700/80 text-slate-300 border border-slate-600/30'
                    }`}>
                      <p className="text-[10px] font-semibold mb-0.5 opacity-60">
                        {entry.role === 'user' ? 'Tu' : scenario.clientName}
                      </p>
                      {entry.text}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== SAVING SCREEN =====
  if (phase === 'saving') {
    return (
      <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center px-4">
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 animate-ping absolute inset-0" />
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center relative">
            <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
        </div>
        <p className="text-white text-xl font-semibold mb-2">Analizando tu conversacion</p>
        <p className="text-slate-400 text-sm text-center">Nuestro coach de IA esta evaluando tu rendimiento...</p>
        <div className="mt-6 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  // ===== CALL SCREEN =====
  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col md:flex-row">
      {/* Call interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 min-h-[50vh] md:min-h-0">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${stateColors[training.state]} ${training.state !== 'idle' && training.state !== 'error' ? 'animate-pulse' : ''}`} />
            <p className="text-slate-400 text-xs sm:text-sm uppercase tracking-wider">{stateLabels[training.state]}</p>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">{scenario.clientName}</h2>
          <p className="text-slate-500 text-xs sm:text-sm">{scenario.clientTitle} — {scenario.clientCompany}</p>
        </div>

        <p className="text-4xl sm:text-5xl font-mono text-white mb-6 sm:mb-8 tabular-nums tracking-wider">
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </p>

        {/* Visual pulse indicator */}
        <div className="relative mb-6 sm:mb-8">
          {(training.state === 'listening' || training.state === 'speaking' || training.state === 'connected') && (
            <>
              <div className={`absolute inset-[-16px] rounded-full ${training.state === 'speaking' ? 'bg-blue-500/10' : 'bg-emerald-500/10'} animate-ping`} />
              <div className={`absolute inset-[-8px] rounded-full ${training.state === 'speaking' ? 'bg-blue-500/15' : 'bg-emerald-500/15'} animate-pulse`} />
            </>
          )}
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center ${
            training.state === 'speaking'
              ? 'bg-gradient-to-br from-blue-500 to-blue-600'
              : training.state === 'listening'
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
              : training.state === 'connecting'
              ? 'bg-gradient-to-br from-amber-500 to-amber-600'
              : training.state === 'error'
              ? 'bg-gradient-to-br from-red-500 to-red-600'
              : 'bg-gradient-to-br from-slate-600 to-slate-700'
          } shadow-lg relative`}>
            {training.state === 'speaking' ? (
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            ) : training.state === 'listening' ? (
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            )}
          </div>
        </div>

        <button
          onClick={handleHangUp}
          aria-label="Colgar llamada"
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500 hover:bg-red-600 transition-all flex items-center justify-center shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 hover:scale-105"
        >
          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
          </svg>
        </button>
      </div>

      {/* Live transcript */}
      <div className="h-[40vh] md:h-auto md:w-96 bg-slate-800/80 backdrop-blur-sm border-t md:border-t-0 md:border-l border-slate-700/50 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            Transcripcion en vivo
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">{training.transcript.length} msgs</span>
        </div>
        <div role="log" aria-live="polite" className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3">
          {training.transcript.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full">
              <svg className="w-8 h-8 text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              <p className="text-slate-500 text-xs text-center">La transcripcion aparecera aqui...</p>
            </div>
          )}
          {training.transcript.map((entry: TranscriptEntry, i: number) => (
            <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                entry.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-200 border border-blue-500/20'
                  : 'bg-slate-700/80 text-slate-300 border border-slate-600/30'
              }`}>
                <p className="text-[10px] font-semibold mb-0.5 opacity-60">
                  {entry.role === 'user' ? 'Tu' : scenario.clientName}
                </p>
                {entry.text}
              </div>
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>
      </div>

      {/* Quick Notes - floating button + expandable textarea */}
      <div className="fixed bottom-4 left-4 z-[60] flex flex-col items-start gap-2">
        {notesOpen && (
          <div className="w-72 sm:w-80 bg-slate-800 border border-slate-600/50 rounded-xl shadow-2xl shadow-black/40 animate-fade-in overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Notas rapidas</span>
              <button
                onClick={() => setNotesOpen(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Apunta ideas, objeciones, datos clave..."
              className="w-full bg-transparent p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none"
              rows={4}
              autoFocus
            />
            <div className="px-3 pb-2">
              <p className="text-[10px] text-slate-600">Solo para ti — no se envia a la IA</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setNotesOpen(!notesOpen)}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 ${
            notesOpen
              ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
              : notes
              ? 'bg-amber-500/80 hover:bg-amber-500 shadow-amber-500/20'
              : 'bg-slate-700 hover:bg-slate-600 shadow-black/20'
          }`}
          title="Notas rapidas"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </button>
      </div>
    </div>
  );
}
