'use client';

import { useAuthProvider, AuthContext } from '@/hooks/useAuth';
import { configureAmplify } from '@/lib/amplify-config';

configureAmplify();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
