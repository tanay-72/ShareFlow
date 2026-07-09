import type {
  AccessFileRequest,
  AccessFileResponse,
  ApiErrorResponse,
  CompleteUploadRequest,
  CompleteUploadResponse,
  FileMetadataResponse,
  InitUploadRequest,
  InitUploadResponse,
  UploadStatusResponse,
} from '@shareflow/shared';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new ApiError(message ?? `Request failed with status ${response.status}`, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function initUpload(payload: InitUploadRequest): Promise<InitUploadResponse> {
  return apiFetch('/uploads', { method: 'POST', body: JSON.stringify(payload) });
}

export function getUploadStatus(uploadId: string): Promise<UploadStatusResponse> {
  return apiFetch(`/uploads/${uploadId}`);
}

export function completeUpload(
  uploadId: string,
  payload: CompleteUploadRequest,
): Promise<CompleteUploadResponse> {
  return apiFetch(`/uploads/${uploadId}/complete`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getFileMetadata(slug: string): Promise<FileMetadataResponse> {
  return apiFetch(`/files/${slug}`);
}

export function requestFileAccess(
  slug: string,
  payload: AccessFileRequest,
): Promise<AccessFileResponse> {
  return apiFetch(`/files/${slug}/access`, { method: 'POST', body: JSON.stringify(payload) });
}

/**
 * Uploads a single chunk with real upload-progress events, which the
 * `fetch` API does not expose — XMLHttpRequest is the only browser
 * primitive that reports `progress` events for outgoing request bodies.
 */
export function uploadChunk(
  uploadId: string,
  chunkIndex: number,
  chunk: Blob,
  options: { signal?: AbortSignal; onProgress?: (loadedBytes: number) => void } = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', `${API_BASE_URL}/uploads/${uploadId}/chunks/${chunkIndex}`);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        options.onProgress?.(event.loaded);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      const body = safeParseJson(xhr.responseText);
      reject(new ApiError(body?.message ?? `Chunk upload failed with status ${xhr.status}`, xhr.status));
    };

    xhr.onerror = () => reject(new ApiError('Network error while uploading chunk', 0));
    xhr.onabort = () => reject(new DOMException('Upload aborted', 'AbortError'));

    if (options.signal) {
      options.signal.addEventListener('abort', () => xhr.abort());
    }

    xhr.send(chunk);
  });
}

function safeParseJson(text: string): ApiErrorResponse | null {
  try {
    return JSON.parse(text) as ApiErrorResponse;
  } catch {
    return null;
  }
}
