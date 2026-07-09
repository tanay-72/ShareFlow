import {
  BadRequestException,
  GoneException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UPLOAD_CHUNK_SIZE_BYTES, UPLOAD_SESSION_TTL_HOURS } from '@shareflow/shared';
import { createWriteStream } from 'fs';
import * as fsp from 'fs/promises';
import { Readable } from 'stream';
import { AppConfig } from '../../config/configuration';
import { StoredObjectService } from '../dedup/stored-object.service';
import { FileWithObjectRecord } from '../files/file.repository';
import { FilesService } from '../files/files.service';
import { QrCodeService } from '../qrcode/qrcode.service';
import { MimeSniffingService } from '../security/mime-sniffing.service';
import { sanitizeDisplayFilename } from '../security/filename.util';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { InitUploadDto } from './dto/init-upload.dto';
import { mergeChunksWithHash } from './upload-merge.util';
import { chunkFilePath, mergedFilePath, sessionDir } from './upload-temp-path.util';
import { UploadSessionRecord, UploadSessionRepository } from './upload-session.repository';

export interface CompleteUploadResult {
  file: FileWithObjectRecord;
  deduplicated: boolean;
  shareUrl: string;
  qrCodeDataUrl: string;
}

/**
 * Orchestrates the chunked upload protocol: session creation, individual
 * chunk writes (streamed directly to disk, never buffered in full), and
 * completion (streaming merge + hash, dedup lookup, share-link creation).
 */
@Injectable()
export class UploadService {
  private readonly uploadTempRoot: string;
  private readonly publicAppUrl: string;

  constructor(
    private readonly uploadSessionRepository: UploadSessionRepository,
    private readonly storedObjectService: StoredObjectService,
    private readonly filesService: FilesService,
    private readonly mimeSniffingService: MimeSniffingService,
    private readonly qrCodeService: QrCodeService,
    configService: ConfigService,
  ) {
    const config = configService.get<AppConfig>('app')!;
    this.uploadTempRoot = config.uploadTempRoot;
    this.publicAppUrl = config.publicAppUrl;
  }

  async initUpload(dto: InitUploadDto) {
    const chunkSize = UPLOAD_CHUNK_SIZE_BYTES;
    const totalChunks = Math.max(1, Math.ceil(dto.totalSize / chunkSize));
    const expiresAt = new Date(Date.now() + UPLOAD_SESSION_TTL_HOURS * 60 * 60 * 1000);

    const session = await this.uploadSessionRepository.create({
      originalFilename: sanitizeDisplayFilename(dto.filename),
      claimedMimeType: dto.mimeType,
      totalSize: dto.totalSize,
      chunkSize,
      totalChunks,
      expiresAt,
    });

    await fsp.mkdir(sessionDir(this.uploadTempRoot, session.id), { recursive: true });

    return { uploadId: session.id, chunkSize, totalChunks };
  }

  async getStatus(uploadId: string) {
    const session = await this.getSessionOrThrow(uploadId);
    const receivedChunkIndexes = await this.uploadSessionRepository.listReceivedChunkIndexes(
      uploadId,
    );
    return {
      uploadId,
      status: session.status,
      totalChunks: session.totalChunks,
      receivedChunkIndexes,
    };
  }

  async writeChunk(uploadId: string, chunkIndex: number, contentLength: number | undefined, source: Readable) {
    const session = await this.getSessionOrThrow(uploadId);
    this.assertSessionNotExpired(session);

    if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || chunkIndex >= session.totalChunks) {
      throw new BadRequestException(
        `Invalid chunk index ${chunkIndex}; must be between 0 and ${session.totalChunks - 1}.`,
      );
    }

    const expectedSize = this.expectedChunkSize(session, chunkIndex);
    if (contentLength !== undefined && contentLength !== expectedSize) {
      throw new BadRequestException(
        `Chunk ${chunkIndex} declared size ${contentLength} does not match expected size ${expectedSize}.`,
      );
    }

    const destination = chunkFilePath(this.uploadTempRoot, uploadId, chunkIndex);
    await this.writeStreamCappedAtSize(source, destination, expectedSize);
    await this.uploadSessionRepository.upsertChunk({
      uploadSessionId: uploadId,
      chunkIndex,
      size: expectedSize,
    });

