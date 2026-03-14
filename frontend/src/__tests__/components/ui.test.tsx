import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Textarea } from '@/components/ui/Input';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled when loading', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies variant classes', () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    expect(container.firstChild).toHaveClass('bg-red-500');
  });

  it('applies size classes', () => {
    const { container } = render(<Button size="lg">Big</Button>);
    expect(container.firstChild).toHaveClass('px-6');
  });
});

describe('Badge', () => {
  it('renders translated label for known values', () => {
    render(<Badge value="easy" />);
    expect(screen.getByText('Principiante')).toBeInTheDocument();
  });

  it('renders translated label for medium difficulty', () => {
    render(<Badge value="medium" />);
    expect(screen.getByText('Intermedio')).toBeInTheDocument();
  });

  it('renders translated label for hard difficulty', () => {
    render(<Badge value="hard" />);
    expect(screen.getByText('Experto')).toBeInTheDocument();
  });

  it('renders raw value for unknown values', () => {
    render(<Badge value="custom" />);
    expect(screen.getByText('custom')).toBeInTheDocument();
  });

  it('applies correct color for status values', () => {
    const { container } = render(<Badge value="completed" />);
    expect(container.firstChild).toHaveClass('text-emerald-400');
  });
});

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders without label', () => {
    const { container } = render(<Input placeholder="type here" />);
    expect(container.querySelector('label')).toBeNull();
    expect(screen.getByPlaceholderText('type here')).toBeInTheDocument();
  });

  it('passes HTML attributes through', () => {
    render(<Input type="email" data-testid="email-input" />);
    expect(screen.getByTestId('email-input')).toHaveAttribute('type', 'email');
  });
});

describe('Textarea', () => {
  it('renders with label', () => {
    render(<Textarea label="Message" />);
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('renders textarea element', () => {
    const { container } = render(<Textarea />);
    expect(container.querySelector('textarea')).toBeInTheDocument();
  });
});
