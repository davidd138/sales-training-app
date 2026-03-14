'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@/hooks/useGraphQL';
import { LIST_SCENARIOS } from '@/lib/graphql/queries';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { Scenario } from '@/types';

export default function ScenariosPage() {
  const router = useRouter();
  const { data, loading, execute } = useQuery<Scenario[]>(LIST_SCENARIOS);

  useEffect(() => { execute(); }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Selecciona un escenario</h1>
      <p className="text-slate-400 mb-6">Elige un cliente para practicar tu conversación de ventas</p>

      {loading && !data ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.map(scenario => (
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
              <p className="text-slate-300 text-sm mb-3">{scenario.description}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{scenario.industry}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
