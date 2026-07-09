import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { createReadStream, createWriteStream } from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { AppConfig } from '../../config/configuration';
import { assertSafeObjectKey } from './storage-key.util';
import { ByteRange, StorageProvider, StorageSaveResult } from './storage-provider.interface';

/**
 * Filesystem-backed StorageProvider for local development and small
 * self-hosted deployments. Every method resolves `key` against a fixed
 * root directory and re-validates the resolved path stays inside that
 * root, so a malformed or malicious key can never escape via `..` segments.
 */
@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly root: string;

  constructor(@Inject(ConfigService) configService: ConfigService) {
    const { storageRoot } = configService.get<AppConfig>('app')!;
    this.root = path.resolve(storageRoot);
  }

  private resolvePath(key: string): string {
    assertSafeObjectKey(key);
    const resolved = path.resolve(this.root, key);
    if (!resolved.startsWith(this.root + path.sep) && resolved !== this.root) {
      throw new Error(`Resolved path escapes storage root for key: ${key}`);
    }
    return resolved;
  }

  async save(source: Readable, key: string): Promise<StorageSaveResult> {
    const destination = this.resolvePath(key);
    await fsp.mkdir(path.dirname(destination), { recursive: true });

    const tempDestination = `${destination}.part-${process.pid}-${Date.now()}`;
    let bytesWritten = 0;
    source.on('data', (chunk: Buffer) => {
      bytesWritten += chunk.length;
    });

    try {
      await pipeline(source, createWriteStream(tempDestination));
      await fsp.rename(tempDestination, destination);
    } catch (error) {
      await fsp.rm(tempDestination, { force: true });
      throw error;
    }

    return { key, size: bytesWritten };
  }

  createReadStream(key: string, range?: ByteRange): Readable {
    const resolved = this.resolvePath(key);
    return createReadStream(resolved, range ? { start: range.start, end: range.end } : undefined);
  }

  async delete(key: string): Promise<void> {
    const resolved = this.resolvePath(key);
    await fsp.rm(resolved, { force: true });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fsp.access(this.resolvePath(key), fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async getSize(key: string): Promise<number> {
    const stat = await fsp.stat(this.resolvePath(key));
    return stat.size;
  }
}
