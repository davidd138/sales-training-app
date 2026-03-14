'use client';

type Props = { className?: string; size?: 'sm' | 'md' | 'lg'; showText?: boolean };

export function Logo({ className = '', size = 'md', showText = true }: Props) {
  const sizes = { sm: 24, md: 32, lg: 48 };
  const textSizes = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' };
  const s = sizes[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative">
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="pulse-gradient" x1="0" y1="0" x2="48" y2="48">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <linearGradient id="pulse-line-gradient" x1="0" y1="24" x2="48" y2="24">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="50%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
          {/* Background circle */}
          <circle cx="24" cy="24" r="22" fill="url(#pulse-gradient)" opacity="0.15" />
          <circle cx="24" cy="24" r="22" stroke="url(#pulse-gradient)" strokeWidth="1.5" opacity="0.3" />
          {/* Pulse line - heartbeat style */}
          <path
            d="M6 24 L14 24 L17 18 L21 32 L25 12 L29 30 L32 20 L34 24 L42 24"
            stroke="url(#pulse-line-gradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Small signal dots */}
          <circle cx="6" cy="24" r="1.5" fill="#60A5FA" opacity="0.6" />
          <circle cx="42" cy="24" r="1.5" fill="#06B6D4" opacity="0.6" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold tracking-tight leading-none ${textSizes[size]}`}>
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Sales</span>
            <span className="text-white">Pulse</span>
          </span>
          {size !== 'sm' && (
            <span className="text-[10px] font-medium text-slate-400 tracking-widest uppercase">AI Training</span>
          )}
        </div>
      )}
    </div>
  );
}
