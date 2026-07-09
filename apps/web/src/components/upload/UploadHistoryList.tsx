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
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Your recent uploads on this device
        </h2>
        <button type="button" onClick={onClear} className="text-xs text-slate-500 hover:underline dark:text-slate-400">
          Clear history
        </button>
      </div>
      <ul className="card divide-y divide-slate-200 dark:divide-slate-800">
        {history.map((entry) => (
          <li key={entry.slug} className="flex items-center justify-between gap-3 px-4 py-3">
            <Link to={`/f/${entry.slug}`} className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{entry.filename}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatBytes(entry.size)} &middot; {new Date(entry.uploadedAt).toLocaleString()}
              </p>
            </Link>
            <button
              type="button"
              onClick={() => onRemove(entry.slug)}
              className="btn-secondary !p-2"
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
