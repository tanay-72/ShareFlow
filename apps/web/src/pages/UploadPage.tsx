import type { CompleteUploadRequest } from '@shareflow/shared';
import { useEffect, useRef, useState } from 'react';
import { Dropzone } from '../components/upload/Dropzone';
import { ShareOptionsForm } from '../components/upload/ShareOptionsForm';
import { UploadHistoryList } from '../components/upload/UploadHistoryList';
import { UploadProgressItem } from '../components/upload/UploadProgressItem';
import { useChunkedUpload } from '../hooks/useChunkedUpload';
import { useLocalUploadHistory } from '../hooks/useLocalUploadHistory';

export function UploadPage() {
  const { items, addFiles, pauseUpload, resumeUpload, dismissUpload } = useChunkedUpload();
  const { history, addEntry, removeEntry, clearHistory } = useLocalUploadHistory();
  const [shareOptions, setShareOptions] = useState<CompleteUploadRequest>({ expiresInSeconds: 24 * 60 * 60 });
  const recordedClientIds = useRef(new Set<string>());

  useEffect(() => {
    for (const item of items) {
      if (item.status === 'completed' && item.result && !recordedClientIds.current.has(item.clientId)) {
        recordedClientIds.current.add(item.clientId);
        addEntry({
          slug: item.result.slug,
          filename: item.file.name,
          size: item.file.size,
          uploadedAt: new Date().toISOString(),
        });
      }
    }
  }, [items, addEntry]);

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Share files securely</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          No account needed. Files up to 2GB, encrypted-in-transit, with expiring and password-protected links.
        </p>
      </div>

      <ShareOptionsForm onChange={setShareOptions} />

      <Dropzone onFilesSelected={(files) => addFiles(files, shareOptions)} />

      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <UploadProgressItem
              key={item.clientId}
              item={item}
              onPause={() => pauseUpload(item.clientId)}
              onResume={() => resumeUpload(item.clientId)}
              onDismiss={() => dismissUpload(item.clientId)}
            />
          ))}
        </div>
      )}

      <UploadHistoryList history={history} onRemove={removeEntry} onClear={clearHistory} />
    </div>
  );
}
