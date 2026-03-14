import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

describe('SkeletonLoader', () => {
  it('renders text variant with default lines', () => {
    const { container } = render(<SkeletonLoader />);
    const lines = container.querySelectorAll('.bg-slate-700');
    expect(lines.length).toBe(3); // default 3 lines
  });

  it('renders custom number of lines', () => {
    const { container } = render(<SkeletonLoader lines={5} />);
    const lines = container.querySelectorAll('.bg-slate-700');
    expect(lines.length).toBe(5);
  });

  it('renders card variant', () => {
    const { container } = render(<SkeletonLoader variant="card" />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(container.querySelector('.rounded-xl')).toBeInTheDocument();
  });

  it('renders avatar variant', () => {
    const { container } = render(<SkeletonLoader variant="avatar" />);
    expect(container.querySelector('.rounded-full')).toBeInTheDocument();
  });

  it('renders chart variant', () => {
    const { container } = render(<SkeletonLoader variant="chart" />);
    // Chart has multiple bars
    const bars = container.querySelectorAll('.rounded-t');
    expect(bars.length).toBeGreaterThan(0);
  });

  it('applies custom className', () => {
    const { container } = render(<SkeletonLoader className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
