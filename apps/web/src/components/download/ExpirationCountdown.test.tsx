import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExpirationCountdown } from './ExpirationCountdown';

describe('ExpirationCountdown', () => {
  it('shows "Never expires" when there is no expiry', () => {
    render(<ExpirationCountdown expiresAt={null} />);
    expect(screen.getByText('Never expires')).toBeInTheDocument();
  });

  it('shows days and hours remaining for a far-future expiry', () => {
    const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    render(<ExpirationCountdown expiresAt={expiresAt} />);
    expect(screen.getByText(/\d+d \d+h remaining/)).toBeInTheDocument();
  });

  it('shows "Expired" once the expiry time has passed', () => {
    const expiresAt = new Date(Date.now() - 1000).toISOString();
    render(<ExpirationCountdown expiresAt={expiresAt} />);
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });
});
