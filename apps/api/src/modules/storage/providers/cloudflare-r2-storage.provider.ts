import { Readable } from 'stream';
import { ByteRange, StorageProvider, StorageSaveResult } from '../storage-provider.interface';

/**
 * Extension point for Cloudflare R2. R2 exposes an S3-compatible API, so in
 * practice this can reuse `@aws-sdk/client-s3` pointed at R2's account
 * endpoint (`https://<account_id>.r2.cloudflarestorage.com`) with R2 API
 * token credentials — the implementation would be nearly identical to
 * {@link S3StorageProvider}, which is why the two are kept as separate
 * classes rather than one "generic S3-ish" provider: it keeps each
 * provider's env vars and endpoint quirks explicit and independently
 * configurable (e.g. R2 has no request egress fees, which is often the
 * actual reason a project picks it over S3).
 *
 * Not wired into StorageModule by default — see StorageProvider interface
 * doc comment and S3StorageProvider for the full swap-in checklist.
 */
export class CloudflareR2StorageProvider implements StorageProvider {
  save(_source: Readable, _key: string): Promise<StorageSaveResult> {
    throw new Error(
      'CloudflareR2StorageProvider is not implemented — see class doc comment for the plan.',
    );
  }

  createReadStream(_key: string, _range?: ByteRange): Readable {
    throw new Error(
      'CloudflareR2StorageProvider is not implemented — see class doc comment for the plan.',
    );
  }

  delete(_key: string): Promise<void> {
    throw new Error(
      'CloudflareR2StorageProvider is not implemented — see class doc comment for the plan.',
    );
  }

  exists(_key: string): Promise<boolean> {
    throw new Error(
      'CloudflareR2StorageProvider is not implemented — see class doc comment for the plan.',
    );
  }

  getSize(_key: string): Promise<number> {
    throw new Error(
      'CloudflareR2StorageProvider is not implemented — see class doc comment for the plan.',
    );
  }
}
