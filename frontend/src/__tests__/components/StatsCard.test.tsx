import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsCard } from '@/components/ui/StatsCard';

describe('StatsCard', () => {
  it('renders label and value', () => {
    render(<StatsCard label="Sesiones" value={42} />);
    expect(screen.getByText('Sesiones')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders string values', () => {
    render(<StatsCard label="Estado" value="Activo" />);
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('renders trend when provided', () => {
    render(<StatsCard label="Score" value={75} trend={{ value: 5, label: 'vs semana pasada' }} />);
    expect(screen.getByText('+5%')).toBeInTheDocument();
    expect(screen.getByText('vs semana pasada')).toBeInTheDocument();
  });

  it('renders negative trend', () => {
    render(<StatsCard label="Score" value={60} trend={{ value: -3, label: 'vs ayer' }} />);
    expect(screen.getByText('-3%')).toBeInTheDocument();
  });
});
