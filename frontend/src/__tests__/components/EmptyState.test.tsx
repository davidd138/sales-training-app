import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '@/components/ui/EmptyState';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="Sin datos" />);
    expect(screen.getByText('Sin datos')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="Sin datos" description="No hay informacion disponible" />);
    expect(screen.getByText('No hay informacion disponible')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const onClick = vi.fn();
    render(<EmptyState title="Sin datos" action={{ label: 'Crear', onClick }} />);
    const btn = screen.getByText('Crear');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not render action when not provided', () => {
    render(<EmptyState title="Sin datos" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
