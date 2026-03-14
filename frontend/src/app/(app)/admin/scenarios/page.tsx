'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminGuard } from '@/components/layout/AdminGuard';
import { useQuery, useMutation } from '@/hooks/useGraphQL';
import { LIST_SCENARIOS } from '@/lib/graphql/queries';
import { CREATE_SCENARIO, UPDATE_SCENARIO, DELETE_SCENARIO } from '@/lib/graphql/mutations';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { Scenario } from '@/types';

const VOICES = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

const EMPTY_PERSONA = {
  personality: '',
  concerns: '',
  objectives: '',
  currentSituation: '',
  communicationStyle: '',
  decisionMakingStyle: '',
  hiddenAgenda: '',
  buyingSignals: '',
  redLines: '',
};

export default function AdminScenariosPage() {
  return (
    <AdminGuard>
      <ScenariosContent />
    </AdminGuard>
  );
}

function ScenariosContent() {
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
  }, [form, editingId, createScenario, updateScenario, fetchScenarios]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Seguro que quieres eliminar este escenario?')) return;
    await deleteScenario({ id });
    fetchScenarios();
  }, [deleteScenario, fetchScenarios]);

  if (loading && !scenarios) return <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestion de Escenarios</h1>
          <p className="text-slate-400 mt-1">Crea y configura escenarios de entrenamiento con personas IA realistas.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>Nuevo Escenario</Button>
      </div>

      {showForm && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {editingId ? 'Editar Escenario' : 'Nuevo Escenario'}
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600" placeholder="Nombre del escenario" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600" placeholder="Empresa del cliente" value={form.clientCompany} onChange={(e) => setForm({ ...form, clientCompany: e.target.value })} />
            <input className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600" placeholder="Nombre del cliente" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
            <input className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600" placeholder="Cargo del cliente" value={form.clientTitle} onChange={(e) => setForm({ ...form, clientTitle: e.target.value })} />
            <input className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600" placeholder="Industria" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            <div className="flex gap-2">
              <select className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 flex-1" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d === 'easy' ? 'Facil' : d === 'medium' ? 'Medio' : 'Dificil'}</option>)}
              </select>
              <select className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 flex-1" value={form.voice} onChange={(e) => setForm({ ...form, voice: e.target.value })}>
                {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <textarea className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 mb-4" rows={2} placeholder="Descripcion del escenario" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <h3 className="text-sm font-semibold text-slate-300 mb-3">Configuracion de Persona IA</h3>
          <div className="grid grid-cols-1 gap-3 mb-4">
            {[
              { key: 'personality', label: 'Personalidad', hint: 'Ej: Esceptica, analitica, quiere datos de ROI...' },
              { key: 'concerns', label: 'Preocupaciones', hint: 'Ej: Fiabilidad del servicio, coste de cambio...' },
              { key: 'objectives', label: 'Objetivos', hint: 'Ej: Reducir costes 20%, certificacion renovable...' },
              { key: 'currentSituation', label: 'Situacion actual', hint: 'Ej: Contrato con proveedor X a punto de expirar...' },
              { key: 'communicationStyle', label: 'Estilo comunicacion', hint: 'Ej: Directo, formal, usa tecnicismos...' },
              { key: 'hiddenAgenda', label: 'Agenda oculta', hint: 'Ej: Quiere impresionar a su junta directiva...' },
              { key: 'buyingSignals', label: 'Senales de compra', hint: 'Ej: Reacciona bien a datos de ROI y casos de exito...' },
              { key: 'redLines', label: 'Lineas rojas', hint: 'Ej: Se frustra si no le escuchan, odia las ventas agresivas...' },
            ].map(({ key, label, hint }) => (
              <div key={key}>
                <label className="text-xs text-slate-400 mb-1 block">{label}</label>
                <textarea
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600"
                  rows={2}
                  placeholder={hint}
                  value={(form.persona as any)[key] || ''}
                  onChange={(e) => setForm({ ...form, persona: { ...form.persona, [key]: e.target.value } })}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={creating || updatingScenario || !form.name}>
              {editingId ? 'Guardar Cambios' : 'Crear Escenario'}
            </Button>
            <Button variant="ghost" onClick={resetForm}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(scenarios || []).map((s: Scenario) => (
          <div key={s.id} className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-base font-semibold text-white">{s.name}</h3>
                <p className="text-xs text-slate-400">{s.clientName} - {s.clientTitle} ({s.clientCompany})</p>
              </div>
              <div className="flex gap-1">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  s.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                  s.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {s.difficulty === 'easy' ? 'Facil' : s.difficulty === 'medium' ? 'Medio' : 'Dificil'}
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-3">{s.description}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
              <span>Industria: {s.industry}</span>
              <span>|</span>
              <span>Voz: {s.voice || 'coral'}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => handleEdit(s)}>Editar</Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)}>Eliminar</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
