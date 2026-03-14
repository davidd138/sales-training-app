'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

const FEATURES = [
  { icon: 'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z', title: 'Conversaciones con IA', desc: 'Practica con clientes simulados que reaccionan como personas reales' },
  { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', title: 'Analisis Experto', desc: 'Feedback detallado basado en metodologias SPIN, Challenger y Sandler' },
  { icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Mejora Continua', desc: 'Monitoriza tu progreso y compite con tu equipo en el ranking' },
];

const TESTIMONIALS = [
  { name: 'Carlos Ruiz', role: 'Director Comercial, Iberenergy', text: 'SalesPulse ha transformado como entrenamos a nuestro equipo. Los nuevos comerciales alcanzan productividad en la mitad de tiempo.' },
  { name: 'Elena Vidal', role: 'VP Ventas, TechSolutions', text: 'El analisis con IA es increiblemente preciso. Identifica patrones que los managers humanos no detectamos.' },
];

const STATS = [
  { value: '8+', label: 'Escenarios' },
  { value: '6', label: 'Categorias de analisis' },
  { value: '24/7', label: 'Disponible' },
];

export default function LoginPage() {
  const { signIn, error } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/dashboard');
    } catch {
      // error handled by useAuth
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Hero / Marketing section */}
      <div className="lg:flex-1 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
          {/* Animated pulse lines */}
          <svg className="absolute top-1/2 left-0 w-full h-32 -translate-y-1/2 opacity-10" viewBox="0 0 800 100" preserveAspectRatio="none">
            <path d="M0,50 L200,50 L250,20 L300,80 L350,10 L400,70 L430,40 L450,50 L800,50" stroke="url(#hero-gradient)" strokeWidth="2" fill="none" />
            <defs>
              <linearGradient id="hero-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10">
          <Logo size="lg" />
          <h1 className="text-3xl lg:text-5xl font-bold text-white mt-8 lg:mt-16 leading-tight">
            Entrena tus ventas<br />
            <span className="gradient-text">con inteligencia artificial</span>
          </h1>
          <p className="text-slate-400 text-lg mt-4 max-w-lg">
            Practica conversaciones comerciales con clientes simulados por IA.
            Recibe analisis experto y mejora tu cierre.
          </p>
        </div>

        {/* Features */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "SalesPulse AI",
          "description": "Plataforma de entrenamiento de ventas con inteligencia artificial",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "EUR"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "127"
          }
        })}} />

        <div className="relative z-10 mt-8 lg:mt-0 space-y-4 hidden lg:block">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium text-sm">{f.title}</p>
                <p className="text-slate-400 text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="relative z-10 mt-8 lg:mt-0 space-y-3 hidden lg:block">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
              <div className="flex items-start gap-3">
                <span className="text-2xl text-blue-400 leading-none shrink-0">&ldquo;</span>
                <div>
                  <p className="text-slate-300 text-sm italic">{t.text}</p>
                  <div className="mt-2">
                    <p className="text-white text-sm font-medium">{t.name}</p>
                    <p className="text-slate-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="relative z-10 flex gap-8 mt-8 lg:mt-0">
          {STATS.map((s, i) => (
            <div key={i}>
              <p className="text-2xl font-bold gradient-text">{s.value}</p>
              <p className="text-slate-500 text-xs uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form section */}
      <div className="lg:w-[480px] flex items-center justify-center p-8 lg:p-16 bg-slate-800/50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Logo size="md" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Bienvenido de nuevo</h2>
          <p className="text-slate-400 text-sm mb-8">Inicia sesion para continuar tu entrenamiento</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@empresa.com" required autoComplete="email" />
            <Input label="Contrasena" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Tu contrasena" required autoComplete="current-password" />
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            <Button type="submit" loading={loading} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0">
              Entrar
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Registrate</Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
            <p className="text-xs text-slate-500">
              Plataforma de entrenamiento profesional para equipos comerciales
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
