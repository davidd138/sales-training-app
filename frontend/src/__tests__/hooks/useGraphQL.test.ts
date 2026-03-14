import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuery, useMutation } from '@/hooks/useGraphQL';

const mockGraphql = vi.fn();

vi.mock('aws-amplify/api', () => ({
  generateClient: () => ({
    graphql: mockGraphql,
  }),
}));

describe('useQuery', () => {
  beforeEach(() => {
    mockGraphql.mockReset();
  });

  it('starts with null data and no loading', () => {
    const { result } = renderHook(() => useQuery('query { test }'));
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets loading while executing', async () => {
    let resolvePromise: (value: unknown) => void;
    mockGraphql.mockReturnValue(new Promise(r => { resolvePromise = r; }));

    const { result } = renderHook(() => useQuery('query { listItems { id } }'));

    let executePromise: Promise<unknown>;
    act(() => {
      executePromise = result.current.execute();
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise!({ data: { listItems: [{ id: '1' }] } });
      await executePromise;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([{ id: '1' }]);
  });

  it('handles errors', async () => {
    mockGraphql.mockRejectedValue(new Error('GraphQL error'));

    const { result } = renderHook(() => useQuery('query { test }'));

    await act(async () => {
      await result.current.execute().catch(() => {});
    });

    expect(result.current.error).toBe('GraphQL error');
    expect(result.current.loading).toBe(false);
  });

  it('passes variables to graphql call', async () => {
    mockGraphql.mockResolvedValue({ data: { getItem: { id: '1' } } });

    const { result } = renderHook(() => useQuery('query GetItem($id: String!) { getItem(id: $id) { id } }'));

    await act(async () => {
      await result.current.execute({ id: '123' });
    });

    expect(mockGraphql).toHaveBeenCalledWith({
      query: 'query GetItem($id: String!) { getItem(id: $id) { id } }',
      variables: { id: '123' },
    });
  });
});

describe('useMutation', () => {
  beforeEach(() => {
    mockGraphql.mockReset();
  });

  it('starts with no loading and no error', () => {
    const { result } = renderHook(() => useMutation('mutation { test }'));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('executes mutation and returns data', async () => {
    mockGraphql.mockResolvedValue({ data: { createItem: { id: 'new-1' } } });

    const { result } = renderHook(() => useMutation('mutation { createItem { id } }'));

    let returnedData: unknown;
    await act(async () => {
      returnedData = await result.current.execute({ input: { name: 'test' } });
    });

    expect(returnedData).toEqual({ id: 'new-1' });
    expect(result.current.loading).toBe(false);
  });

  it('handles mutation errors', async () => {
    mockGraphql.mockRejectedValue(new Error('Mutation failed'));

    const { result } = renderHook(() => useMutation('mutation { test }'));

    await act(async () => {
      await result.current.execute().catch(() => {});
    });

    expect(result.current.error).toBe('Mutation failed');
  });
});
