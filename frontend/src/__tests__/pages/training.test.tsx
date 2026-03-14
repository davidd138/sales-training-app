import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Scenario } from '@/types';

const mockReplace = vi.fn();
const mockPush = vi.fn();
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
let mockSearchParams = new URLSearchParams('id=sc-1');
const mockQueryExecute = vi.fn();
const mockCreateExecute = vi.fn();
const mockUpdateExecute = vi.fn();
const mockAnalyzeExecute = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: vi.fn() }),
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
  clientName: 'Maria Garcia',
  clientTitle: 'CEO',
  clientCompany: 'TechCorp',
  industry: 'Technology',
  difficulty: 'easy',
  persona: '{"personality": "Friendly"}',
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

    const { default: TrainingPage } = await import('@/app/(app)/training/page');
    render(<TrainingPage />);

    expect(mockQueryExecute).toHaveBeenCalledOnce();
  });

  it('shows briefing screen with scenario details before call starts', async () => {
    mockQueryExecute.mockResolvedValue([mockScenario]);

    const { default: TrainingPage } = await import('@/app/(app)/training/page');
    render(<TrainingPage />);

    await waitFor(() => {
      // Should show client name in briefing
      expect(screen.getByText('Maria Garcia')).toBeTruthy();
    });

    // Should show the "Iniciar Llamada" button
    expect(screen.getByText('Iniciar Llamada')).toBeTruthy();

    // Should NOT auto-connect
    expect(mockConnect).not.toHaveBeenCalled();
    expect(mockCreateExecute).not.toHaveBeenCalled();
  });

  it('starts call when user clicks Iniciar Llamada', async () => {
    mockQueryExecute.mockResolvedValue([mockScenario]);
    mockCreateExecute.mockResolvedValue({ id: 'conv-1' });

    const { default: TrainingPage } = await import('@/app/(app)/training/page');
    render(<TrainingPage />);

    await waitFor(() => {
      expect(screen.getByText('Iniciar Llamada')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Iniciar Llamada'));

    await waitFor(() => {
      expect(mockCreateExecute).toHaveBeenCalledWith({
        input: { scenarioId: 'sc-1' },
      });
    });

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalledOnce();
    });
  });

  it('shows difficulty tips in briefing', async () => {
    mockQueryExecute.mockResolvedValue([mockScenario]);

    const { default: TrainingPage } = await import('@/app/(app)/training/page');
    render(<TrainingPage />);

    await waitFor(() => {
      expect(screen.getByText('Nivel Facil')).toBeTruthy();
    });
  });
});
