import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import * as fsp from 'fs/promises';
import { AppConfig } from '../../config/configuration';
import { CLEANUP_CRON_EXPRESSION } from '../../config/cron.constants';
import { StoredObjectService } from '../dedup/stored-object.service';
import { FilesService } from '../files/files.service';
import { sessionDir } from '../upload/upload-temp-path.util';
import { UploadSessionRepository } from '../upload/upload-session.repository';

/**
 * Background sweeper for everything that must eventually disappear but
 * can't be cleaned up synchronously at the moment it becomes stale:
 *   - File rows past their expiration (nobody is "there" to trigger cleanup on expiry)
 *   - Abandoned chunked-upload sessions (client vanished mid-upload)
 *   - StoredObjects left at refCount 0 (a safety net — normal deletion
 *     paths already clean these up inline, this catches any that slipped
 *     through, e.g. from a crash between decrementing refCount and
 *     deleting the object)
 */
@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);
  private readonly uploadTempRoot: string;

  constructor(
    private readonly filesService: FilesService,
    private readonly storedObjectService: StoredObjectService,
    private readonly uploadSessionRepository: UploadSessionRepository,
    configService: ConfigService,
  ) {
    this.uploadTempRoot = configService.get<AppConfig>('app')!.uploadTempRoot;
  }

  @Cron(CLEANUP_CRON_EXPRESSION)
  async runCleanup(): Promise<void> {
    const [purgedFiles, purgedSessions, purgedOrphans] = await Promise.all([
      this.filesService.purgeExpiredAndConsumed(),
      this.purgeStaleUploadSessions(),
      this.storedObjectService.sweepOrphans(),
    ]);

    if (purgedFiles || purgedSessions || purgedOrphans) {
      this.logger.log(
        `Cleanup pass: ${purgedFiles} expired/consumed file(s), ${purgedSessions} stale upload session(s), ${purgedOrphans} orphaned object(s) purged.`,
      );
    }
  }

  private async purgeStaleUploadSessions(): Promise<number> {
    const staleSessions = await this.uploadSessionRepository.findStale(new Date());
    for (const session of staleSessions) {
      await fsp.rm(sessionDir(this.uploadTempRoot, session.id), { recursive: true, force: true });
      await this.uploadSessionRepository.delete(session.id);
    }
    return staleSessions.length;
  }
}
