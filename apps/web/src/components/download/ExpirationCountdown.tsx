import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ExpirationCountdownProps {
  expiresAt: string | null;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Expired';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  if (minutes > 0) return `${minutes}m ${seconds}s remaining`;
  return `${seconds}s remaining`;
}

export function ExpirationCountdown({ expiresAt }: ExpirationCountdownProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
      <Clock className="h-3.5 w-3.5" />
      {expiresAt ? formatRemaining(new Date(expiresAt).getTime() - now) : 'Never expires'}
    </span>
  );
}
