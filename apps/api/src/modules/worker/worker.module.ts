import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from '../../config/configuration';
import { validateEnv } from '../../config/env.validation';
import { DedupModule } from '../dedup/dedup.module';
import { FilesModule } from '../files/files.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SecurityModule } from '../security/security.module';
import { StorageModule } from '../storage/storage.module';
import { UploadModule } from '../upload/upload.module';
import { CleanupService } from './cleanup.service';

/**
 * The worker boots via `NestFactory.createApplicationContext`, a separate
 * DI container from the HTTP API's AppModule — `@Global()` providers are
 * only global *within the context that imported them*, so this module
 * cannot rely on AppModule having already set up Config/Prisma/Storage; it
 * imports each of them itself.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate: validateEnv }),
    ScheduleModule.forRoot(),
    PrismaModule,
    StorageModule,
    SecurityModule,
    DedupModule,
    FilesModule,
    UploadModule,
  ],
  providers: [CleanupService],
})
export class WorkerModule {}
