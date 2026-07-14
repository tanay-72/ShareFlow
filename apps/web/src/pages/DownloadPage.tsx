import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, Check, Download, Loader2, Zap, File, FileText, Image, Music, Video } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError, getFileMetadata, requestFileAccess } from '../api/client';
import { ExpirationCountdown } from '../components/download/ExpirationCountdown';
import { PasswordPrompt } from '../components/download/PasswordPrompt';
import { PreviewViewer } from '../components/download/PreviewViewer';
import { formatBytes } from '../lib/chunking';
import { triggerDownload } from '../lib/download';

export function DownloadPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const metadataQuery = useQuery({
    queryKey: ['file-metadata', slug],
    queryFn: () => getFileMetadata(slug),
    retry: false,
  });

  const accessMutation = useMutation({
    mutationFn: (password?: string) => requestFileAccess(slug, { password }),
    onSuccess: (data) => {
      setDownloadUrl(data.downloadUrl);
      setPasswordError(undefined);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.statusCode === 401) {
        setPasswordError(error.message);
      }
    },
  });

  useEffect(() => {
    if (metadataQuery.data && !metadataQuery.data.requiresPassword && !downloadUrl) {
      accessMutation.mutate(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadataQuery.data]);

  if (metadataQuery.isLoading) {
    return <CenteredMessage>Loading…</CenteredMessage>;
  }

  if (metadataQuery.isError) {
    const error = metadataQuery.error;
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return (
      <CenteredMessage>
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-500" />
        <p className="font-medium text-slate-900 dark:text-slate-100">
          {statusCode === 410 ? 'This link has expired or was already used' : 'This link does not exist'}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Ask the sender for a new share link.
        </p>
      </CenteredMessage>
    );
  }

  const file = metadataQuery.data!;

  const IconComponent = {
    image: Image,
    video: Video,
    audio: Music,
    pdf: FileText,
    none: File,
  }[file.previewCategory] || File;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12 md:py-16">
      <div className="card space-y-5 p-6">
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50/50 rounded-2xl border border-slate-200/50 dark:bg-slate-900/30 dark:border-slate-800/80 mb-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 shadow-md shadow-brand-500/5 dark:from-slate-800 dark:to-slate-700/60 dark:text-brand-400">
            <IconComponent className="h-8 w-8" />
          </span>
          <h1 className="mt-4 text-lg font-bold tracking-tight text-slate-800 text-center break-all font-display dark:text-slate-105 max-w-md">
            {file.originalFilename}
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {formatBytes(file.size)}
          </p>
        </div>

        <div className="flex items-center justify-between border-b border-slate-200/50 pb-4 dark:border-slate-800/60">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Expiration
          </span>
          <ExpirationCountdown expiresAt={file.expiresAt} />
        </div>

        {file.oneTimeDownload && (
          <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/10 p-3.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Zap className="h-4 w-4 shrink-0 text-amber-500" />
            <span>This is a one-time download — the file will be deleted immediately after downloading.</span>
          </div>
        )}

        {file.requiresPassword && !downloadUrl ? (
          <PasswordPrompt
            onSubmit={(password) => accessMutation.mutate(password)}
            errorMessage={passwordError}
            isSubmitting={accessMutation.isPending}
          />
        ) : downloadUrl && file.oneTimeDownload && downloadStarted ? (
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            <Check className="h-4.5 w-4.5 shrink-0 text-emerald-500" />
            <span>Download started — this file has now been deleted and this link is no longer valid.</span>
          </div>
        ) : downloadUrl ? (
          <div className="space-y-5">
            {/* A live preview would fetch the file itself, which for a
                one-time-download file would silently consume its single
                use before the visitor ever clicks Download. */}
            {file.previewCategory !== 'none' && !file.oneTimeDownload && (
              <PreviewViewer
                category={file.previewCategory}
                downloadUrl={downloadUrl}
                filename={file.originalFilename}
              />
            )}
            {file.previewCategory !== 'none' && file.oneTimeDownload && (
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Preview is unavailable for one-time downloads. Click Download to view the file.
              </p>
            )}
            <button
              type="button"
              className="btn-primary w-full !py-3.5 text-base tracking-wide"
              disabled={isDownloading}
              onClick={async () => {
                setIsDownloading(true);
                try {
                  await triggerDownload(downloadUrl, file.originalFilename, file.size);
                  if (file.oneTimeDownload) setDownloadStarted(true);
                } finally {
                  setIsDownloading(false);
                }
              }}
            >
              {isDownloading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
              {isDownloading ? 'Downloading…' : 'Download File'}
            </button>
          </div>
        ) : (
          <div className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        )}

        <div className="flex justify-between text-xs font-semibold text-slate-400 dark:text-slate-500 pt-1">
          <span>{file.downloadCount} download{file.downloadCount === 1 ? '' : 's'}</span>
          {file.lastDownloadAt && <span>Last: {new Date(file.lastDownloadAt).toLocaleString()}</span>}
        </div>
      </div>
    </div>
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
      {children}
    </div>
  );
}
