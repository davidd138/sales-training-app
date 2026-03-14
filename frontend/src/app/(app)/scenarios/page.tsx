'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@/hooks/useGraphQL';
import { LIST_SCENARIOS } from '@/lib/graphql/queries';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
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

const difficultyTips: Record<string, { label: string; color: string; gradient: string; tips: string[] }> = {
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

export default function ScenariosPage() {
  const router = useRouter();
  const { data, loading, execute } = useQuery<Scenario[]>(LIST_SCENARIOS);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);

  useEffect(() => { execute().catch(() => {}); }, []);

  const scenarios = [...(data || [])].sort((a, b) =>
    (DIFFICULTY_ORDER[a.difficulty] || 0) - (DIFFICULTY_ORDER[b.difficulty] || 0)
  );

  const grouped = {
    easy: scenarios.filter(s => s.difficulty === 'easy'),
    medium: scenarios.filter(s => s.difficulty === 'medium'),
    hard: scenarios.filter(s => s.difficulty === 'hard'),
  };

  let selectedPersona: any = {};
  if (selectedScenario) {
    try { selectedPersona = typeof selectedScenario.persona === 'string' ? JSON.parse(selectedScenario.persona) : selectedScenario.persona || {}; } catch {}
  }
  const selectedDiff = selectedScenario ? (difficultyTips[selectedScenario.difficulty] || difficultyTips.medium) : null;

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
                        onClick={() => setSelectedScenario(scenario)}
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
                          <p className="text-slate-500 text-xs mb-3 line-clamp-1 italic">&quot;{persona.personality}&quot;</p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-slate-700/80 text-slate-400 px-2 py-0.5 rounded">{scenario.industry}</span>
                          </div>
                          <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            Ver detalles
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

      {/* Scenario detail preview modal */}
      {selectedScenario && selectedDiff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedScenario(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/50 animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Header gradient bar */}
            <div className={`bg-gradient-to-r ${selectedDiff.gradient} border-b border-slate-700/50 px-6 py-4 rounded-t-2xl`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${selectedDiff.color === 'text-emerald-400' ? 'bg-emerald-500/20' : selectedDiff.color === 'text-amber-400' ? 'bg-amber-500/20' : 'bg-red-500/20'} flex items-center justify-center text-xl font-bold ${selectedDiff.color}`}>
                    {selectedScenario.clientName[0]}
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-lg">{selectedScenario.clientName}</h2>
                    <p className="text-slate-400 text-sm">{selectedScenario.clientTitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedScenario(null)}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Company & meta */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm bg-slate-700/80 text-slate-300 px-3 py-1 rounded-lg">{selectedScenario.clientCompany}</span>
                <span className="text-xs bg-slate-700/80 text-slate-400 px-2 py-1 rounded">{selectedScenario.industry}</span>
                <Badge value={selectedScenario.difficulty} />
              </div>

              {/* Full description */}
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Descripcion del escenario</p>
                <p className="text-slate-300 text-sm leading-relaxed">{selectedScenario.description}</p>
              </div>

              {/* Personality preview */}
              {selectedPersona.personality && (
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-700/50">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Personalidad del cliente</p>
                  <p className="text-slate-300 text-sm italic leading-relaxed">&quot;{selectedPersona.personality}&quot;</p>
                </div>
              )}

              {/* Difficulty tips */}
              <div className={`bg-gradient-to-r ${selectedDiff.gradient} rounded-xl border p-4`}>
                <h3 className={`text-xs font-semibold ${selectedDiff.color} uppercase tracking-wider mb-2.5 flex items-center gap-2`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                  Consejos — {selectedDiff.label}
                </h3>
                <ul className="space-y-2">
                  {selectedDiff.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className={`mt-1 shrink-0 ${selectedDiff.color}`}>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={() => router.push(`/training?id=${selectedScenario.id}`)}
                  className="flex-1 py-3 text-sm bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0 shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    Empezar llamada
                  </span>
                </Button>
                <button
                  onClick={() => setSelectedScenario(null)}
                  className="px-5 py-3 text-sm text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-lg transition-all"
                >
                  Volver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
