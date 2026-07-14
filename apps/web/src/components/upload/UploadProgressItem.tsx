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
    <div className="card space-y-4 p-5">
      <div className="flex items-start gap-4">
        <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
          item.status === 'completed' 
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
            : item.status === 'error'
            ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
            : item.status === 'paused'
            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
            : 'bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400'
        }`}>
          <FileIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{item.file.name}</p>
            <div className="flex shrink-0 items-center gap-1.5">
              {item.status === 'uploading' && (
                <button 
                  type="button" 
                  onClick={onPause} 
                  className="btn-secondary flex h-8 w-8 items-center justify-center rounded-lg border-slate-200 bg-white/40 !p-0 shadow-sm transition hover:scale-105 active:scale-95 dark:border-slate-850 dark:bg-slate-900/30" 
                  aria-label="Pause upload"
                >
                  <Pause className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                </button>
              )}
              {(item.status === 'paused' || item.status === 'error') && (
                <button 
                  type="button" 
                  onClick={onResume} 
                  className="btn-secondary flex h-8 w-8 items-center justify-center rounded-lg border-slate-200 bg-white/40 !p-0 shadow-sm transition hover:scale-105 active:scale-95 dark:border-slate-855 dark:bg-slate-900/30" 
                  aria-label="Resume upload"
                >
                  {item.status === 'error' ? (
                    <RotateCcw className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                  ) : (
                    <Play className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                  )}
                </button>
              )}
              {item.status !== 'uploading' && (
                <button 
                  type="button" 
                  onClick={onDismiss} 
                  className="btn-secondary flex h-8 w-8 items-center justify-center rounded-lg border-slate-200 bg-white/40 !p-0 shadow-sm transition hover:scale-105 active:scale-95 dark:border-slate-855 dark:bg-slate-900/30" 
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                </button>
              )}
            </div>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            {formatBytes(item.uploadedBytes)} / {formatBytes(item.totalBytes)}
            {item.status === 'paused' && <span className="text-amber-600 dark:text-amber-400"> — paused</span>}
          </p>

          {item.status !== 'error' && (
            <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/80">
              <div
                className={`h-full rounded-full transition-all duration-300 relative overflow-hidden ${
                  item.status === 'completed' 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                    : 'bg-gradient-to-r from-brand-500 to-indigo-600'
                }`}
                style={{ width: `${percent}%` }}
              >
                {item.status === 'uploading' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full animate-shimmer" />
                )}
              </div>
            </div>
          )}

          {item.status === 'error' && (
            <p className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
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
