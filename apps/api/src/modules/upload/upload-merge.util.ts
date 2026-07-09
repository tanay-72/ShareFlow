import * as crypto from 'crypto';
import { createReadStream, createWriteStream } from 'fs';

export interface MergeResult {
  sha256: string;
  size: number;
}

/**
 * Concatenates chunk files (in the given order) into `destPath` while
 * streaming every byte through a SHA-256 hash — the merged file is never
 * buffered in memory, and no second read-through is needed just to compute
 * its hash afterwards.
 */
export function mergeChunksWithHash(chunkPaths: string[], destPath: string): Promise<MergeResult> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    let size = 0;
    const writeStream = createWriteStream(destPath);

    writeStream.on('error', reject);
    writeStream.on('finish', () => resolve({ sha256: hash.digest('hex'), size }));

    const writeNextChunk = (index: number): void => {
      if (index >= chunkPaths.length) {
        writeStream.end();
        return;
      }

      const readStream = createReadStream(chunkPaths[index]);
      readStream.on('error', reject);
      readStream.on('data', (chunk: string | Buffer) => {
        const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
        hash.update(buffer);
        size += buffer.length;
      });
      readStream.on('end', () => writeNextChunk(index + 1));
      readStream.pipe(writeStream, { end: false });
    };

    if (chunkPaths.length === 0) {
      writeStream.end();
    } else {
      writeNextChunk(0);
    }
  });
}
