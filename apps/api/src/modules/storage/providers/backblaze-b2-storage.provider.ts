import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { AppConfig } from '../../../config/configuration';
import { assertSafeObjectKey } from '../storage-key.util';
import { ByteRange, StorageProvider, StorageSaveResult } from '../storage-provider.interface';

/**
 * Backblaze B2 exposes an S3-compatible API, so this reuses the AWS SDK v3
 * S3 client like CloudflareR2StorageProvider does. Unlike R2 (one endpoint
 * per Cloudflare account), B2's S3-compatible endpoint is per-region
 * (e.g. https://s3.us-west-002.backblazeb2.com) and isn't derivable from
 * the key pair alone, so the full endpoint is passed in via config rather
 * than assembled from an account ID.
 */
@Injectable()
export class BackblazeB2StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(@Inject(ConfigService) configService: ConfigService) {
    const { b2 } = configService.get<AppConfig>('app')!;
    if (!b2) {
      throw new Error('B2 storage selected but B2 configuration is missing');
    }
    this.bucket = b2.bucket;
    this.client = new S3Client({
      region: 'auto',
      endpoint: b2.endpoint,
      credentials: {
        accessKeyId: b2.applicationKeyId,
        secretAccessKey: b2.applicationKey,
      },
    });
  }

  async save(source: Readable, key: string): Promise<StorageSaveResult> {
    assertSafeObjectKey(key);
    let bytesWritten = 0;
    source.on('data', (chunk: Buffer) => {
      bytesWritten += chunk.length;
    });

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: source,
      }),
    );

    return { key, size: bytesWritten };
  }

  createReadStream(key: string, range?: ByteRange): Readable {
    assertSafeObjectKey(key);
    const passthrough = new Readable({ read() {} });

    this.client
      .send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Range: range ? `bytes=${range.start}-${range.end}` : undefined,
        }),
      )
      .then((response) => {
        const body = response.Body as Readable;
        body.on('data', (chunk) => passthrough.push(chunk));
        body.on('end', () => passthrough.push(null));
        body.on('error', (error) => passthrough.destroy(error));
      })
      .catch((error) => passthrough.destroy(error));

    return passthrough;
  }

  async delete(key: string): Promise<void> {
    assertSafeObjectKey(key);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async exists(key: string): Promise<boolean> {
    assertSafeObjectKey(key);
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch (error) {
      if (error instanceof NotFound) {
        return false;
      }
      throw error;
    }
  }

  async getSize(key: string): Promise<number> {
    assertSafeObjectKey(key);
    const response = await this.client.send(
      new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    return response.ContentLength ?? 0;
  }
}
