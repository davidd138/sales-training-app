'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/layout/AdminGuard';
import { useQuery, useMutation } from '@/hooks/useGraphQL';
import { GET_GUIDELINES } from '@/lib/graphql/queries';
import { CREATE_GUIDELINE, UPDATE_GUIDELINE } from '@/lib/graphql/mutations';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
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

  if (loading && !guidelines) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const items = guidelines || [];
  const activeCount = items.filter(g => g.isActive).length;
  const inactiveCount = items.filter(g => !g.isActive).length;

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6">
        <Link href="/admin" className="text-slate-400 hover:text-amber-400 transition-colors">
          Admin
        </Link>
        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent font-medium">
          Criterios de Evaluacion
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Criterios de Evaluacion
          </h1>
          <p className="text-slate-400 mt-2">Define los criterios que usara la IA para analizar las conversaciones de venta.</p>
        </div>
        <Button
          className="!bg-gradient-to-r !from-amber-500 !to-orange-500 hover:!from-amber-600 hover:!to-orange-600 shrink-0"
          onClick={() => setShowForm(!showForm)}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo Criterio
          </span>
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="!p-4 text-center">
          <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Total</p>
          <p className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{items.length}</p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Activos</p>
          <p className="text-2xl font-bold text-emerald-400">{activeCount}</p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Inactivos</p>
          <p className="text-2xl font-bold text-slate-500">{inactiveCount}</p>
        </Card>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="mb-8 !border-amber-500/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">Nuevo Criterio de Evaluacion</h2>
          </div>

          <div className="space-y-4">
            <Input
              label="Titulo del criterio"
              placeholder="Ej: Escucha activa, Manejo de objeciones, Cierre de venta..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              label="Descripcion detallada"
              placeholder="Describe en detalle que aspectos debe evaluar la IA sobre este criterio. Puedes incluir ejemplos de buenas y malas practicas..."
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 pt-5 mt-5 border-t border-slate-700/50">
            <Button
              className="!bg-gradient-to-r !from-amber-500 !to-orange-500 hover:!from-amber-600 hover:!to-orange-600"
              onClick={handleCreate}
              disabled={creating || !title || !content}
              loading={creating}
            >
              Crear Criterio
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </Card>
      )}

      {/* Guidelines List */}
      {items.length === 0 && !showForm ? (
        <EmptyState
          title="Sin criterios de evaluacion"
          description="Crea criterios personalizados para que la IA evalúe las conversaciones de venta segun tus estandares."
          action={{ label: 'Crear Criterio', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-4">
          {items.map((g: Guideline) => (
            <Card
              key={g.id}
              className={`group transition-all duration-300 ${
                g.isActive
                  ? '!border-amber-500/20 hover:!border-amber-500/40'
                  : '!border-slate-700/30 opacity-60 hover:opacity-80'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Status Indicator */}
                <div className={`mt-1 w-3 h-3 rounded-full shrink-0 ${
                  g.isActive
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-600'
                }`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className={`text-base font-semibold transition-colors ${
                        g.isActive ? 'text-white' : 'text-slate-400'
                      }`}>
                        {g.title}
                      </h3>
                      <div className={`mt-3 text-sm leading-relaxed whitespace-pre-wrap rounded-lg p-4 ${
                        g.isActive
                          ? 'bg-slate-700/30 text-slate-300 border border-slate-700/50'
                          : 'bg-slate-800/30 text-slate-500 border border-slate-700/30'
                      }`}>
                        {g.content}
                      </div>
                    </div>

                    {/* Toggle */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleToggle(g)}
                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                          g.isActive
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                            : 'bg-slate-600'
                        }`}
                        role="switch"
                        aria-checked={g.isActive}
                      >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                          g.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                      <span className={`text-xs font-medium ${g.isActive ? 'text-amber-400' : 'text-slate-500'}`}>
                        {g.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
