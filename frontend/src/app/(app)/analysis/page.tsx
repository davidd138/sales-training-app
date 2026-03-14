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

function scoreBg(score: number) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

const CATEGORIES = [
  { key: 'rapport', label: 'Rapport' },
  { key: 'discovery', label: 'Discovery' },
  { key: 'presentation', label: 'Presentación' },
  { key: 'objectionHandling', label: 'Objeciones' },
  { key: 'closing', label: 'Cierre' },
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
    return <div className="flex justify-center items-center h-[60vh]"><Spinner /></div>;
  }

  if (analyzing || (!displayScore && !analyzeMutation.error)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Spinner className="h-12 w-12" />
        <p className="text-slate-400">Analizando tu conversación...</p>
      </div>
    );
  }

  if (analyzeMutation.error && !displayScore) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-red-400">Error al analizar: {analyzeMutation.error}</p>
        <div className="flex gap-3">
          <Button onClick={handleRetry}>Reintentar</Button>
          <Button variant="secondary" onClick={() => router.push('/history')}>Volver</Button>
        </div>
      </div>
    );
  }

  if (!displayScore) return null;
  const s = displayScore;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Análisis de sesión</h1>
          <p className="text-slate-400 text-sm mt-1">{data?.conversation.scenarioName}</p>
        </div>
        <Button variant="secondary" onClick={() => router.push('/history')}>Volver al historial</Button>
      </div>

      <Card className="flex flex-col items-center py-8">
        <p className="text-slate-400 text-sm mb-2">Puntuación general</p>
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-700" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8"
              className={scoreColor(s.overallScore)}
              strokeDasharray={`${(s.overallScore / 100) * 327} 327`}
              strokeLinecap="round"
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-4xl font-bold ${scoreColor(s.overallScore)}`}>
            {Math.round(s.overallScore)}
          </span>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">Desglose por categoría</h2>
        <div className="space-y-4">
          {CATEGORIES.map(({ key, label }) => {
            const val = s[key] as number;
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{label}</span>
                  <span className={scoreColor(val)}>{Math.round(val)}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${scoreBg(val)}`} style={{ width: `${val}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Fortalezas
          </h3>
          <ul className="space-y-2">
            {s.strengths?.map((str, i) => (
              <li key={i} className="text-slate-300 text-sm flex gap-2">
                <span className="text-emerald-400 shrink-0">+</span> {str}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Áreas de mejora
          </h3>
          <ul className="space-y-2">
            {s.improvements?.map((imp, i) => (
              <li key={i} className="text-slate-300 text-sm flex gap-2">
                <span className="text-amber-400 shrink-0">-</span> {imp}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {s.detailedFeedback && (
        <Card>
          <h3 className="text-white font-semibold mb-3">Feedback detallado</h3>
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{s.detailedFeedback}</p>
        </Card>
      )}
    </div>
  );
}
