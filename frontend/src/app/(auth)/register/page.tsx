'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

const TESTIMONIALS = [
  { name: 'Carlos Ruiz', role: 'Director Comercial, Iberenergy', text: 'SalesPulse ha transformado como entrenamos a nuestro equipo. Los nuevos comerciales alcanzan productividad en la mitad de tiempo.' },
  { name: 'Elena Vidal', role: 'VP Ventas, TechSolutions', text: 'El analisis con IA es increiblemente preciso. Identifica patrones que los managers humanos no detectamos.' },
  { name: 'Marta Gomez', role: 'Head of Sales, DataVerde', text: 'Nuestro ratio de cierre ha subido un 23% desde que usamos SalesPulse. Es como tener un coach de ventas disponible las 24h.' },
];

const TRUSTED_BY = ['Iberenergy', 'TechSolutions', 'DataVerde', 'NovaPay', 'CloudIberia'];

const BENEFITS = [
  'Practica ilimitada con clientes IA realistas',
  'Analisis basado en SPIN Selling y Challenger Sale',
  'Feedback personalizado de coach experto',
  '8+ escenarios de dificultad progresiva',
  'Ranking y estadisticas de equipo',
  'Disponible 24/7 desde cualquier dispositivo',
];

export default function RegisterPage() {
  const { signUp, confirmAccount, error, needsConfirmation } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const completed = await signUp(email, password, name);
      if (completed) router.replace('/dashboard');
    } catch {
      // error handled by useAuth
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await confirmAccount(code);
      router.replace('/dashboard');
    } catch {
      // error handled by useAuth
    } finally {
      setLoading(false);
    }
  }

  if (needsConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="w-full max-w-sm">
          <Logo size="md" className="mb-8" />
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700/50">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Verifica tu email</h2>
            <p className="text-slate-400 text-sm mb-6">Hemos enviado un codigo de verificacion a tu correo electronico.</p>
            <form onSubmit={handleConfirm} className="space-y-4">
              <Input label="Codigo de verificacion" value={code} onChange={e => setCode(e.target.value)} placeholder="123456" required autoComplete="one-time-code" />
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              <Button type="submit" loading={loading} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0">
                Confirmar
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Hero / Benefits section */}
      <div className="lg:flex-1 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <Logo size="lg" />
          <h1 className="text-3xl lg:text-5xl font-bold text-white mt-8 lg:mt-16 leading-tight">
            Convierte a tu equipo<br />
            <span className="gradient-text">en closers de elite</span>
          </h1>
          <p className="text-slate-400 text-lg mt-4 max-w-lg">
            La plataforma que usan los mejores equipos comerciales de Espana
            para entrenar sus habilidades de venta.
          </p>
        </div>

        {/* Benefits checklist */}
        <div className="relative z-10 mt-8 lg:mt-0 hidden lg:block">
          <h3 className="text-white font-semibold mb-4">Lo que incluye tu cuenta:</h3>
          <div className="space-y-3">
            {BENEFITS.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-slate-300 text-sm">{b}</p>
              </div>
            ))}
          </div>
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

        {/* FAQ */}
        <div className="relative z-10 mt-8 hidden lg:block">
          <h3 className="text-white font-semibold mb-3">Preguntas frecuentes</h3>
          <div className="space-y-2">
            {[
              { q: 'Es gratis?', a: 'Tu acceso es gestionado por tu profesor o empresa.' },
              { q: 'Necesito microfono?', a: 'Si, las sesiones son conversaciones de voz reales.' },
              { q: 'En que idioma son las sesiones?', a: 'Todas las sesiones y analisis son en espanol.' },
            ].map((faq, i) => (
              <div key={i} className="bg-slate-700/20 rounded-lg p-3 border border-slate-700/30">
                <p className="text-white text-sm font-medium">{faq.q}</p>
                <p className="text-slate-400 text-xs mt-0.5">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trusted by */}
        <div className="relative z-10 mt-8 lg:mt-0 hidden lg:block">
          <p className="text-slate-500 text-xs uppercase tracking-wider mb-3">Empresas que confian en nosotros</p>
          <div className="flex flex-wrap gap-2">
            {TRUSTED_BY.map((company, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-slate-700/40 border border-slate-600/30 text-slate-300 text-xs font-medium">
                {company}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Form section */}
      <div className="lg:w-[480px] flex items-center justify-center p-8 lg:p-16 bg-slate-800/50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Logo size="md" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Crea tu cuenta</h2>
          <p className="text-slate-400 text-sm mb-8">Empieza tu entrenamiento de ventas hoy</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nombre completo" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" required autoComplete="name" />
            <Input label="Email corporativo" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@empresa.com" required autoComplete="email" />
            <Input label="Contrasena" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 12 caracteres" required minLength={12} autoComplete="new-password" />
            <p className="text-xs text-slate-500">Debe incluir mayusculas, minusculas, numeros y simbolos</p>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="consent"
                required
                className="w-4 h-4 mt-0.5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500/30"
              />
              <label htmlFor="consent" className="text-xs text-slate-400 leading-tight">
                He leido y acepto la{' '}
                <a href="/privacy" target="_blank" className="text-blue-400 hover:underline">Politica de Privacidad</a>
                {' '}y los{' '}
                <a href="/terms" target="_blank" className="text-blue-400 hover:underline">Terminos y Condiciones</a>
                . Consiento el tratamiento de mis datos personales, incluyendo grabaciones de voz,
                para la prestacion del servicio de entrenamiento comercial con IA.
              </label>
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            <Button type="submit" loading={loading} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0">
              Crear cuenta
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Inicia sesion</Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
            <p className="text-xs text-slate-500">
              Tu cuenta sera revisada por un administrador antes de activarse
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
