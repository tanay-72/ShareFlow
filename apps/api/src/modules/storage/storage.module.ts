import { Global, Module } from '@nestjs/common';
import { LocalStorageProvider } from './local-storage.provider';
import { STORAGE_PROVIDER } from './storage-provider.interface';

/**
 * Binds the StorageProvider interface to a concrete implementation. This is
 * the single line that would change to move the whole platform onto S3,
 * Cloudflare R2, or GCS — every consumer injects `STORAGE_PROVIDER` and
 * only ever calls interface methods.
 */
@Global()
@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useClass: LocalStorageProvider,
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
