'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@/hooks/useGraphQL';
import { LIST_SCENARIOS } from '@/lib/graphql/queries';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { Scenario } from '@/types';

const DIFFICULTY_ORDER = { easy: 0, medium: 1, hard: 2 };

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

  const sectionLabels = {
    easy: { label: 'Nivel Facil', desc: 'Clientes receptivos — ideal para practicar descubrimiento', color: 'text-green-400' },
    medium: { label: 'Nivel Medio', desc: 'Clientes exigentes — objeciones reales y comparaciones', color: 'text-amber-400' },
    hard: { label: 'Nivel Dificil', desc: 'Clientes hostiles — cada segundo cuenta', color: 'text-red-400' },
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Selecciona un escenario</h1>
      <p className="text-slate-400 mb-8">Elige un cliente para practicar tu conversacion de ventas</p>

      {loading && !data ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="space-y-10">
          {(Object.entries(grouped) as [keyof typeof sectionLabels, Scenario[]][]).map(([level, items]) => {
            if (items.length === 0) return null;
            const info = sectionLabels[level];
            return (
              <div key={level}>
                <div className="mb-4">
                  <h2 className={`text-lg font-semibold ${info.color}`}>{info.label}</h2>
                  <p className="text-slate-500 text-sm">{info.desc}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map(scenario => {
                    let persona: any = {};
                    try { persona = typeof scenario.persona === 'string' ? JSON.parse(scenario.persona) : scenario.persona || {}; } catch {}
                    return (
                      <Card
                        key={scenario.id}
                        onClick={() => router.push(`/training?id=${scenario.id}`)}
                        className="group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-white font-semibold group-hover:text-primary transition-colors">{scenario.clientName}</h3>
                            <p className="text-slate-400 text-sm">{scenario.clientTitle} — {scenario.clientCompany}</p>
                          </div>
                          <Badge value={scenario.difficulty} />
                        </div>
                        <p className="text-slate-300 text-sm mb-3 line-clamp-2">{scenario.description}</p>
                        {persona.personality && (
                          <p className="text-slate-500 text-xs mb-3 line-clamp-1 italic">{persona.personality}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{scenario.industry}</span>
                        </div>
                      </Card>
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
