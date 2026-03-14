import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Logo } from '@/components/ui/Logo';

describe('Logo', () => {
  it('renders with text by default', () => {
    render(<Logo />);
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Pulse')).toBeInTheDocument();
  });

  it('hides text when showText is false', () => {
    render(<Logo showText={false} />);
    expect(screen.queryByText('Sales')).not.toBeInTheDocument();
  });

  it('renders SVG logo', () => {
    const { container } = render(<Logo />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows AI Training subtitle for md and lg sizes', () => {
    render(<Logo size="lg" />);
    expect(screen.getByText('AI Training')).toBeInTheDocument();
  });

  it('hides AI Training subtitle for sm size', () => {
    render(<Logo size="sm" />);
    expect(screen.queryByText('AI Training')).not.toBeInTheDocument();
  });
});
