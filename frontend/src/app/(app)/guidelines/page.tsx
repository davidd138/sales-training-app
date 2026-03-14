'use client';

import { useEffect } from 'react';
import { useQuery } from '@/hooks/useGraphQL';
import { GET_GUIDELINES } from '@/lib/graphql/queries';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import type { Guideline } from '@/types';

export default function GuidelinesPage() {
  const { data, loading, execute: loadGuidelines } = useQuery<Guideline[]>(GET_GUIDELINES);

  useEffect(() => { loadGuidelines(); }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Criterios de Evaluacion</h1>
        <p className="text-slate-400 mt-1">Estos son los criterios que la IA utiliza para evaluar tus conversaciones de venta.</p>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !data || data.length === 0 ? (
        <Card><p className="text-slate-400 text-center">No hay criterios configurados.</p></Card>
      ) : (
        <div className="space-y-3">
          {data.filter(g => g.isActive).map(g => (
            <Card key={g.id}>
              <h3 className="font-medium text-white">{g.title}</h3>
              <p className="text-sm mt-1 text-slate-300 whitespace-pre-wrap">{g.content}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
