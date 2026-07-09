import * as crypto from 'crypto';
import * as fsp from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { mergeChunksWithHash } from './upload-merge.util';

describe('mergeChunksWithHash', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'shareflow-merge-test-'));
  });

  afterEach(async () => {
    await fsp.rm(dir, { recursive: true, force: true });
  });

  it('concatenates chunks in order and computes the correct SHA-256 hash', async () => {
    const partA = path.join(dir, 'a');
    const partB = path.join(dir, 'b');
    const dest = path.join(dir, 'merged');
    await fsp.writeFile(partA, 'hello ');
    await fsp.writeFile(partB, 'world');

    const result = await mergeChunksWithHash([partA, partB], dest);

    const mergedContent = await fsp.readFile(dest, 'utf8');
    expect(mergedContent).toBe('hello world');
    expect(result.size).toBe(Buffer.byteLength('hello world'));
    expect(result.sha256).toBe(
      crypto.createHash('sha256').update('hello world').digest('hex'),
    );
  });

  it('produces an empty file and the SHA-256 of empty input when given no chunks', async () => {
    const dest = path.join(dir, 'empty');
    const result = await mergeChunksWithHash([], dest);

    expect(result.size).toBe(0);
    expect(result.sha256).toBe(crypto.createHash('sha256').update('').digest('hex'));
  });

  it('preserves chunk order even for many small chunks', async () => {
    const chunkPaths: string[] = [];
    for (let i = 0; i < 10; i++) {
      const chunkPath = path.join(dir, `chunk-${i}`);
      await fsp.writeFile(chunkPath, String(i));
      chunkPaths.push(chunkPath);
    }
    const dest = path.join(dir, 'merged-many');

    await mergeChunksWithHash(chunkPaths, dest);

    const content = await fsp.readFile(dest, 'utf8');
    expect(content).toBe('0123456789');
  });
});
