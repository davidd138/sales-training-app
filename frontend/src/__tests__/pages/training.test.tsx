import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Scenario } from '@/types';

const mockReplace = vi.fn();
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
let mockSearchParams = new URLSearchParams('id=sc-1');
const mockQueryExecute = vi.fn();
const mockCreateExecute = vi.fn();
const mockUpdateExecute = vi.fn();
const mockAnalyzeExecute = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockReplace, back: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/hooks/useGraphQL', () => ({
  useQuery: () => ({
    data: null,
    loading: false,
    error: null,
    execute: mockQueryExecute,
  }),
  useMutation: (mutation: string) => {
    if (mutation.includes('CreateConversation')) return { loading: false, error: null, execute: mockCreateExecute };
    if (mutation.includes('UpdateConversation')) return { loading: false, error: null, execute: mockUpdateExecute };
    if (mutation.includes('AnalyzeConversation')) return { loading: false, error: null, execute: mockAnalyzeExecute };
    return { loading: false, error: null, execute: vi.fn() };
  },
}));

vi.mock('@/hooks/useRealtimeTraining', () => ({
  useRealtimeTraining: () => ({
    state: 'idle',
    transcript: [],
    connect: mockConnect,
    disconnect: mockDisconnect,
  }),
}));

const mockScenario: Scenario = {
  id: 'sc-1',
  name: 'Test Scenario',
  description: 'A test scenario',
  clientName: 'María García',
  clientTitle: 'CEO',
  clientCompany: 'TechCorp',
  industry: 'Technology',
  difficulty: 'easy',
  persona: '{}',
};

describe('TrainingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams('id=sc-1');
  });

  it('redirects to /scenarios if no id param', async () => {
    mockSearchParams = new URLSearchParams();
    const { default: TrainingPage } = await import('@/app/(app)/training/page');
    render(<TrainingPage />);
    expect(mockReplace).toHaveBeenCalledWith('/scenarios');
  });

  it('loads scenarios and finds the right one', async () => {
    mockQueryExecute.mockResolvedValue([mockScenario]);
    mockCreateExecute.mockResolvedValue({ id: 'conv-1' });

    const { default: TrainingPage } = await import('@/app/(app)/training/page');
    render(<TrainingPage />);

    expect(mockQueryExecute).toHaveBeenCalledOnce();
  });

  it('creates conversation with only scenarioId (no extra fields)', async () => {
    mockQueryExecute.mockResolvedValue([mockScenario]);
    mockCreateExecute.mockResolvedValue({ id: 'conv-1' });

    const { default: TrainingPage } = await import('@/app/(app)/training/page');
    render(<TrainingPage />);

    await waitFor(() => {
      expect(mockCreateExecute).toHaveBeenCalledWith({
        input: { scenarioId: 'sc-1' },
      });
    });
  });

  it('calls training.connect() after successful conversation creation', async () => {
    mockQueryExecute.mockResolvedValue([mockScenario]);
    mockCreateExecute.mockResolvedValue({ id: 'conv-1' });

    const { default: TrainingPage } = await import('@/app/(app)/training/page');
    render(<TrainingPage />);

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalledOnce();
    });
  });

  it('does not call connect if conversation creation fails', async () => {
    mockQueryExecute.mockResolvedValue([mockScenario]);
    mockCreateExecute.mockRejectedValue(new Error('Mutation failed'));

    const { default: TrainingPage } = await import('@/app/(app)/training/page');
    render(<TrainingPage />);

    await waitFor(() => {
      expect(mockCreateExecute).toHaveBeenCalled();
    });

    expect(mockConnect).not.toHaveBeenCalled();
  });
});
