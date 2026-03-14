import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockReplace = vi.fn();
const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams('id=conv-1');
const mockConvExecute = vi.fn();
const mockScenExecute = vi.fn();
const mockAnalyzeExecute = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/hooks/useGraphQL', () => ({
  useQuery: (query: string) => {
    if (query.includes('GetConversation')) {
      return { data: null, loading: false, error: null, execute: mockConvExecute };
    }
    if (query.includes('ListScenarios')) {
      return { data: null, loading: false, error: null, execute: mockScenExecute };
    }
    return { data: null, loading: false, error: null, execute: vi.fn() };
  },
  useMutation: () => ({
    loading: false, error: null, execute: mockAnalyzeExecute,
  }),
}));

describe('AnalysisPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams('id=conv-1');
  });

  it('redirects to /history if no id param', async () => {
    mockSearchParams = new URLSearchParams();
    const { default: AnalysisPage } = await import('@/app/(app)/analysis/page');
    render(<AnalysisPage />);
    expect(mockReplace).toHaveBeenCalledWith('/history');
  });

  it('loads conversation on mount', async () => {
    mockConvExecute.mockResolvedValue({
      conversation: { id: 'conv-1', scenarioName: 'Test', transcript: '[]' },
      score: { overallScore: 75, rapport: 70, discovery: 60, presentation: 65, objectionHandling: 70, closing: 80, communication: 75, strengths: ['Good'], improvements: ['Improve'], detailedFeedback: 'Nice' },
    });
    mockScenExecute.mockResolvedValue([]);

    const { default: AnalysisPage } = await import('@/app/(app)/analysis/page');
    render(<AnalysisPage />);

    expect(mockConvExecute).toHaveBeenCalledWith({ id: 'conv-1' });
  });
});
