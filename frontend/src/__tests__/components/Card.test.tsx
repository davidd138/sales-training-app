import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from '@/components/ui/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card><span>Content</span></Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('is clickable when onClick provided', () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Click me</Card>);
    fireEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('has role=button when clickable', () => {
    render(<Card onClick={() => {}}>Card</Card>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('responds to Enter key', () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Card</Card>);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('responds to Space key', () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Card</Card>);
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not have role when not clickable', () => {
    render(<Card>Static card</Card>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies glow class when glow prop is true', () => {
    const { container } = render(<Card glow>Glow</Card>);
    expect(container.firstChild).toHaveClass('card-glow');
  });

  it('does not apply glow class by default', () => {
    const { container } = render(<Card>No glow</Card>);
    expect(container.firstChild).not.toHaveClass('card-glow');
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom">Card</Card>);
    expect(container.firstChild).toHaveClass('custom');
  });
});
