import * as path from 'path';

const MAX_DISPLAY_FILENAME_LENGTH = 255;
// Matches control characters and filesystem/URL-hostile characters.
// eslint-disable-next-line no-control-regex
const UNSAFE_CHARACTERS = /[\x00-\x1f\x7f<>:"/\\|?*]/g;

/**
 * Produces a display-safe filename from user input. This is defence in
 * depth for the *display* name (shown in the UI and sent as
 * Content-Disposition) — it is never used to build a filesystem path.
 * Storage keys are always derived from the SHA-256 content hash instead
 * (see `buildObjectKey`), so a malicious filename can never influence
 * where bytes are written on disk regardless of what this function does.
 */
export function sanitizeDisplayFilename(originalFilename: string): string {
  const base = path.basename(originalFilename).trim();
  const sanitized = base.replace(UNSAFE_CHARACTERS, '_').replace(/^\.+/, '');
  const safe = sanitized.length > 0 ? sanitized : 'unnamed-file';
  return safe.slice(0, MAX_DISPLAY_FILENAME_LENGTH);
}

/** Escapes a filename for safe use inside a Content-Disposition header value. */
export function toContentDispositionFilename(filename: string): string {
  return filename.replace(/"/g, "'");
}
