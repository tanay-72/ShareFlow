import { AlertCircle, FileIcon, Pause, Play, RotateCcw, X } from 'lucide-react';
import type { UploadItem } from '../../hooks/useChunkedUpload';
import { formatBytes } from '../../lib/chunking';
import { ShareLinkCard } from '../share/ShareLinkCard';

interface UploadProgressItemProps {
  item: UploadItem;
  onPause: () => void;
  onResume: () => void;
  onDismiss: () => void;
}

export function UploadProgressItem({ item, onPause, onResume, onDismiss }: UploadProgressItemProps) {
  const percent = item.totalBytes === 0 ? 0 : Math.round((item.uploadedBytes / item.totalBytes) * 100);

  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <FileIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{item.file.name}</p>
            <div className="flex shrink-0 items-center gap-1.5">
              {item.status === 'uploading' && (
                <button type="button" onClick={onPause} className="btn-secondary !p-2" aria-label="Pause upload">
                  <Pause className="h-3.5 w-3.5" />
                </button>
              )}
              {(item.status === 'paused' || item.status === 'error') && (
                <button type="button" onClick={onResume} className="btn-secondary !p-2" aria-label="Resume upload">
                  {item.status === 'error' ? <RotateCcw className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
              )}
              {item.status !== 'uploading' && (
                <button type="button" onClick={onDismiss} className="btn-secondary !p-2" aria-label="Dismiss">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatBytes(item.uploadedBytes)} / {formatBytes(item.totalBytes)}
            {item.status === 'paused' && ' — paused'}
          </p>

          {item.status !== 'error' && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full transition-all ${item.status === 'completed' ? 'bg-emerald-500' : 'bg-brand-600'}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          )}

          {item.status === 'error' && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5" />
              {item.errorMessage}
            </p>
          )}
        </div>
      </div>

      {item.status === 'completed' && item.result && (
        <ShareLinkCard
          shareUrl={item.result.shareUrl}
          qrCodeDataUrl={item.result.qrCodeDataUrl}
          deduplicated={item.result.deduplicated}
        />
      )}
    </div>
  );
}
