import { Readable } from 'stream';

export interface ByteRange {
  start: number;
  end: number;
}

export interface StorageSaveResult {
  key: string;
  size: number;
}

/**
 * Storage abstraction that every feature module depends on instead of the
 * filesystem directly. This is the single swap point for moving from local
 * disk to S3 / Cloudflare R2 / GCS later — no business logic elsewhere
 * needs to change, only which provider is bound to this token in
 * StorageModule.
 */
export interface StorageProvider {
  /** Persists the given stream under `key`, returning the number of bytes written. */
  save(source: Readable, key: string): Promise<StorageSaveResult>;

  /** Opens a readable stream for the object at `key`, optionally scoped to a byte range (for HTTP Range requests). */
  createReadStream(key: string, range?: ByteRange): Readable;

  /** Permanently removes the object at `key`. Safe to call on a non-existent key. */
  delete(key: string): Promise<void>;

  /** Whether an object exists at `key`. */
  exists(key: string): Promise<boolean>;

  /** Size in bytes of the object at `key`. */
  getSize(key: string): Promise<number>;
}

/** DI token — inject with `@Inject(STORAGE_PROVIDER)`. */
export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
