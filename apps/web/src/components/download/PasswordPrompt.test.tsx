import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PasswordPrompt } from './PasswordPrompt';

describe('PasswordPrompt', () => {
  it('disables the submit button until a password is entered', () => {
    render(<PasswordPrompt onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: /unlock/i })).toBeDisabled();
  });

  it('calls onSubmit with the entered password', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PasswordPrompt onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText('Password'), 'hunter2');
    await user.click(screen.getByRole('button', { name: /unlock/i }));

    expect(onSubmit).toHaveBeenCalledWith('hunter2');
  });

  it('displays an error message when provided', () => {
    render(<PasswordPrompt onSubmit={vi.fn()} errorMessage="Incorrect password." />);
    expect(screen.getByText('Incorrect password.')).toBeInTheDocument();
  });

  it('shows a submitting state', () => {
    render(<PasswordPrompt onSubmit={vi.fn()} isSubmitting />);
    expect(screen.getByRole('button', { name: /checking/i })).toBeInTheDocument();
  });
});
