'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useQuery, useMutation } from '@/hooks/useGraphQL';
import { GET_GUIDELINES } from '@/lib/graphql/queries';
import { CREATE_GUIDELINE, UPDATE_GUIDELINE } from '@/lib/graphql/mutations';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { Guideline } from '@/types';

export default function GuidelinesPage() {
  const { data, loading, execute: loadGuidelines } = useQuery<Guideline[]>(GET_GUIDELINES);
  const createMutation = useMutation(CREATE_GUIDELINE);
  const updateMutation = useMutation(UPDATE_GUIDELINE);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => { loadGuidelines(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await createMutation.execute({ input: { title, content, isActive: true } });
    setTitle('');
    setContent('');
    setShowForm(false);
    loadGuidelines();
  }

  async function toggleActive(g: Guideline) {
    await updateMutation.execute({ input: { id: g.id, isActive: !g.isActive } });
    loadGuidelines();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Guidelines de ventas</h1>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'}>
          {showForm ? 'Cancelar' : 'Nueva guideline'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <Input label="Título" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Técnicas de cierre" required />
            <Textarea label="Contenido" value={content} onChange={e => setContent(e.target.value)} placeholder="Describe la guideline..." rows={4} required />
            {createMutation.error && <p className="text-danger text-sm">{createMutation.error}</p>}
            <Button type="submit" loading={createMutation.loading}>Crear</Button>
          </form>
        </Card>
      )}

      {loading && !data ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : data?.length === 0 ? (
        <Card><p className="text-slate-400 text-center">No hay guidelines. Crea la primera.</p></Card>
      ) : (
        <div className="space-y-3">
          {data?.map(g => (
            <Card key={g.id} className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className={`font-medium ${g.isActive ? 'text-white' : 'text-slate-500'}`}>{g.title}</h3>
                <p className={`text-sm mt-1 ${g.isActive ? 'text-slate-300' : 'text-slate-600'}`}>{g.content}</p>
              </div>
              <button
                onClick={() => toggleActive(g)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${g.isActive ? 'bg-primary' : 'bg-slate-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${g.isActive ? 'translate-x-5' : ''}`} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
