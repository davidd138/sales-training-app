import { useState, useEffect, useCallback } from 'react';
import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  confirmSignUp,
} from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';

let _client: ReturnType<typeof generateClient> | null = null;
function getClient() {
  if (!_client) _client = generateClient();
  return _client;
}

const SYNC_USER_MUTATION = /* GraphQL */ `
  mutation SyncUser {
    syncUser {
      userId
      email
      name
      role
    }
  }
`;

type User = {
  userId: string;
  email: string;
  name: string | null;
  role: string;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncUser = useCallback(async () => {
    try {
      const result = await getClient().graphql({ query: SYNC_USER_MUTATION });
      const syncedUser = (result as any).data?.syncUser;
      if (syncedUser) setUser(syncedUser);
    } catch (e: any) {
      console.warn('syncUser failed:', JSON.stringify(e?.errors || e?.message || e));
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

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleSignIn = useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        try { await signOut(); } catch {}
        await signIn({ username: email, password });
        await syncUser();
      } catch (e: any) {
        setError(e.message || 'Error al iniciar sesión');
        throw e;
      }
    },
    [syncUser]
  );

  const handleSignUp = useCallback(
    async (email: string, password: string, name: string) => {
      setError(null);
      try {
        const { isSignUpComplete } = await signUp({
          username: email,
          password,
          options: { userAttributes: { email, name } },
        });
        if (isSignUpComplete) {
          await signIn({ username: email, password });
          await syncUser();
        }
      } catch (e: any) {
        setError(e.message || 'Error al registrarse');
        throw e;
      }
    },
    [syncUser]
  );

  const handleSignOut = useCallback(async () => {
    await signOut();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    error,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
  };
}
