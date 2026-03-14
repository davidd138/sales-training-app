type Props = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  gradient?: 'blue' | 'cyan' | 'emerald' | 'amber' | 'purple';
};

const gradients = {
  blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
  cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/20',
  emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
  amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
  purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20',
};

const iconColors = {
  blue: 'text-blue-400',
  cyan: 'text-cyan-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  purple: 'text-purple-400',
};

export function StatsCard({ label, value, icon, trend, gradient = 'blue' }: Props) {
  return (
    <div className={`bg-gradient-to-br ${gradients[gradient]} rounded-xl p-5 border`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-slate-400 text-sm font-medium">{label}</p>
        {icon && <div className={iconColors[gradient]}>{icon}</div>}
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          <span className={`text-xs font-medium ${trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="text-xs text-slate-500">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
