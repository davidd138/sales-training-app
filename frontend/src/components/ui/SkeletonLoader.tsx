type Props = { lines?: number; className?: string; variant?: 'text' | 'card' | 'avatar' | 'chart' };

export function SkeletonLoader({ lines = 3, className = '', variant = 'text' }: Props) {
  if (variant === 'avatar') {
    return <div className={`w-10 h-10 rounded-full bg-slate-700 animate-pulse ${className}`} />;
  }

  if (variant === 'card') {
    return (
      <div className={`bg-slate-800 rounded-xl p-5 border border-slate-700/50 animate-pulse ${className}`}>
        <div className="h-4 bg-slate-700 rounded w-3/4 mb-3" />
        <div className="h-3 bg-slate-700 rounded w-full mb-2" />
        <div className="h-3 bg-slate-700 rounded w-5/6" />
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className={`bg-slate-800 rounded-xl p-5 border border-slate-700/50 animate-pulse ${className}`}>
        <div className="h-4 bg-slate-700 rounded w-1/3 mb-4" />
        <div className="flex items-end gap-2 h-32">
          {[40, 65, 45, 80, 55, 70, 90, 60].map((h, i) => (
            <div key={i} className="flex-1 bg-slate-700 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2.5 animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-slate-700 rounded ${i === lines - 1 ? 'w-4/5' : 'w-full'}`} />
      ))}
    </div>
  );
}
