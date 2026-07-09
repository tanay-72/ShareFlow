import { Check, Copy, QrCode } from 'lucide-react';
import { useState } from 'react';
import { copyToClipboard } from '../../lib/clipboard';

interface ShareLinkCardProps {
  shareUrl: string;
  qrCodeDataUrl: string;
  deduplicated: boolean;
}

export function ShareLinkCard({ shareUrl, qrCodeDataUrl, deduplicated }: ShareLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  async function copyLink() {
    const succeeded = await copyToClipboard(shareUrl);
    if (succeeded) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-center gap-2">
        <input readOnly value={shareUrl} className="input flex-1 font-mono text-xs" />
        <button type="button" onClick={copyLink} className="btn-secondary shrink-0" aria-label="Copy link">
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setShowQr((v) => !v)}
          className="btn-secondary shrink-0"
          aria-label="Show QR code"
        >
          <QrCode className="h-4 w-4" />
        </button>
      </div>
      {deduplicated && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Identical content already existed on the server — no extra storage was used.
        </p>
      )}
      {showQr && (
        <div className="flex justify-center rounded-xl bg-white p-4">
          <img src={qrCodeDataUrl} alt="QR code for share link" className="h-40 w-40" />
        </div>
      )}
    </div>
  );
}
