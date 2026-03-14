import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { Scenario } from '@/types';

const mockExecute = vi.fn();
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/hooks/useGraphQL', () => ({
  useQuery: () => ({
    data: null,
    loading: false,
    error: null,
    execute: mockExecute,
  }),
}));

const mockScenarios: Scenario[] = [
  {
    id: 'sc-1',
    name: 'Scenario 1',
    description: 'A test scenario',
    clientName: 'María García',
    clientTitle: 'CEO',
    clientCompany: 'TechCorp',
    industry: 'Technology',
    difficulty: 'easy',
    persona: '{}',
  },
  {
    id: 'sc-2',
    name: 'Scenario 2',
    description: 'Another scenario',
    clientName: 'Carlos López',
    clientTitle: 'CTO',
    clientCompany: 'EnergyCo',
    industry: 'Energy',
    difficulty: 'hard',
    persona: '{}',
  },
];

describe('ScenariosPage', () => {
  beforeEach(() => {
    mockExecute.mockReset();
    mockPush.mockReset();
  });

  it('calls execute on mount', async () => {
    mockExecute.mockResolvedValue(mockScenarios);

    // We need to dynamically import after mocks are set
    const { default: ScenariosPage } = await import('@/app/(app)/scenarios/page');
    render(<ScenariosPage />);

    expect(mockExecute).toHaveBeenCalledOnce();
  });
});
