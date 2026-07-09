import { Inject, Injectable, Logger } from '@nestjs/common';
import { createReadStream } from 'fs';
import { buildObjectKey } from '../storage/storage-key.util';
import { STORAGE_PROVIDER, StorageProvider } from '../storage/storage-provider.interface';
import { StoredObjectRecord, StoredObjectRepository } from './stored-object.repository';

/**
 * Owns the content-addressed deduplication mechanism.
 *
 * Every uploaded file's bytes are identified solely by their SHA-256 hash.
 * When an upload completes:
 *   - if a StoredObject with that hash already exists, we skip writing to
 *     storage entirely and just bump `refCount` — a new File (share link)
 *     is created pointing at the existing object.
 *   - otherwise we persist the bytes once via the StorageProvider and
 *     create a new StoredObject with `refCount = 1`.
 *
 * `refCount` is what makes deletion safe: a File can be deleted (expired,
 * one-time-consumed, or manually removed) without touching the physical
 * bytes as long as other File rows still reference the same StoredObject.
 * Physical bytes are only removed once refCount reaches zero.
 */
@Injectable()
export class StoredObjectService {
  private readonly logger = new Logger(StoredObjectService.name);

  constructor(
    private readonly storedObjectRepository: StoredObjectRepository,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  findBySha256(sha256: string): Promise<StoredObjectRecord | null> {
    return this.storedObjectRepository.findBySha256(sha256);
  }

  /**
   * Registers a new StoredObject for content that does not yet exist in
   * storage, persisting `tempFilePath`'s bytes under a hash-derived key.
   */
  async createFromTempFile(params: {
    sha256: string;
    size: number;
    mimeType: string;
    tempFilePath: string;
  }): Promise<StoredObjectRecord> {
    const key = buildObjectKey(params.sha256);
    await this.storage.save(createReadStream(params.tempFilePath), key);

    this.logger.log(`Stored new object ${params.sha256} (${params.size} bytes) at key ${key}`);

    return this.storedObjectRepository.create({
      sha256: params.sha256,
      size: params.size,
      mimeType: params.mimeType,
      storageKey: key,
    });
  }

  incrementRefCount(storedObjectId: string): Promise<StoredObjectRecord> {
    return this.storedObjectRepository.incrementRefCount(storedObjectId);
  }

  /**
   * Decrements refCount for a StoredObject and physically deletes it once
   * no File row references it anymore. Must be called whenever a File is
   * deleted (expiry, one-time consumption, or manual removal).
   */
  async decrementRefCount(storedObjectId: string): Promise<void> {
    const updated = await this.storedObjectRepository.decrementRefCount(storedObjectId);
    if (updated.refCount <= 0) {
      await this.deleteOrphan(updated.id, updated.storageKey);
    }
  }

  /** Sweeps any StoredObject left at refCount <= 0 — used by the cleanup worker as a safety net. */
  async sweepOrphans(): Promise<number> {
    const orphans = await this.storedObjectRepository.findOrphaned();
    for (const orphan of orphans) {
      await this.deleteOrphan(orphan.id, orphan.storageKey);
    }
    return orphans.length;
  }

  private async deleteOrphan(storedObjectId: string, storageKey: string): Promise<void> {
    await this.storage.delete(storageKey);
    await this.storedObjectRepository.delete(storedObjectId);
    this.logger.log(`Deleted orphaned storage object ${storedObjectId} (key ${storageKey})`);
  }
}
