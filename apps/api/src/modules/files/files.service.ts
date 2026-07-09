import {
  GoneException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DOWNLOAD_TOKEN_TTL_SECONDS } from '@shareflow/shared';
import { AppConfig } from '../../config/configuration';
import { StoredObjectService } from '../dedup/stored-object.service';
import { MimeSniffingService } from '../security/mime-sniffing.service';
import { PasswordService } from '../security/password.service';
import { generateSlug } from '../security/slug.util';
import { SignedTokenService } from '../security/signed-token.service';
import { FileRepository, FileWithObjectRecord } from './file.repository';

export interface CreateShareLinkParams {
  storedObjectId: string;
  originalFilename: string;
  password?: string;
  expiresInSeconds?: number;
  oneTimeDownload?: boolean;
}

export interface FileMetadataView {
  slug: string;
  originalFilename: string;
  size: number;
  mimeType: string;
  previewCategory: 'image' | 'pdf' | 'video' | 'audio' | 'none';
  requiresPassword: boolean;
  oneTimeDownload: boolean;
  expiresAt: string | null;
  downloadCount: number;
  lastDownloadAt: string | null;
  createdAt: string;
}

export interface DownloadTokenPayload extends Record<string, unknown> {
  fileId: string;
}

/**
 * Owns share-link lifecycle: creation, metadata lookup, password/expiry/
 * one-time access enforcement, and short-lived download-token issuance.
 *
 * Deliberately does *not* stream any bytes — that responsibility lives in
 * DownloadModule, which trusts a signed token minted here instead of
 * re-checking password/expiry itself. See the architecture notes in the
 * README ("Signed URLs") for why authorization and byte-serving are split
 * across two modules.
 */
@Injectable()
export class FilesService {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly storedObjectService: StoredObjectService,
    private readonly passwordService: PasswordService,
    private readonly signedTokenService: SignedTokenService,
    private readonly mimeSniffingService: MimeSniffingService,
    private readonly configService: ConfigService,
  ) {}

  async createShareLink(params: CreateShareLinkParams): Promise<FileWithObjectRecord> {
    const passwordHash = params.password
      ? await this.passwordService.hash(params.password)
      : null;
    const expiresAt = params.expiresInSeconds
      ? new Date(Date.now() + params.expiresInSeconds * 1000)
      : null;

    return this.fileRepository.create({
      slug: generateSlug(),
      storedObjectId: params.storedObjectId,
      originalFilename: params.originalFilename,
      passwordHash,
      oneTimeDownload: params.oneTimeDownload ?? false,
      expiresAt,
    });
  }

  async getMetadata(slug: string): Promise<FileMetadataView> {
    const file = await this.fileRepository.findBySlug(slug);
    if (!file) {
      throw new NotFoundException('This share link does not exist.');
    }
    this.assertNotExpiredOrConsumed(file);

    return {
      slug: file.slug,
      originalFilename: file.originalFilename,
      size: file.storedObject.size,
      mimeType: file.storedObject.mimeType,
      previewCategory: this.mimeSniffingService.categorizeForPreview(file.storedObject.mimeType),
      requiresPassword: file.passwordHash !== null,
      oneTimeDownload: file.oneTimeDownload,
      expiresAt: file.expiresAt?.toISOString() ?? null,
      downloadCount: file.downloadCount,
      lastDownloadAt: file.lastDownloadAt?.toISOString() ?? null,
      createdAt: file.createdAt.toISOString(),
    };
  }

  async requestAccess(
    slug: string,
    password: string | undefined,
  ): Promise<{ downloadToken: string; downloadUrl: string; expiresAt: string }> {
    const file = await this.fileRepository.findBySlug(slug);
    if (!file) {
      throw new NotFoundException('This share link does not exist.');
    }
    this.assertNotExpiredOrConsumed(file);

    if (file.passwordHash) {
      if (!password) {
        throw new UnauthorizedException('A password is required to access this file.');
      }
      const matches = await this.passwordService.verify(file.passwordHash, password);
      if (!matches) {
        throw new UnauthorizedException('Incorrect password.');
      }
    }

    const token = this.signedTokenService.sign<DownloadTokenPayload>(
      { fileId: file.id },
      DOWNLOAD_TOKEN_TTL_SECONDS,
    );
    const { publicApiUrl } = this.configService.get<AppConfig>('app')!;

    return {
      downloadToken: token,
      downloadUrl: `${publicApiUrl}/download/${token}`,
      expiresAt: new Date(Date.now() + DOWNLOAD_TOKEN_TTL_SECONDS * 1000).toISOString(),
    };
  }

  async getAccessibleFileById(fileId: string): Promise<FileWithObjectRecord> {
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new NotFoundException('This file no longer exists.');
    }
    this.assertNotExpiredOrConsumed(file);
    return file;
  }

  /**
   * Called once a download response has fully completed. For one-time-
   * download files this deletes the File row and releases the dedup
   * reference immediately, so any subsequent access attempt — even one
   * already holding a still-valid signed token — is correctly rejected.
   */
  async recordDownloadCompletion(file: FileWithObjectRecord): Promise<void> {
    if (file.oneTimeDownload) {
      await this.fileRepository.hardDelete(file.id);
      await this.storedObjectService.decrementRefCount(file.storedObjectId);
      return;
    }
    await this.fileRepository.recordDownload(file.id);
  }

  /** Used by the cleanup worker. Returns the number of File rows purged. */
  async purgeExpiredAndConsumed(): Promise<number> {
    const stale = await this.fileRepository.findExpiredOrConsumed(new Date());
    for (const file of stale) {
      await this.fileRepository.hardDelete(file.id);
      await this.storedObjectService.decrementRefCount(file.storedObjectId);
    }
    return stale.length;
  }

  private assertNotExpiredOrConsumed(file: FileWithObjectRecord): void {
    if (file.deletedAt) {
      throw new GoneException('This share link has been removed.');
    }
    if (file.expiresAt && file.expiresAt.getTime() <= Date.now()) {
      throw new GoneException('This share link has expired.');
    }
    if (file.oneTimeDownload && file.downloadCount >= 1) {
      throw new GoneException('This file was already downloaded and is no longer available.');
    }
  }
}
