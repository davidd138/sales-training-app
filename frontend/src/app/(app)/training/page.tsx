'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@/hooks/useGraphQL';
import { useRealtimeTraining } from '@/hooks/useRealtimeTraining';
import { LIST_SCENARIOS } from '@/lib/graphql/queries';
import { CREATE_CONVERSATION, UPDATE_CONVERSATION, ANALYZE_CONVERSATION } from '@/lib/graphql/mutations';
import { Spinner } from '@/components/ui/Spinner';
import type { Scenario, TranscriptEntry } from '@/types';

const stateLabels: Record<string, string> = {
  idle: 'Desconectado',
  connecting: 'Conectando...',
  connected: 'Conectado',
  listening: 'Escuchando...',
  speaking: 'Hablando...',
  error: 'Error de conexión',
};

const stateColors: Record<string, string> = {
  idle: 'bg-slate-500',
  connecting: 'bg-amber-500',
  connected: 'bg-emerald-500',
  listening: 'bg-emerald-500',
  speaking: 'bg-blue-500',
  error: 'bg-red-500',
};

export default function TrainingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const scenarioId = searchParams.get('id');
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    if (!scenario || conversationId) return;
    async function start() {
      const conv = await createConv.execute({
        input: { scenarioId: scenario!.id, scenarioName: scenario!.name, clientName: scenario!.clientName },
      });
      if (conv?.id) {
        setConversationId(conv.id);
        startTimeRef.current = Date.now();
        timerRef.current = setInterval(() => {
          setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
        training.connect();
      }
    }
    start();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [scenario]);

  const handleHangUp = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    training.disconnect();
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

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center">
      <div className="text-center mb-12">
        <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">Llamando a</p>
        <h2 className="text-2xl font-bold text-white">{scenario.clientName}</h2>
        <p className="text-slate-400">{scenario.clientTitle} — {scenario.clientCompany}</p>
      </div>

      <p className="text-5xl font-mono text-white mb-8 tabular-nums">
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </p>

      <div className="relative mb-8">
        <div className={`w-20 h-20 rounded-full ${stateColors[training.state]} opacity-20 ${training.state === 'listening' || training.state === 'speaking' ? 'animate-ping' : ''}`} />
        <div className={`absolute inset-2 rounded-full ${stateColors[training.state]}`} />
      </div>

      <p className="text-slate-400 text-sm mb-12">{stateLabels[training.state]}</p>

      {training.transcript.length > 0 && (
        <div className="max-w-lg w-full mb-8 max-h-40 overflow-y-auto px-4 space-y-2">
          {training.transcript.slice(-4).map((entry: TranscriptEntry, i: number) => (
            <p key={i} className={`text-sm ${entry.role === 'user' ? 'text-primary text-right' : 'text-slate-400 text-left'}`}>
              {entry.text}
            </p>
          ))}
        </div>
      )}

      <button
        onClick={handleHangUp}
        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center shadow-lg shadow-red-500/25"
      >
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
        </svg>
      </button>
    </div>
  );
}
