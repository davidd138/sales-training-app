'use client';

import { AuthGuard } from '@/components/layout/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-blue-500 focus:text-white focus:rounded-lg focus:text-sm">
        Saltar al contenido principal
      </a>
      <Sidebar />
      <div className="md:ml-64 min-h-screen flex flex-col">
        <Topbar />
        <main id="main-content" className="flex-1 p-4 sm:p-6 bg-pattern page-enter"><ErrorBoundary>{children}</ErrorBoundary></main>
        <footer className="border-t border-slate-700/50 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>SalesPulse AI v1.0 — Entrenamiento de ventas con IA</span>
          <div className="flex items-center gap-3">
            <a href="/privacy" className="hover:text-slate-300 transition-colors">Privacidad</a>
            <span className="text-slate-700">|</span>
            <a href="/terms" className="hover:text-slate-300 transition-colors">Terminos</a>
            <span className="text-slate-700">|</span>
            <a href="/cookies" className="hover:text-slate-300 transition-colors">Cookies</a>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span className="hidden sm:inline">Potenciado por OpenAI + Claude</span>
          </div>
        </footer>
      </div>
    </AuthGuard>
  );
}
