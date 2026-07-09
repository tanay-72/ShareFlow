/**
 * Builds a content-addressed object key from a SHA-256 hash, sharded into
 * two levels of two-character prefix directories (e.g. `ab/cd/abcd1234...`).
 * Sharding keeps any single directory from accumulating millions of entries
 * on local disk, and the same key shape works unmodified as an S3/R2/GCS
 * object key (those backends have no real directory limits, but keeping the
 * key format identical means switching providers requires no data migration
 * logic beyond copying bytes).
 */
export function buildObjectKey(sha256: string): string {
  const normalized = sha256.toLowerCase();
  return `${normalized.slice(0, 2)}/${normalized.slice(2, 4)}/${normalized}`;
}

/**
 * Defence in depth: object keys are always derived internally from a hash,
 * but every provider re-validates the key shape before touching storage so
 * a bug elsewhere can never turn into a path traversal.
 */
export function assertSafeObjectKey(key: string): void {
  if (
    key.length === 0 ||
    key.includes('..') ||
    key.startsWith('/') ||
    key.includes('\\') ||
    !/^[a-zA-Z0-9/_-]+$/.test(key)
  ) {
    throw new Error(`Refusing to use unsafe storage key: ${key}`);
  }
}
