'use client';

import { AuthGuard } from '@/components/layout/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Sidebar />
      <div className="md:ml-64 min-h-screen flex flex-col">
        <Topbar />
        <main className="flex-1 p-4 sm:p-6 bg-pattern"><ErrorBoundary>{children}</ErrorBoundary></main>
        <footer className="border-t border-slate-700/50 px-4 sm:px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>SalesPulse AI v1.0 — Entrenamiento de ventas con IA</span>
          <span className="hidden sm:inline">Potenciado por OpenAI + Claude</span>
        </footer>
      </div>
    </AuthGuard>
  );
}
