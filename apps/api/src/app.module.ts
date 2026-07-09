import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as express from 'express';
import configuration, { AppConfig } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DedupModule } from './modules/dedup/dedup.module';
import { DownloadModule } from './modules/download/download.module';
import { FilesModule } from './modules/files/files.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { QrCodeModule } from './modules/qrcode/qrcode.module';
import { SecurityModule } from './modules/security/security.module';
import { StorageModule } from './modules/storage/storage.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate: validateEnv }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const { downloadRateLimitPerHour } = configService.get<AppConfig>('app')!;
        return [
          // Generic abuse guard applied to every route by default; the
          // upload/download controllers override this with `@Throttle`
          // using their own configured limits.
          { name: 'default', ttl: 60_000, limit: Math.max(60, Math.ceil(downloadRateLimitPerHour / 4)) },
        ];
      },
    }),
    PrismaModule,
    StorageModule,
    SecurityModule,
    DedupModule,
    FilesModule,
    UploadModule,
    DownloadModule,
    QrCodeModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Chunk uploads are streamed straight to disk and must never pass
    // through a body parser (which would buffer the whole chunk into
    // memory as a Buffer). Every other route gets standard JSON parsing.
    consumer
      .apply(express.json({ limit: '1mb' }), express.urlencoded({ extended: true, limit: '1mb' }))
      .exclude({ path: 'uploads/:id/chunks/:index', method: RequestMethod.PUT })
      .forRoutes('*');
  }
}
