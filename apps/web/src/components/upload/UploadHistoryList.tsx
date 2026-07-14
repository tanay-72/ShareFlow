import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { UploadHistoryEntry } from '../../hooks/useLocalUploadHistory';
import { formatBytes } from '../../lib/chunking';

interface UploadHistoryListProps {
  history: UploadHistoryEntry[];
  onRemove: (slug: string) => void;
  onClear: () => void;
}

export function UploadHistoryList({ history, onRemove, onClear }: UploadHistoryListProps) {
  if (history.length === 0) return null;

  return (
    <section className="space-y-3.5 pt-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">
          Recent uploads on this device
        </h2>
        <button 
          type="button" 
          onClick={onClear} 
          className="text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors dark:text-slate-400 dark:hover:text-red-400"
        >
          Clear all
        </button>
      </div>
      <ul className="card divide-y divide-slate-200/60 overflow-hidden dark:divide-slate-800/60">
        {history.map((entry) => (
          <li key={entry.slug} className="group/item flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
            <Link to={`/f/${entry.slug}`} className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800 group-hover/item:text-brand-600 transition-colors dark:text-slate-200 dark:group-hover/item:text-brand-400">{entry.filename}</p>
              <p className="text-xs text-slate-500 mt-1 dark:text-slate-450 font-medium">
                {formatBytes(entry.size)} &middot; {new Date(entry.uploadedAt).toLocaleString()}
              </p>
            </Link>
            <button
              type="button"
              onClick={() => onRemove(entry.slug)}
              className="btn-secondary flex h-8 w-8 items-center justify-center rounded-lg border-slate-200/60 bg-white/40 !p-0 shadow-sm transition hover:scale-105 active:scale-95 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-800/80 dark:bg-slate-900/30 dark:hover:border-red-950 dark:hover:bg-red-950/20 dark:hover:text-red-400"
              aria-label={`Remove ${entry.filename} from history`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
