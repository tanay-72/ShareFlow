/** Lifecycle status of a chunked upload session. */
export type UploadSessionStatus = "PENDING" | "COMPLETED" | "ABORTED";

export type PreviewCategory = "image" | "pdf" | "video" | "audio" | "none";

export interface InitUploadRequest {
  filename: string;
  totalSize: number;
  mimeType: string;
}

export interface InitUploadResponse {
  uploadId: string;
  chunkSize: number;
  totalChunks: number;
}

export interface UploadStatusResponse {
  uploadId: string;
  status: UploadSessionStatus;
  totalChunks: number;
  receivedChunkIndexes: number[];
}

export interface ChunkUploadResponse {
  chunkIndex: number;
  received: boolean;
}

export interface CompleteUploadRequest {
  /** Optional share configuration set at upload completion time. */
  password?: string;
  expiresInSeconds?: number;
  oneTimeDownload?: boolean;
}

export interface CompleteUploadResponse {
  slug: string;
  shareUrl: string;
  qrCodeDataUrl: string;
  deduplicated: boolean;
}

export interface FileMetadataResponse {
  slug: string;
  originalFilename: string;
  size: number;
  mimeType: string;
  previewCategory: PreviewCategory;
  requiresPassword: boolean;
  oneTimeDownload: boolean;
  expiresAt: string | null;
  downloadCount: number;
  lastDownloadAt: string | null;
  createdAt: string;
}

export interface AccessFileRequest {
  password?: string;
}

export interface AccessFileResponse {
  downloadToken: string;
  downloadUrl: string;
  expiresAt: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}
