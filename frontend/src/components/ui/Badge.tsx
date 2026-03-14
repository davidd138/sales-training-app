const colorMap: Record<string, string> = {
  easy: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  medium: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  hard: 'bg-red-500/15 text-red-400 border border-red-500/25',
  completed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  in_progress: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  active: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  suspended: 'bg-red-500/15 text-red-400 border border-red-500/25',
  expired: 'bg-orange-500/15 text-orange-400 border border-orange-500/25',
  admin: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30',
};

const labelMap: Record<string, string> = {
  easy: 'Principiante',
  medium: 'Intermedio',
  hard: 'Experto',
  completed: 'Completada',
  in_progress: 'En curso',
  pending: 'Pendiente',
  active: 'Activo',
  suspended: 'Suspendido',
  expired: 'Expirado',
  admin: 'Admin',
};

type Props = { value: string; className?: string };

export function Badge({ value, className = '' }: Props) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[value] || 'bg-slate-600/50 text-slate-400 border border-slate-600/30'} ${className}`}>
      {labelMap[value] || value}
    </span>
  );
}
