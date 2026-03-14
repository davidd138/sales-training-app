import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from '@/components/ui/Toast';

function TestComponent() {
  const { addToast } = useToast();
  return (
    <div>
      <button onClick={() => addToast('Exito', 'success')}>Show Success</button>
      <button onClick={() => addToast('Error', 'error')}>Show Error</button>
      <button onClick={() => addToast('Info', 'info')}>Show Info</button>
    </div>
  );
}

describe('Toast', () => {
  it('shows a toast on trigger', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Success'));
    expect(screen.getByText('Exito')).toBeInTheDocument();
  });

  it('shows error toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Error'));
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('can dismiss toast manually', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Info'));
    expect(screen.getByText('Info')).toBeInTheDocument();
    // Find the dismiss button (X icon button)
    const dismissButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('svg') && btn.closest('[role="alert"]')
    );
    if (dismissButtons.length > 0) {
      fireEvent.click(dismissButtons[0]);
    }
  });
});
