'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { signIn, signUp, signOut, getCurrentUser, confirmSignUp } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { SYNC_USER } from '@/lib/graphql/mutations';
import type { User } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: any = null;
function getClient() {
  if (!_client) _client = generateClient();
  return _client;
}

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  needsConfirmation: boolean;
  pendingEmail: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  confirmAccount: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingPassword, setPendingPassword] = useState<string | null>(null);

  const syncUser = useCallback(async () => {
    try {
      const result = await getClient().graphql({ query: SYNC_USER });
      const syncedUser = (result as any).data?.syncUser;
      if (syncedUser) setUser(syncedUser);
    } catch (e: any) {
      console.warn('syncUser failed:', e?.errors || e?.message || e);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      await getCurrentUser();
      await syncUser();
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [syncUser]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      try { await signOut(); } catch {}
      await signIn({ username: email, password });
      await syncUser();
    } catch (e: any) {
      setError(e.message || 'Error al iniciar sesión');
      throw e;
    }
  }, [syncUser]);

  const handleSignUp = useCallback(async (email: string, password: string, name: string) => {
    setError(null);
    try {
      const { isSignUpComplete, nextStep } = await signUp({
        username: email,
        password,
        options: { userAttributes: { email, name } },
      });
      if (isSignUpComplete) {
        await signIn({ username: email, password });
        await syncUser();
      } else if (nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
        setNeedsConfirmation(true);
        setPendingEmail(email);
        setPendingPassword(password);
      }
    } catch (e: any) {
      setError(e.message || 'Error al registrarse');
      throw e;
    }
  }, [syncUser]);

  const handleConfirm = useCallback(async (code: string) => {
    setError(null);
    if (!pendingEmail) return;
    try {
      await confirmSignUp({ username: pendingEmail, confirmationCode: code });
      if (pendingPassword) {
        await signIn({ username: pendingEmail, password: pendingPassword });
        await syncUser();
      }
      setNeedsConfirmation(false);
      setPendingEmail(null);
      setPendingPassword(null);
    } catch (e: any) {
      setError(e.message || 'Error al confirmar');
      throw e;
    }
  }, [pendingEmail, pendingPassword, syncUser]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setUser(null);
  }, []);

  return {
    user, loading, error, needsConfirmation, pendingEmail,
    signIn: handleSignIn, signUp: handleSignUp,
    confirmAccount: handleConfirm, signOut: handleSignOut,
  };
}

export { AuthContext };
