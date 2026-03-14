type Props = { children: React.ReactNode; className?: string; onClick?: () => void };

export function Card({ children, className = '', onClick }: Props) {
  return (
    <div
      className={`bg-slate-800 rounded-xl p-5 border border-slate-700/50 ${onClick ? 'cursor-pointer hover:border-slate-600 transition-colors' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
