'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@/hooks/useGraphQL';
import { GET_GUIDELINES } from '@/lib/graphql/queries';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Guideline } from '@/types';

const gradientColors = [
  'from-blue-500/15 to-blue-600/5 border-blue-500/20',
  'from-cyan-500/15 to-cyan-600/5 border-cyan-500/20',
  'from-emerald-500/15 to-emerald-600/5 border-emerald-500/20',
  'from-purple-500/15 to-purple-600/5 border-purple-500/20',
  'from-amber-500/15 to-amber-600/5 border-amber-500/20',
];

const iconBgColors = [
  'from-blue-500/30 to-blue-600/10',
  'from-cyan-500/30 to-cyan-600/10',
  'from-emerald-500/30 to-emerald-600/10',
  'from-purple-500/30 to-purple-600/10',
  'from-amber-500/30 to-amber-600/10',
];

const iconColors = [
  'text-blue-400',
  'text-cyan-400',
  'text-emerald-400',
  'text-purple-400',
  'text-amber-400',
];

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

export default function GuidelinesPage() {
  const { data, loading, execute: loadGuidelines } = useQuery<Guideline[]>(GET_GUIDELINES);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => { loadGuidelines(); }, []);

  const activeGuidelines = data?.filter(g => g.isActive) || [];

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-0 pb-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/20">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a23.838 23.838 0 0 0-1.012 5.434c0 .076.022.154.065.22a.887.887 0 0 0 .166.187C5.258 18.18 8.494 20 12 20c3.506 0 6.742-1.82 8.77-4.012a.886.886 0 0 0 .165-.187.487.487 0 0 0 .066-.22 23.84 23.84 0 0 0-1.012-5.434m-15.482 0c.34-1.156.733-2.29 1.177-3.396A48.638 48.638 0 0 1 12 3.594a48.622 48.622 0 0 1 8.006 3.157c.444 1.106.837 2.24 1.177 3.396M4.26 10.147A48.579 48.579 0 0 1 12 8.1a48.571 48.571 0 0 1 7.74 2.047" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Criterios de Evaluacion</h1>
            <p className="text-slate-400 text-sm mt-0.5">Los criterios que la IA utiliza para evaluar tus conversaciones de venta</p>
          </div>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : activeGuidelines.length === 0 ? (
        <div className="glass rounded-2xl">
          <EmptyState
            title="Sin criterios configurados"
            description="Los criterios de evaluacion se configuran desde el panel de administracion."
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {activeGuidelines.map((g, idx) => {
            const colorIdx = idx % gradientColors.length;
            const isExpanded = expandedIds.has(g.id);
            return (
              <div
                key={g.id}
                className={`bg-gradient-to-br ${gradientColors[colorIdx]} rounded-2xl border transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50 animate-slide-up card-glow`}
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <button
                  onClick={() => toggleExpanded(g.id)}
                  className="w-full flex items-center gap-3 p-5 text-left cursor-pointer"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconBgColors[colorIdx]} flex items-center justify-center shrink-0 ${iconColors[colorIdx]}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white text-base flex-1">{g.title}</h3>
                  <ChevronIcon expanded={isExpanded} />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="px-5 pb-5 pt-0 ml-[52px]">
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{g.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info footer */}
      {activeGuidelines.length > 0 && (
        <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 justify-center animate-slide-up">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          <span>Estos criterios se aplican automaticamente durante el analisis de cada sesion</span>
        </div>
      )}
    </div>
  );
}
