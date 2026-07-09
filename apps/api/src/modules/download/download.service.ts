import {
  GoneException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Readable } from 'stream';
import { FileWithObjectRecord } from '../files/file.repository';
import { DownloadTokenPayload, FilesService } from '../files/files.service';
import { toContentDispositionFilename } from '../security/filename.util';
import { ExpiredTokenError, InvalidTokenError } from '../security/signed-token.errors';
import { SignedTokenService } from '../security/signed-token.service';
import { STORAGE_PROVIDER, StorageProvider } from '../storage/storage-provider.interface';
import { parseRangeHeader, RangeNotSatisfiableError } from './range.util';

export interface PreparedDownload {
  status: number;
  headers: Record<string, string>;
  stream: Readable;
  file: FileWithObjectRecord;
  /** True when the whole file was requested (not a partial byte range) — the only case download completion is recorded. */
  isFullDownload: boolean;
}

/**
 * Verifies the signed download token and streams bytes straight from the
 * StorageProvider to the caller. Deliberately re-checks the file's
 * accessibility (expiry / one-time-consumed) even though the token was
 * only just issued — the token's TTL window is short but non-zero, and the
 * underlying file can legitimately be consumed by a concurrent request in
 * that window.
 */
@Injectable()
export class DownloadService {
  constructor(
    private readonly signedTokenService: SignedTokenService,
    private readonly filesService: FilesService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  async prepareDownload(token: string, rangeHeader: string | undefined): Promise<PreparedDownload> {
    const payload = this.verifyToken(token);
    const file = await this.filesService.getAccessibleFileById(payload.fileId);
    const size = file.storedObject.size;

    // One-time-download files never honor Range requests: a partial GET
    // (e.g. a media player probing the first few KB) must not be able to
    // consume a file that's only allowed to be fetched once.
    const range = file.oneTimeDownload ? null : this.tryParseRange(rangeHeader, size);

    const baseHeaders: Record<string, string> = {
      'Content-Type': file.storedObject.mimeType,
      'Content-Disposition': `attachment; filename="${toContentDispositionFilename(file.originalFilename)}"`,
      'Accept-Ranges': file.oneTimeDownload ? 'none' : 'bytes',
    };

    if (range) {
      return {
        status: 206,
        headers: {
          ...baseHeaders,
          'Content-Range': `bytes ${range.start}-${range.end}/${size}`,
          'Content-Length': String(range.end - range.start + 1),
        },
        stream: this.storage.createReadStream(file.storedObject.storageKey, range),
        file,
        isFullDownload: false,
      };
    }

    return {
      status: 200,
      headers: { ...baseHeaders, 'Content-Length': String(size) },
      stream: this.storage.createReadStream(file.storedObject.storageKey),
      file,
      isFullDownload: true,
    };
  }

  async recordCompletion(file: FileWithObjectRecord): Promise<void> {
    await this.filesService.recordDownloadCompletion(file);
  }

  private verifyToken(token: string): DownloadTokenPayload & { exp: number } {
    try {
      return this.signedTokenService.verify<DownloadTokenPayload>(token);
    } catch (error) {
      if (error instanceof ExpiredTokenError) {
        throw new GoneException('This download link has expired. Please request a new one.');
      }
      if (error instanceof InvalidTokenError) {
        throw new UnauthorizedException('Invalid download link.');
      }
      throw error;
    }
  }

  private tryParseRange(rangeHeader: string | undefined, size: number) {
    try {
      return parseRangeHeader(rangeHeader, size);
    } catch (error) {
      if (error instanceof RangeNotSatisfiableError) {
        throw new RangeNotSatisfiableHttpException(error.size);
      }
      throw error;
    }
  }
}

export class RangeNotSatisfiableHttpException extends HttpException {
  constructor(size: number) {
    super(
      { statusCode: 416, message: 'Requested range is not satisfiable', size },
      HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
    );
  }
}