    return { chunkIndex, received: true };
  }

  async completeUpload(uploadId: string, dto: CompleteUploadDto): Promise<CompleteUploadResult> {
    const session = await this.getSessionOrThrow(uploadId);
    this.assertSessionNotExpired(session);

    const receivedIndexes = await this.uploadSessionRepository.listReceivedChunkIndexes(uploadId);
    if (receivedIndexes.length !== session.totalChunks) {
      throw new BadRequestException(
        `Upload incomplete: received ${receivedIndexes.length} of ${session.totalChunks} chunks.`,
      );
    }

    const chunkPaths = Array.from({ length: session.totalChunks }, (_, index) =>
      chunkFilePath(this.uploadTempRoot, uploadId, index),
    );
    const mergedPath = mergedFilePath(this.uploadTempRoot, uploadId);
    const { sha256, size } = await mergeChunksWithHash(chunkPaths, mergedPath);

    if (size !== session.totalSize) {
      await this.cleanupSessionFiles(uploadId);
      throw new BadRequestException(
        `Merged file size (${size} bytes) does not match the declared size (${session.totalSize} bytes).`,
      );
    }

    let storedObject = await this.storedObjectService.findBySha256(sha256);
    let deduplicated = true;

    if (storedObject) {
      await this.storedObjectService.incrementRefCount(storedObject.id);
    } else {
      const sniffedMimeType = await this.mimeSniffingService.detectFromFile(
        mergedPath,
        session.claimedMimeType,
      );
      storedObject = await this.storedObjectService.createFromTempFile({
        sha256,
        size,
        mimeType: sniffedMimeType,
        tempFilePath: mergedPath,
      });
      deduplicated = false;
    }

    const file = await this.filesService.createShareLink({
      storedObjectId: storedObject.id,
      originalFilename: session.originalFilename,
      password: dto.password,
      expiresInSeconds: dto.expiresInSeconds,
      oneTimeDownload: dto.oneTimeDownload,
    });

    await this.cleanupSessionFiles(uploadId);
    await this.uploadSessionRepository.delete(uploadId);

    const shareUrl = `${this.publicAppUrl}/f/${file.slug}`;
    const qrCodeDataUrl = await this.qrCodeService.generateDataUrl(shareUrl);

    return { file, deduplicated, shareUrl, qrCodeDataUrl };
  }

  private expectedChunkSize(session: UploadSessionRecord, chunkIndex: number): number {
    const isLastChunk = chunkIndex === session.totalChunks - 1;
    return isLastChunk
      ? session.totalSize - session.chunkSize * (session.totalChunks - 1)
      : session.chunkSize;
  }

  private assertSessionNotExpired(session: UploadSessionRecord): void {
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new GoneException('This upload session has expired. Please start a new upload.');
    }
  }

  private async getSessionOrThrow(uploadId: string): Promise<UploadSessionRecord> {
    const session = await this.uploadSessionRepository.findById(uploadId);
    if (!session) {
      throw new NotFoundException('Upload session not found.');
    }
    return session;
  }

  private async cleanupSessionFiles(uploadId: string): Promise<void> {
    await fsp.rm(sessionDir(this.uploadTempRoot, uploadId), { recursive: true, force: true });
  }

  /**
   * Streams `source` to `destination`, aborting the moment more than
   * `maxBytes` have been written. This is what rejects an oversized chunk
   * even when a client lies about (or omits) Content-Length — the limit is
   * enforced on actual bytes received, not on a trusted header.
   */
  private writeStreamCappedAtSize(
    source: Readable,
    destination: string,
    maxBytes: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let bytesWritten = 0;
      let settled = false;
      const writeStream = createWriteStream(destination);

      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        source.destroy();
        writeStream.destroy();
        fsp.rm(destination, { force: true }).finally(() => reject(error));
      };

      source.on('data', (chunk: Buffer) => {
        bytesWritten += chunk.length;
        if (bytesWritten > maxBytes) {
          fail(new PayloadTooLargeException(`Chunk exceeds expected size of ${maxBytes} bytes.`));
        }
      });
      source.on('error', fail);
      writeStream.on('error', fail);
      writeStream.on('finish', () => {
        if (settled) return;
        if (bytesWritten !== maxBytes) {
          fail(
            new BadRequestException(
              `Chunk is incomplete: received ${bytesWritten} of ${maxBytes} expected bytes.`,
            ),
          );
          return;
        }
        settled = true;
        resolve();
      });

      source.pipe(writeStream);
    });
  }
}
