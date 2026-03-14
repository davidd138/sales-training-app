'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@/hooks/useGraphQL';
import { useRealtimeTraining } from '@/hooks/useRealtimeTraining';
import { LIST_SCENARIOS } from '@/lib/graphql/queries';
import { CREATE_CONVERSATION, UPDATE_CONVERSATION, ANALYZE_CONVERSATION } from '@/lib/graphql/mutations';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
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

const difficultyLabels: Record<string, { label: string; color: string; tips: string[] }> = {
  easy: {
    label: 'Facil',
    color: 'text-green-400 bg-green-500/20',
    tips: [
      'El cliente es receptivo — aprovecha para practicar descubrimiento de necesidades',
      'Haz preguntas abiertas para que el cliente hable de su situacion',
      'Escucha activamente y adapta tu propuesta a lo que el cliente te cuente',
    ],
  },
  medium: {
    label: 'Medio',
    color: 'text-amber-400 bg-amber-500/20',
    tips: [
      'El cliente tiene objeciones reales — preparate para manejarlas con datos',
      'No asumas necesidades: pregunta antes de presentar soluciones',
      'Si el cliente compara con otros proveedores, diferencia tu oferta con hechos',
    ],
  },
  hard: {
    label: 'Dificil',
    color: 'text-red-400 bg-red-500/20',
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
  const [phase, setPhase] = useState<'briefing' | 'call' | 'saving'>('briefing');
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const scenarios = useQuery<Scenario[]>(LIST_SCENARIOS);
  const createConv = useMutation(CREATE_CONVERSATION);
  const updateConv = useMutation(UPDATE_CONVERSATION);
  const analyzeConv = useMutation(ANALYZE_CONVERSATION);

  const training = useRealtimeTraining(scenario || ({} as Scenario));

  useEffect(() => {
    if (!scenarioId) { router.replace('/scenarios'); return; }
    scenarios.execute().then((list: Scenario[]) => {
      const s = list?.find((s: Scenario) => s.id === scenarioId);
      if (s) setScenario(s);
      else router.replace('/scenarios');
    });
  }, [scenarioId]);

  // Auto-scroll transcript
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

  const handleHangUp = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    training.disconnect();
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
        <div className="max-w-2xl mx-auto py-12 px-6">
          <button onClick={() => router.push('/scenarios')} className="text-slate-400 hover:text-white text-sm mb-8 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Volver a escenarios
          </button>

          <div className="flex items-center gap-3 mb-6">
            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${diffInfo.color}`}>{diffInfo.label}</span>
            <span className="text-xs text-slate-500">{scenario.industry}</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">{scenario.name}</h1>
          <p className="text-slate-400 mb-8">{scenario.description}</p>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Perfil del Cliente</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-slate-500">Nombre</p>
                <p className="text-white font-medium">{scenario.clientName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Cargo</p>
                <p className="text-white font-medium">{scenario.clientTitle}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Empresa</p>
                <p className="text-white font-medium">{scenario.clientCompany}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Sector</p>
                <p className="text-white font-medium">{scenario.industry}</p>
              </div>
            </div>
            {persona.personality && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-500 mb-1">Personalidad</p>
                <p className="text-sm text-slate-300">{persona.personality}</p>
              </div>
            )}
          </div>

          <div className="bg-slate-800 rounded-xl border border-amber-500/30 p-6 mb-8">
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">Consejos para esta dificultad</h2>
            <ul className="space-y-2">
              {diffInfo.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-amber-400 mt-0.5">&#8226;</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center">
            <Button onClick={startCall} className="px-8 py-3 text-base">
              Iniciar Llamada
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ===== SAVING SCREEN =====
  if (phase === 'saving') {
    return (
      <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center">
        <Spinner className="h-10 w-10 mb-4" />
        <p className="text-white text-lg">Analizando tu conversacion...</p>
        <p className="text-slate-400 text-sm mt-2">Esto puede tardar unos segundos</p>
      </div>
    );
  }

  // ===== CALL SCREEN =====
  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex">
      {/* Left side — call interface */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">En llamada con</p>
          <h2 className="text-2xl font-bold text-white">{scenario.clientName}</h2>
          <p className="text-slate-400 text-sm">{scenario.clientTitle} — {scenario.clientCompany}</p>
        </div>

        <p className="text-5xl font-mono text-white mb-6 tabular-nums">
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </p>

        <div className="relative mb-6">
          <div className={`w-20 h-20 rounded-full ${stateColors[training.state]} opacity-20 ${training.state === 'listening' || training.state === 'speaking' ? 'animate-ping' : ''}`} />
          <div className={`absolute inset-2 rounded-full ${stateColors[training.state]}`} />
        </div>

        <p className="text-slate-400 text-sm mb-10">{stateLabels[training.state]}</p>

        <button
          onClick={handleHangUp}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center shadow-lg shadow-red-500/25"
        >
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
          </svg>
        </button>
      </div>

      {/* Right side — live transcript */}
      <div className="w-96 bg-slate-800/50 border-l border-slate-700/50 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-300">Transcripcion en vivo</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {training.transcript.length === 0 && (
            <p className="text-slate-500 text-sm text-center mt-8">La transcripcion aparecera aqui...</p>
          )}
          {training.transcript.map((entry: TranscriptEntry, i: number) => (
            <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                entry.role === 'user'
                  ? 'bg-primary/20 text-primary'
                  : 'bg-slate-700 text-slate-300'
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
    </div>
  );
}
