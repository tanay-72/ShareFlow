import { Readable } from 'stream';
import { ByteRange, StorageProvider, StorageSaveResult } from '../storage-provider.interface';

/**
 * Extension point for Amazon S3 (or any S3-compatible backend).
 *
 * This class is intentionally not wired into StorageModule — it exists to
 * document exactly how little would change to move ShareFlow's storage
 * layer off local disk. Because every consumer (upload merge, dedup,
 * download streaming, cleanup worker) depends only on the StorageProvider
 * interface, swapping providers is a one-line change in StorageModule's
 * `useClass` binding; no controller, service, or route changes.
 *
 * To finish this implementation:
 *   1. `pnpm add @aws-sdk/client-s3 @aws-sdk/lib-storage`
 *   2. Construct an `S3Client` from AWS_REGION/AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY env vars
 *   3. `save`      -> `new Upload({ client, params: { Bucket, Key: key, Body: source } }).done()`
 *   4. `createReadStream` -> `GetObjectCommand` with a `Range: bytes=start-end` header,
 *      returning `response.Body` (already a Node Readable when using the Node SDK)
 *   5. `delete`    -> `DeleteObjectCommand`
 *   6. `exists`    -> `HeadObjectCommand`, treating a 404 as `false`
 *   7. `getSize`   -> `HeadObjectCommand`, reading `ContentLength`
 *
 * S3 object keys are flat strings identical to the sharded keys produced by
 * `buildObjectKey()`, so no key-format changes are needed either.
 */
export class S3StorageProvider implements StorageProvider {
  save(_source: Readable, _key: string): Promise<StorageSaveResult> {
    throw new Error('S3StorageProvider is not implemented — see class doc comment for the plan.');
  }

  createReadStream(_key: string, _range?: ByteRange): Readable {
    throw new Error('S3StorageProvider is not implemented — see class doc comment for the plan.');
  }

  delete(_key: string): Promise<void> {
    throw new Error('S3StorageProvider is not implemented — see class doc comment for the plan.');
  }

  exists(_key: string): Promise<boolean> {
    throw new Error('S3StorageProvider is not implemented — see class doc comment for the plan.');
  }

  getSize(_key: string): Promise<number> {
    throw new Error('S3StorageProvider is not implemented — see class doc comment for the plan.');
  }
}
