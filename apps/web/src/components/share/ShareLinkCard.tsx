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
    <div className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-4.5 space-y-3.5 shadow-sm transition-all duration-300 dark:border-brand-500/25 dark:bg-brand-500/5">
      <div className="flex items-center gap-2">
        <input 
          readOnly 
          value={shareUrl} 
          className="input flex-1 font-mono text-[11px] bg-white/80 border-slate-200/60 dark:bg-slate-950/60 dark:border-slate-800/80 !py-2.5" 
        />
        <button 
          type="button" 
          onClick={copyLink} 
          className={`btn-secondary shrink-0 flex h-10 w-10 !p-0 items-center justify-center rounded-xl transition-all duration-205 active:scale-90 ${copied ? 'bg-emerald-50 border-emerald-250 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-800/50 dark:text-emerald-400' : ''}`} 
          aria-label="Copy link"
        >
          {copied ? <Check className="h-4.5 w-4.5" /> : <Copy className="h-4.5 w-4.5" />}
        </button>
        <button
          type="button"
          onClick={() => setShowQr((v) => !v)}
          className={`btn-secondary shrink-0 flex h-10 w-10 !p-0 items-center justify-center rounded-xl transition-all duration-205 active:scale-90 ${showQr ? 'bg-indigo-50 border-indigo-250 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-800/50 dark:text-indigo-400' : ''}`}
          aria-label="Show QR code"
        >
          <QrCode className="h-4.5 w-4.5" />
        </button>
      </div>
      {deduplicated && (
        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 pl-1">
          ✨ Identical content already existed on the server — no extra storage was used.
        </p>
      )}
      {showQr && (
        <div className="flex justify-center rounded-2xl border border-slate-200/50 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-white transition-all duration-300">
          <img src={qrCodeDataUrl} alt="QR code for share link" className="h-36 w-36" />
        </div>
      )}
    </div>
  );
}
