'use client';

import { useCallback, useState } from 'react';
import { generateClient } from 'aws-amplify/api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: any = null;
function getClient() {
  if (!_client) _client = generateClient();
  return _client;
}

export function useQuery<T = any>(query: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (variables?: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getClient().graphql({ query, variables });
      const d = (result as any).data;
      const key = Object.keys(d)[0];
      setData(d[key]);
      return d[key] as T;
    } catch (e: any) {
      const msg = e?.errors?.[0]?.message || e?.message || 'Error';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [query]);

  return { data, loading, error, execute };
}

export function useMutation<T = any>(mutation: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (variables?: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getClient().graphql({ query: mutation, variables });
      const d = (result as any).data;
      const key = Object.keys(d)[0];
      return d[key] as T;
    } catch (e: any) {
      const msg = e?.errors?.[0]?.message || e?.message || 'Error';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [mutation]);

  return { loading, error, execute };
}
