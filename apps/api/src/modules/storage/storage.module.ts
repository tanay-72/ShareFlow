import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';
import { LocalStorageProvider } from './local-storage.provider';
import { BackblazeB2StorageProvider } from './providers/backblaze-b2-storage.provider';
import { CloudflareR2StorageProvider } from './providers/cloudflare-r2-storage.provider';
import { STORAGE_PROVIDER } from './storage-provider.interface';

/**
 * Binds the StorageProvider interface to a concrete implementation, chosen
 * at boot by STORAGE_PROVIDER ('local' | 'r2' | 'b2'). Every consumer
 * injects STORAGE_PROVIDER and only ever calls interface methods, so this
 * factory is the single place that knows which backend is live.
 */
@Global()
@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const { storageProvider } = configService.get<AppConfig>('app')!;
        switch (storageProvider) {
          case 'r2':
            return new CloudflareR2StorageProvider(configService);
          case 'b2':
            return new BackblazeB2StorageProvider(configService);
          default:
            return new LocalStorageProvider(configService);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
