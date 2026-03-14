'use client';

import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string };

export function Input({ label, hint, className = '', ...props }: InputProps) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>}
      <input
        className={`w-full px-3.5 py-2.5 bg-slate-700/80 border border-slate-600/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all hover:border-slate-500 ${className}`}
        {...props}
      />
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string };

export function Textarea({ label, hint, className = '', ...props }: TextareaProps) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>}
      <textarea
        className={`w-full px-3.5 py-2.5 bg-slate-700/80 border border-slate-600/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all hover:border-slate-500 resize-none ${className}`}
        {...props}
      />
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}
