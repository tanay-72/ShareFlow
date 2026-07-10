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
 * R2 exposes an S3-compatible API, so this is the AWS SDK v3 S3 client
 * pointed at R2's account endpoint with R2 API token credentials. Object
 * keys are the same sharded SHA-256 strings `buildObjectKey()` produces for
 * local disk — no key-format translation needed when swapping providers.
 */
@Injectable()
export class CloudflareR2StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(@Inject(ConfigService) configService: ConfigService) {
    const { r2 } = configService.get<AppConfig>('app')!;
    if (!r2) {
      throw new Error('R2 storage selected but R2 configuration is missing');
    }
    this.bucket = r2.bucket;
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${r2.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2.accessKeyId,
        secretAccessKey: r2.secretAccessKey,
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
