import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CookieBanner } from '@/components/ui/CookieBanner';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('CookieBanner', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('shows banner when cookies not accepted', () => {
    localStorageMock.getItem.mockReturnValue(null);
    render(<CookieBanner />);
    expect(screen.getByText('Aceptar')).toBeInTheDocument();
    expect(screen.getByText(/cookies tecnicas/)).toBeInTheDocument();
  });

  it('hides banner when cookies already accepted', () => {
    localStorageMock.getItem.mockReturnValue('true');
    render(<CookieBanner />);
    expect(screen.queryByText('Aceptar')).not.toBeInTheDocument();
  });

  it('saves acceptance to localStorage on click', () => {
    localStorageMock.getItem.mockReturnValue(null);
    render(<CookieBanner />);
    fireEvent.click(screen.getByText('Aceptar'));
    expect(localStorageMock.setItem).toHaveBeenCalledWith('cookies_accepted', 'true');
  });

  it('has link to privacy policy', () => {
    localStorageMock.getItem.mockReturnValue(null);
    render(<CookieBanner />);
    expect(screen.getByText('Privacidad')).toBeInTheDocument();
  });
});
