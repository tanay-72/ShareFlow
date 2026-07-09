import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, Check, Download, Loader2, Zap } from 'lucide-react';
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

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div className="card space-y-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
              {file.originalFilename}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{formatBytes(file.size)}</p>
          </div>
          <ExpirationCountdown expiresAt={file.expiresAt} />
        </div>

        {file.oneTimeDownload && (
          <p className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            <Zap className="h-3.5 w-3.5 shrink-0" />
            This is a one-time download — the file will be deleted immediately after downloading.
          </p>
        )}

        {file.requiresPassword && !downloadUrl ? (
          <PasswordPrompt
            onSubmit={(password) => accessMutation.mutate(password)}
            errorMessage={passwordError}
            isSubmitting={accessMutation.isPending}
          />
        ) : downloadUrl && file.oneTimeDownload && downloadStarted ? (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Check className="h-4 w-4 shrink-0" />
            Download started — this file has now been deleted and this link is no longer valid.
          </div>
        ) : downloadUrl ? (
          <div className="space-y-4">
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
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Preview is unavailable for one-time downloads. Click Download to view the file.
              </p>
            )}
            <button
              type="button"
              className="btn-primary w-full"
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
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isDownloading ? 'Downloading…' : 'Download'}
            </button>
          </div>
        ) : (
          <div className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        )}

        <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
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
