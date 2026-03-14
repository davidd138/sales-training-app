const colorMap: Record<string, string> = {
  easy: 'bg-emerald-500/20 text-emerald-400',
  medium: 'bg-amber-500/20 text-amber-400',
  hard: 'bg-red-500/20 text-red-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  in_progress: 'bg-amber-500/20 text-amber-400',
};

const labelMap: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
  completed: 'Completada',
  in_progress: 'En curso',
};

type Props = { value: string; className?: string };

export function Badge({ value, className = '' }: Props) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[value] || 'bg-slate-600 text-slate-300'} ${className}`}>
      {labelMap[value] || value}
    </span>
  );
}
