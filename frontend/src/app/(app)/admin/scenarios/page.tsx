'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/layout/AdminGuard';
import { useQuery, useMutation } from '@/hooks/useGraphQL';
import { LIST_SCENARIOS } from '@/lib/graphql/queries';
import { CREATE_SCENARIO, UPDATE_SCENARIO, DELETE_SCENARIO } from '@/lib/graphql/mutations';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import type { Scenario } from '@/types';

const VOICE_OPTIONS = [
  { id: 'alloy', label: 'Alloy', description: 'Neutral y profesional' },
  { id: 'ash', label: 'Ash', description: 'Grave y autoritaria' },
  { id: 'ballad', label: 'Ballad', description: 'Suave y melodica' },
  { id: 'coral', label: 'Coral', description: 'Calida y natural' },
  { id: 'echo', label: 'Echo', description: 'Masculina y profunda' },
  { id: 'sage', label: 'Sage', description: 'Madura y tranquila' },
  { id: 'shimmer', label: 'Shimmer', description: 'Brillante y energica' },
  { id: 'verse', label: 'Verse', description: 'Dinamica y expresiva' },
] as const;
const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

const DIFFICULTY_CONFIG = {
  easy: { label: 'Facil', color: 'from-emerald-500 to-green-500', bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', icon: '1' },
  medium: { label: 'Medio', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400', icon: '2' },
  hard: { label: 'Dificil', color: 'from-red-500 to-rose-500', bg: 'bg-red-500/10 border-red-500/30 text-red-400', icon: '3' },
};

const EMPTY_PERSONA = {
  personality: '',
  concerns: '',
  objectives: '',
  currentSituation: '',
  communicationStyle: '',
  hiddenAgenda: '',
  buyingSignals: '',
  redLines: '',
};

const PERSONA_FIELDS = [
  { key: 'personality', label: 'Personalidad', hint: 'Ej: Esceptica, analitica, quiere datos de ROI...' },
  { key: 'concerns', label: 'Preocupaciones', hint: 'Ej: Fiabilidad del servicio, coste de cambio...' },
  { key: 'objectives', label: 'Objetivos', hint: 'Ej: Reducir costes 20%, certificacion renovable...' },
  { key: 'currentSituation', label: 'Situacion actual', hint: 'Ej: Contrato con proveedor X a punto de expirar...' },
  { key: 'communicationStyle', label: 'Estilo de comunicacion', hint: 'Ej: Directo, formal, usa tecnicismos...' },
  { key: 'hiddenAgenda', label: 'Agenda oculta', hint: 'Ej: Quiere impresionar a su junta directiva...' },
  { key: 'buyingSignals', label: 'Senales de compra', hint: 'Ej: Reacciona bien a datos de ROI y casos de exito...' },
  { key: 'redLines', label: 'Lineas rojas', hint: 'Ej: Se frustra si no le escuchan, odia las ventas agresivas...' },
];

export default function AdminScenariosPage() {
  return (
    <AdminGuard>
      <ScenariosContent />
    </AdminGuard>
  );
}

function ScenariosContent() {
  const { addToast } = useToast();
  const { data: scenarios, loading, execute: fetchScenarios } = useQuery<Scenario[]>(LIST_SCENARIOS);
  const { execute: createScenario, loading: creating } = useMutation(CREATE_SCENARIO);
  const { execute: updateScenario, loading: updatingScenario } = useMutation(UPDATE_SCENARIO);
  const { execute: deleteScenario } = useMutation(DELETE_SCENARIO);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', clientName: '', clientTitle: '',
    clientCompany: '', industry: '', difficulty: 'medium', voice: 'coral',
    persona: { ...EMPTY_PERSONA },
  });

  useEffect(() => { fetchScenarios(); }, [fetchScenarios]);

  const resetForm = () => {
    setForm({
      name: '', description: '', clientName: '', clientTitle: '',
      clientCompany: '', industry: '', difficulty: 'medium', voice: 'coral',
      persona: { ...EMPTY_PERSONA },
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (s: Scenario) => {
    let persona = { ...EMPTY_PERSONA };
    try { persona = { ...EMPTY_PERSONA, ...(typeof s.persona === 'string' ? JSON.parse(s.persona) : s.persona) }; } catch {}
    setForm({
      name: s.name, description: s.description, clientName: s.clientName,
      clientTitle: s.clientTitle, clientCompany: s.clientCompany,
      industry: s.industry, difficulty: s.difficulty, voice: s.voice || 'coral',
      persona,
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleSubmit = useCallback(async () => {
    try {
      const input = {
        ...form,
        persona: JSON.stringify(form.persona),
      };

      if (editingId) {
        await updateScenario({ input: { id: editingId, ...input } });
      } else {
        await createScenario({ input });
      }
      resetForm();
      fetchScenarios();
      addToast(editingId ? 'Escenario actualizado correctamente' : 'Escenario creado correctamente');
    } catch {
      addToast('Error al guardar escenario', 'error');
    }
  }, [form, editingId, createScenario, updateScenario, fetchScenarios, addToast]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Seguro que quieres eliminar este escenario?')) return;
    try {
      await deleteScenario({ id });
      fetchScenarios();
      addToast('Escenario eliminado correctamente');
    } catch {
      addToast('Error al guardar escenario', 'error');
    }
  }, [deleteScenario, fetchScenarios, addToast]);

  if (loading && !scenarios) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

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
          Escenarios
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Gestion de Escenarios
          </h1>
          <p className="text-slate-400 mt-2">Crea y configura escenarios de entrenamiento con personas IA realistas.</p>
        </div>
        <Button
          className="!bg-gradient-to-r !from-amber-500 !to-orange-500 hover:!from-amber-600 hover:!to-orange-600 shrink-0"
          onClick={() => { resetForm(); setShowForm(true); }}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo Escenario
          </span>
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="mb-8 !border-amber-500/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">
              {editingId ? 'Editar Escenario' : 'Nuevo Escenario'}
            </h2>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Input
              label="Nombre del escenario"
              placeholder="Ej: Venta de software SaaS"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Empresa del cliente"
              placeholder="Ej: TechCorp S.L."
              value={form.clientCompany}
              onChange={(e) => setForm({ ...form, clientCompany: e.target.value })}
            />
            <Input
              label="Nombre del cliente"
              placeholder="Ej: Maria Garcia"
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            />
            <Input
              label="Cargo del cliente"
              placeholder="Ej: Directora de Compras"
              value={form.clientTitle}
              onChange={(e) => setForm({ ...form, clientTitle: e.target.value })}
            />
            <Input
              label="Industria"
              placeholder="Ej: Tecnologia, Salud, Finanzas..."
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            />
          </div>

          {/* Voice Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">Voz del cliente IA</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {VOICE_OPTIONS.map(v => {
                const isSelected = form.voice === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setForm({ ...form, voice: v.id })}
                    className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                      isSelected
                        ? 'border-amber-500/60 bg-amber-500/10 shadow-lg shadow-amber-500/5'
                        : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <svg className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                      </svg>
                      <span className={`text-sm font-semibold ${isSelected ? 'text-amber-300' : 'text-slate-300'}`}>
                        {v.label}
                      </span>
                    </div>
                    <p className={`text-xs ${isSelected ? 'text-amber-400/70' : 'text-slate-500'}`}>
                      {v.description}
                    </p>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">Nivel de dificultad</label>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTIES.map(d => {
                const config = DIFFICULTY_CONFIG[d];
                const isSelected = form.difficulty === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm({ ...form, difficulty: d })}
                    className={`relative rounded-xl border-2 p-4 text-center transition-all ${
                      isSelected
                        ? `border-transparent bg-gradient-to-br ${config.color} text-white shadow-lg`
                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className={`text-2xl font-bold mb-1 ${isSelected ? 'text-white' : ''}`}>{config.icon}</div>
                    <div className={`text-sm font-semibold ${isSelected ? 'text-white' : ''}`}>{config.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <Textarea
              label="Descripcion del escenario"
              placeholder="Describe el contexto de la venta, el producto/servicio y los objetivos del vendedor..."
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Persona */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white">Configuracion de Persona IA</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PERSONA_FIELDS.map(({ key, label, hint }) => (
                <div key={key} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <label className="block text-xs font-medium text-amber-400/80 mb-1.5">{label}</label>
                  <textarea
                    className="w-full bg-slate-700/50 text-slate-200 rounded-lg px-3 py-2 text-sm border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 transition-all resize-none placeholder-slate-500"
                    rows={2}
                    placeholder={hint}
                    value={(form.persona as any)[key] || ''}
                    onChange={(e) => setForm({ ...form, persona: { ...form.persona, [key]: e.target.value } })}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-700/50">
            <Button
              className="!bg-gradient-to-r !from-amber-500 !to-orange-500 hover:!from-amber-600 hover:!to-orange-600"
              onClick={handleSubmit}
              disabled={creating || updatingScenario || !form.name}
              loading={creating || updatingScenario}
            >
              {editingId ? 'Guardar Cambios' : 'Crear Escenario'}
            </Button>
            <Button variant="ghost" onClick={resetForm}>Cancelar</Button>
          </div>
        </Card>
      )}

      {/* Scenario Cards */}
      {(scenarios || []).length === 0 && !showForm ? (
        <EmptyState
          title="Sin escenarios"
          description="Crea tu primer escenario de entrenamiento para que los vendedores puedan practicar."
          action={{ label: 'Crear Escenario', onClick: () => { resetForm(); setShowForm(true); } }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(scenarios || []).map((s: Scenario) => (
            <Card key={s.id} className="group hover:border-amber-500/30 transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white truncate group-hover:text-amber-400 transition-colors">
                    {s.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {s.clientName} - {s.clientTitle}
                  </p>
                </div>
                <Badge value={s.difficulty} />
              </div>

              <p className="text-sm text-slate-400 mb-4 line-clamp-2">{s.description}</p>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded-md">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5z" />
                  </svg>
                  {s.clientCompany}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded-md">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  {s.industry}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded-md">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                  {(VOICE_OPTIONS.find(v => v.id === (s.voice || 'coral'))?.label) || s.voice || 'Coral'}
                </span>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-700/50">
                <Button size="sm" variant="ghost" onClick={() => handleEdit(s)} className="flex-1">
                  <span className="flex items-center justify-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                    Editar
                  </span>
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)} className="text-red-400 hover:!bg-red-500/10">
                  <span className="flex items-center justify-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    Eliminar
                  </span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
