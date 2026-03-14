import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/Badge';

describe('Badge', () => {
  const statusTests = [
    { value: 'easy', label: 'Principiante' },
    { value: 'medium', label: 'Intermedio' },
    { value: 'hard', label: 'Experto' },
    { value: 'completed', label: 'Completada' },
    { value: 'in_progress', label: 'En curso' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'active', label: 'Activo' },
    { value: 'suspended', label: 'Suspendido' },
    { value: 'expired', label: 'Expirado' },
    { value: 'admin', label: 'Admin' },
  ];

  statusTests.forEach(({ value, label }) => {
    it(`renders "${label}" for value "${value}"`, () => {
      render(<Badge value={value} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('renders raw value for unknown values', () => {
    render(<Badge value="custom_status" />);
    expect(screen.getByText('custom_status')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Badge value="easy" className="extra" />);
    expect(container.firstChild).toHaveClass('extra');
  });
});
