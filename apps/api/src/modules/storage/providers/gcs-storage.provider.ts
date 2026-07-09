import { Readable } from 'stream';
import { ByteRange, StorageProvider, StorageSaveResult } from '../storage-provider.interface';

/**
 * Extension point for Google Cloud Storage.
 *
 * To finish this implementation:
 *   1. `pnpm add @google-cloud/storage`
 *   2. Construct a `Storage` client (uses `GOOGLE_APPLICATION_CREDENTIALS` by default)
 *      and resolve a `Bucket` handle from a `GCS_BUCKET` env var
 *   3. `save`      -> `bucket.file(key).createWriteStream()` and pipe `source` into it
 *   4. `createReadStream` -> `bucket.file(key).createReadStream({ start, end })`
 *   5. `delete`    -> `bucket.file(key).delete({ ignoreNotFound: true })`
 *   6. `exists`    -> `bucket.file(key).exists()`
 *   7. `getSize`   -> `bucket.file(key).getMetadata()`, reading `size`
 *
 * Not wired into StorageModule by default — see StorageProvider interface
 * doc comment and S3StorageProvider for the full swap-in checklist.
 */
export class GcsStorageProvider implements StorageProvider {
  save(_source: Readable, _key: string): Promise<StorageSaveResult> {
    throw new Error('GcsStorageProvider is not implemented — see class doc comment for the plan.');
  }

  createReadStream(_key: string, _range?: ByteRange): Readable {
    throw new Error('GcsStorageProvider is not implemented — see class doc comment for the plan.');
  }

  delete(_key: string): Promise<void> {
    throw new Error('GcsStorageProvider is not implemented — see class doc comment for the plan.');
  }

  exists(_key: string): Promise<boolean> {
    throw new Error('GcsStorageProvider is not implemented — see class doc comment for the plan.');
  }

  getSize(_key: string): Promise<number> {
    throw new Error('GcsStorageProvider is not implemented — see class doc comment for the plan.');
  }
}
