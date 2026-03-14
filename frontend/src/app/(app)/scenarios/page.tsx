'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@/hooks/useGraphQL';
import { LIST_SCENARIOS } from '@/lib/graphql/queries';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { Scenario } from '@/types';

const DIFFICULTY_ORDER = { easy: 0, medium: 1, hard: 2 };

const sectionConfig = {
  easy: {
    label: 'Nivel Principiante',
    desc: 'Clientes receptivos — ideal para practicar tecnicas basicas de descubrimiento',
    gradient: 'from-emerald-500/10 to-emerald-500/5',
    border: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
    icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    tagColor: 'bg-emerald-500/20 text-emerald-400',
  },
  medium: {
    label: 'Nivel Intermedio',
    desc: 'Clientes exigentes — objeciones reales, comparaciones y negociacion',
    gradient: 'from-amber-500/10 to-amber-500/5',
    border: 'border-amber-500/20',
    iconColor: 'text-amber-400',
    icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    tagColor: 'bg-amber-500/20 text-amber-400',
  },
  hard: {
    label: 'Nivel Experto',
    desc: 'Clientes hostiles — cada segundo cuenta, alta presion',
    gradient: 'from-red-500/10 to-red-500/5',
    border: 'border-red-500/20',
    iconColor: 'text-red-400',
    icon: 'M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z',
    tagColor: 'bg-red-500/20 text-red-400',
  },
};

export default function ScenariosPage() {
  const router = useRouter();
  const { data, loading, execute } = useQuery<Scenario[]>(LIST_SCENARIOS);

  useEffect(() => { execute().catch(() => {}); }, []);

  const scenarios = [...(data || [])].sort((a, b) =>
    (DIFFICULTY_ORDER[a.difficulty] || 0) - (DIFFICULTY_ORDER[b.difficulty] || 0)
  );

  const grouped = {
    easy: scenarios.filter(s => s.difficulty === 'easy'),
    medium: scenarios.filter(s => s.difficulty === 'medium'),
    hard: scenarios.filter(s => s.difficulty === 'hard'),
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Selecciona un escenario</h1>
        <p className="text-slate-400">Elige un cliente virtual para practicar tu conversacion de ventas</p>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="space-y-10">
          {(Object.entries(grouped) as [keyof typeof sectionConfig, Scenario[]][]).map(([level, items]) => {
            if (items.length === 0) return null;
            const config = sectionConfig[level];
            return (
              <div key={level} className="animate-slide-up">
                <div className={`flex items-center gap-3 mb-4 p-3 rounded-lg bg-gradient-to-r ${config.gradient} border ${config.border}`}>
                  <svg className={`w-5 h-5 ${config.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                  </svg>
                  <div>
                    <h2 className={`text-sm font-semibold ${config.iconColor}`}>{config.label}</h2>
                    <p className="text-slate-500 text-xs">{config.desc}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map(scenario => {
                    let persona: any = {};
                    try { persona = typeof scenario.persona === 'string' ? JSON.parse(scenario.persona) : scenario.persona || {}; } catch {}
                    return (
                      <div
                        key={scenario.id}
                        onClick={() => router.push(`/training?id=${scenario.id}`)}
                        className="bg-slate-800 rounded-xl p-5 border border-slate-700/50 cursor-pointer hover:border-slate-600 transition-all duration-200 group hover:shadow-lg hover:shadow-slate-900/50 hover:-translate-y-0.5"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${config.tagColor} flex items-center justify-center shrink-0`}>
                              <span className="text-lg font-bold">{scenario.clientName[0]}</span>
                            </div>
                            <div>
                              <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors">{scenario.clientName}</h3>
                              <p className="text-slate-500 text-sm">{scenario.clientTitle}</p>
                            </div>
                          </div>
                          <Badge value={scenario.difficulty} />
                        </div>
                        <p className="text-slate-400 text-sm mb-3">{scenario.clientCompany}</p>
                        <p className="text-slate-300 text-sm mb-3 line-clamp-2">{scenario.description}</p>
                        {persona.personality && (
                          <p className="text-slate-500 text-xs mb-3 line-clamp-1 italic">"{persona.personality}"</p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-slate-700/80 text-slate-400 px-2 py-0.5 rounded">{scenario.industry}</span>
                          </div>
                          <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            Practicar
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
