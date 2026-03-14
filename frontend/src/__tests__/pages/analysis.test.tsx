import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { Score, Conversation } from '@/types';

const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams('id=conv-1');
const mockQueryExecute = vi.fn();
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
  useMutation: () => ({
    loading: false,
    error: null,
    execute: mockAnalyzeExecute,
  }),
}));

const mockScore: Score = {
  conversationId: 'conv-1',
  overallScore: 75,
  rapport: 80,
  discovery: 70,
  presentation: 75,
  objectionHandling: 65,
  closing: 85,
  strengths: ['Good rapport', 'Strong closing'],
  improvements: ['Needs better discovery'],
  detailedFeedback: 'Overall good performance',
  analyzedAt: '2025-01-01T00:00:00Z',
};

const mockConversation: Conversation = {
  id: 'conv-1',
  userId: 'user-1',
  scenarioId: 'sc-1',
  scenarioName: 'Test Scenario',
  clientName: 'María García',
  transcript: '[]',
  duration: 120,
  status: 'completed',
  startedAt: '2025-01-01T00:00:00Z',
};

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
    mockQueryExecute.mockResolvedValue({
      conversation: mockConversation,
      score: mockScore,
    });

    const { default: AnalysisPage } = await import('@/app/(app)/analysis/page');
    render(<AnalysisPage />);

    expect(mockQueryExecute).toHaveBeenCalledWith({ id: 'conv-1' });
  });
});
