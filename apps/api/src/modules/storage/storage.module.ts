import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';
import { LocalStorageProvider } from './local-storage.provider';
import { CloudflareR2StorageProvider } from './providers/cloudflare-r2-storage.provider';
import { STORAGE_PROVIDER } from './storage-provider.interface';

/**
 * Binds the StorageProvider interface to a concrete implementation, chosen
 * at boot by STORAGE_PROVIDER ('local' | 'r2'). Every consumer injects
 * STORAGE_PROVIDER and only ever calls interface methods, so this factory
 * is the single place that knows which backend is live.
 */
@Global()
@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const { storageProvider } = configService.get<AppConfig>('app')!;
        return storageProvider === 'r2'
          ? new CloudflareR2StorageProvider(configService)
          : new LocalStorageProvider(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
