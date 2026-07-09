import {
  MAX_PARALLEL_CHUNK_UPLOADS,
  UPLOAD_CHUNK_SIZE_BYTES,
  type CompleteUploadRequest,
  type CompleteUploadResponse,
} from '@shareflow/shared';
import { useCallback, useRef, useState } from 'react';
import { ApiError, completeUpload, getUploadStatus, initUpload, uploadChunk } from '../api/client';
import { chunkByteSize } from '../lib/chunking';
import { runWithConcurrency } from '../lib/concurrency';
import { generateClientId } from '../lib/id';

const CHUNK_UPLOAD_MAX_ATTEMPTS = 3;
const CHUNK_RETRY_DELAY_MS = 800;

export type UploadItemStatus = 'uploading' | 'paused' | 'completed' | 'error';

export interface UploadItem {
  clientId: string;
  file: File;
  status: UploadItemStatus;
  uploadedBytes: number;
  totalBytes: number;
  errorMessage?: string;
  result?: CompleteUploadResponse;
  uploadId?: string;
  shareOptions: CompleteUploadRequest;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Drives the full chunked-upload protocol client-side: init -> parallel
 * chunk PUTs (bounded concurrency, per-chunk progress, automatic retry on
 * transient failures) -> complete. Exposes pause/resume, backed by the
 * server's own chunk-status endpoint rather than any client-side memory of
 * "what was sent" — so resuming after a dropped connection re-syncs
 * against ground truth instead of trusting stale local state.
 */
export function useChunkedUpload() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const controllers = useRef(new Map<string, AbortController>());
  const chunkProgress = useRef(new Map<string, Map<number, number>>());

  const updateItem = useCallback((clientId: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((item) => (item.clientId === clientId ? { ...item, ...patch } : item)));
  }, []);

  const runUpload = useCallback(
    async (clientId: string, file: File, shareOptions: CompleteUploadRequest, resumeUploadId?: string) => {
      const controller = new AbortController();
      controllers.current.set(clientId, controller);
      if (!chunkProgress.current.has(clientId)) {
        chunkProgress.current.set(clientId, new Map());
      }
      const progress = chunkProgress.current.get(clientId)!;

      const reportProgress = () => {
        const uploaded = Array.from(progress.values()).reduce((sum, value) => sum + value, 0);
        updateItem(clientId, { uploadedBytes: uploaded });
      };

      try {
        let uploadId = resumeUploadId;
        let totalChunks: number;
        let alreadyReceived = new Set<number>();

        if (uploadId) {
          const status = await getUploadStatus(uploadId);
          totalChunks = status.totalChunks;
          alreadyReceived = new Set(status.receivedChunkIndexes);
        } else {
          const init = await initUpload({
            filename: file.name,
            totalSize: file.size,
            mimeType: file.type || 'application/octet-stream',
          });
          uploadId = init.uploadId;
          totalChunks = init.totalChunks;
          updateItem(clientId, { uploadId });
        }

        for (const index of alreadyReceived) {
          progress.set(index, chunkByteSize(index, totalChunks, file.size, UPLOAD_CHUNK_SIZE_BYTES));
        }
        reportProgress();

        const pendingIndexes = Array.from({ length: totalChunks }, (_, i) => i).filter(
          (index) => !alreadyReceived.has(index),
        );

        await runWithConcurrency(pendingIndexes, MAX_PARALLEL_CHUNK_UPLOADS, async (index) => {
          const start = index * UPLOAD_CHUNK_SIZE_BYTES;
          const end = Math.min(start + UPLOAD_CHUNK_SIZE_BYTES, file.size);
          const blob = file.slice(start, end);

          await uploadChunkWithRetry(uploadId!, index, blob, controller.signal, (loaded) => {
            progress.set(index, loaded);
            reportProgress();
          });

          progress.set(index, blob.size);
          reportProgress();
        });

        const result = await completeUpload(uploadId!, shareOptions);
        updateItem(clientId, { status: 'completed', result, uploadedBytes: file.size });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          updateItem(clientId, { status: 'paused' });
          return;
        }
        const message = error instanceof ApiError ? error.message : 'Upload failed. Please try again.';
        updateItem(clientId, { status: 'error', errorMessage: message });
      } finally {
        controllers.current.delete(clientId);
      }
    },
    [updateItem],
  );

  const addFiles = useCallback(
    (files: File[], shareOptions: CompleteUploadRequest) => {
      const newItems: UploadItem[] = files.map((file) => ({
        clientId: generateClientId(),
        file,
        status: 'uploading',
        uploadedBytes: 0,
        totalBytes: file.size,
        shareOptions,
      }));
      setItems((prev) => [...newItems, ...prev]);
      newItems.forEach((item) => runUpload(item.clientId, item.file, shareOptions));
    },
    [runUpload],
  );

  const pauseUpload = useCallback((clientId: string) => {
    controllers.current.get(clientId)?.abort();
  }, []);

  const resumeUpload = useCallback(
    (clientId: string) => {
      setItems((prev) => {
        const item = prev.find((it) => it.clientId === clientId);
        if (item) {
          updateItem(clientId, { status: 'uploading', errorMessage: undefined });
          runUpload(clientId, item.file, item.shareOptions, item.uploadId);
        }
        return prev;
      });
    },
    [runUpload, updateItem],
  );

  const dismissUpload = useCallback((clientId: string) => {
    setItems((prev) => prev.filter((item) => item.clientId !== clientId));
    chunkProgress.current.delete(clientId);
  }, []);

  return { items, addFiles, pauseUpload, resumeUpload, dismissUpload };
}

async function uploadChunkWithRetry(
  uploadId: string,
  chunkIndex: number,
  blob: Blob,
  signal: AbortSignal,
  onProgress: (loadedBytes: number) => void,
): Promise<void> {
  for (let attempt = 1; attempt <= CHUNK_UPLOAD_MAX_ATTEMPTS; attempt++) {
    try {
      await uploadChunk(uploadId, chunkIndex, blob, { signal, onProgress });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }
      if (attempt === CHUNK_UPLOAD_MAX_ATTEMPTS) {
        throw error;
      }
      await sleep(CHUNK_RETRY_DELAY_MS * attempt);
    }
  }
}
