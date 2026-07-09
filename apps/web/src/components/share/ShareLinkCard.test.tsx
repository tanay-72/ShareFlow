import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ShareLinkCard } from './ShareLinkCard';

describe('ShareLinkCard', () => {
  it('displays the share URL in a read-only field', () => {
    render(<ShareLinkCard shareUrl="https://example.com/f/abc123" qrCodeDataUrl="data:image/png;base64,x" deduplicated={false} />);
    expect(screen.getByDisplayValue('https://example.com/f/abc123')).toBeInTheDocument();
  });

  it('copies the link to the clipboard when the copy button is clicked', async () => {
    // Defined after render, via fireEvent (not userEvent), so
    // @testing-library/user-event's own clipboard setup never gets a
    // chance to shadow this mock before the click fires.
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<ShareLinkCard shareUrl="https://example.com/f/abc123" qrCodeDataUrl="data:image/png;base64,x" deduplicated={false} />);
    fireEvent.click(screen.getByLabelText('Copy link'));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('https://example.com/f/abc123'));
  });

  it('toggles the QR code image visibility', async () => {
    const user = userEvent.setup();
    render(<ShareLinkCard shareUrl="https://example.com/f/abc123" qrCodeDataUrl="data:image/png;base64,x" deduplicated={false} />);

    expect(screen.queryByAltText('QR code for share link')).not.toBeInTheDocument();
    await user.click(screen.getByLabelText('Show QR code'));
    expect(screen.getByAltText('QR code for share link')).toBeInTheDocument();
  });

  it('shows a deduplication note when the upload matched existing content', () => {
    render(<ShareLinkCard shareUrl="https://example.com/f/abc123" qrCodeDataUrl="data:image/png;base64,x" deduplicated />);
    expect(screen.getByText(/no extra storage was used/i)).toBeInTheDocument();
  });
});
