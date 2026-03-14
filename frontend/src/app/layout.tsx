import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/layout/AuthProvider';
import { ToastProvider } from '@/components/ui/Toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'SalesPulse AI — Entrenamiento de Ventas con IA',
    template: '%s | SalesPulse AI',
  },
  description: 'Plataforma de entrenamiento de ventas con IA. Practica conversaciones comerciales con clientes simulados por inteligencia artificial y recibe feedback experto en tiempo real.',
  keywords: ['ventas', 'entrenamiento', 'IA', 'inteligencia artificial', 'comercial', 'sales training', 'roleplay'],
  authors: [{ name: 'SalesPulse AI' }],
  openGraph: {
    title: 'SalesPulse AI — Entrenamiento de Ventas con IA',
    description: 'Practica ventas con clientes IA. Mejora tu cierre. Resultados medibles.',
    type: 'website',
    locale: 'es_ES',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0F172A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>" />
      </head>
      <body className={inter.className}>
        <AuthProvider><ToastProvider>{children}</ToastProvider></AuthProvider>
      </body>
    </html>
  );
}
