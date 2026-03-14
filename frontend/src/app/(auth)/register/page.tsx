'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
      <Card>
        <h2 className="text-xl font-semibold text-white mb-2">Verificar email</h2>
        <p className="text-slate-400 text-sm mb-6">Hemos enviado un código de verificación a tu email.</p>
        <form onSubmit={handleConfirm} className="space-y-4">
          <Input label="Código de verificación" value={code} onChange={e => setCode(e.target.value)} placeholder="123456" required autoComplete="one-time-code" />
          {error && <p className="text-danger text-sm">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">Confirmar</Button>
        </form>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold text-white mb-6">Crear cuenta</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" required autoComplete="name" />
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required autoComplete="email" />
        <Input label="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 12 caracteres" required minLength={12} autoComplete="new-password" />
        {error && <p className="text-danger text-sm">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">Registrarse</Button>
      </form>
      <p className="text-center text-sm text-slate-400 mt-4">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-primary hover:underline">Inicia sesión</Link>
      </p>
    </Card>
  );
}
