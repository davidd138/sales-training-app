'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminGuard } from '@/components/layout/AdminGuard';
import { useQuery, useMutation } from '@/hooks/useGraphQL';
import { GET_GUIDELINES } from '@/lib/graphql/queries';
import { CREATE_GUIDELINE, UPDATE_GUIDELINE } from '@/lib/graphql/mutations';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { Guideline } from '@/types';

export default function AdminGuidelinesPage() {
  return (
    <AdminGuard>
      <GuidelinesContent />
    </AdminGuard>
  );
}

function GuidelinesContent() {
  const { data: guidelines, loading, execute: fetchGuidelines } = useQuery<Guideline[]>(GET_GUIDELINES);
  const { execute: createGuideline, loading: creating } = useMutation(CREATE_GUIDELINE);
  const { execute: updateGuideline } = useMutation(UPDATE_GUIDELINE);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => { fetchGuidelines(); }, [fetchGuidelines]);

  const handleCreate = useCallback(async () => {
    await createGuideline({ input: { title, content } });
    setTitle('');
    setContent('');
    setShowForm(false);
    fetchGuidelines();
  }, [title, content, createGuideline, fetchGuidelines]);

  const handleToggle = useCallback(async (g: Guideline) => {
    await updateGuideline({ input: { id: g.id, isActive: !g.isActive } });
    fetchGuidelines();
  }, [updateGuideline, fetchGuidelines]);

  if (loading && !guidelines) return <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Criterios de Evaluacion</h1>
          <p className="text-slate-400 mt-1">Define los criterios que usara la IA para analizar las conversaciones de venta.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>Nuevo Criterio</Button>
      </div>

      {showForm && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
          <input
            className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 mb-3"
            placeholder="Titulo del criterio"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 mb-3"
            rows={4}
            placeholder="Descripcion detallada del criterio de evaluacion..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={creating || !title || !content}>Crear</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {(guidelines || []).map((g: Guideline) => (
          <div key={g.id} className={`bg-slate-800 rounded-xl border p-5 ${g.isActive ? 'border-slate-700' : 'border-slate-700/50 opacity-60'}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white">{g.title}</h3>
                <p className="text-sm text-slate-400 mt-1 whitespace-pre-wrap">{g.content}</p>
              </div>
              <button
                onClick={() => handleToggle(g)}
                className={`ml-4 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  g.isActive ? 'bg-primary' : 'bg-slate-600'
                }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  g.isActive ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        ))}
        {(guidelines || []).length === 0 && (
          <p className="text-center py-8 text-slate-400">No hay criterios creados. Crea uno para personalizar la evaluacion.</p>
        )}
      </div>
    </div>
  );
}
