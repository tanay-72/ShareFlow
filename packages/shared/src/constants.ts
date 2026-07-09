/**
 * Constants shared between the API and the web client so upload-chunking
 * and size-limit logic can never drift between the two.
 */

/** Size of each chunk streamed to the server during a chunked upload. */
export const UPLOAD_CHUNK_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Hard ceiling on total file size accepted by the platform. */
export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB

/** Number of chunk uploads a single client may run concurrently. */
export const MAX_PARALLEL_CHUNK_UPLOADS = 4;

/** How long a short-lived signed download token remains valid. */
export const DOWNLOAD_TOKEN_TTL_SECONDS = 5 * 60; // 5 minutes

/** How long an abandoned upload session is kept before the cleanup worker purges it. */
export const UPLOAD_SESSION_TTL_HOURS = 24;

/** Preset expiration windows offered in the UI, in seconds. */
export const EXPIRATION_PRESETS_SECONDS = {
  ONE_HOUR: 60 * 60,
  ONE_DAY: 24 * 60 * 60,
  SEVEN_DAYS: 7 * 24 * 60 * 60,
} as const;

export const MIME_PREVIEW_CATEGORIES = ["image", "pdf", "video", "audio"] as const;
