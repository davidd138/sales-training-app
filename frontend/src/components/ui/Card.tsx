type Props = { children: React.ReactNode; className?: string; onClick?: () => void };

export function Card({ children, className = '', onClick }: Props) {
  return (
    <div
      className={`bg-slate-800 rounded-xl p-5 border border-slate-700/50 transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-slate-600 hover:shadow-lg hover:shadow-slate-900/50 active:scale-[0.99]' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      {children}
    </div>
  );
}
