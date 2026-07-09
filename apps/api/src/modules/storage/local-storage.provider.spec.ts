import { ConfigService } from '@nestjs/config';
import * as fsp from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { Readable } from 'stream';
import { LocalStorageProvider } from './local-storage.provider';

function streamOf(text: string): Readable {
  return Readable.from([Buffer.from(text)]);
}

async function collect(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

describe('LocalStorageProvider', () => {
  let root: string;
  let provider: LocalStorageProvider;

  beforeEach(async () => {
    root = await fsp.mkdtemp(path.join(os.tmpdir(), 'shareflow-storage-test-'));
    const configService = { get: () => ({ storageRoot: root }) } as unknown as ConfigService;
    provider = new LocalStorageProvider(configService);
  });

  afterEach(async () => {
    await fsp.rm(root, { recursive: true, force: true });
  });

  it('saves and reads back the full content of an object', async () => {
    await provider.save(streamOf('hello world'), 'ab/cd/abcd1234');
    const content = await collect(provider.createReadStream('ab/cd/abcd1234'));
    expect(content).toBe('hello world');
  });

  it('creates sharded parent directories automatically', async () => {
    await provider.save(streamOf('data'), 'ff/ee/ffee5678');
    const stat = await fsp.stat(path.join(root, 'ff', 'ee', 'ffee5678'));
    expect(stat.isFile()).toBe(true);
  });

  it('supports ranged reads', async () => {
    await provider.save(streamOf('0123456789'), 'aa/bb/aabb0001');
    const content = await collect(provider.createReadStream('aa/bb/aabb0001', { start: 2, end: 5 }));
    expect(content).toBe('2345');
  });

  it('reports correct size and existence', async () => {
    await provider.save(streamOf('twelve bytes'), 'cc/dd/ccdd0002');
    await expect(provider.exists('cc/dd/ccdd0002')).resolves.toBe(true);
    await expect(provider.getSize('cc/dd/ccdd0002')).resolves.toBe(12);
    await expect(provider.exists('does/not/exist')).resolves.toBe(false);
  });

  it('deletes an object', async () => {
    await provider.save(streamOf('to be deleted'), 'dd/ee/ddee0003');
    await provider.delete('dd/ee/ddee0003');
    await expect(provider.exists('dd/ee/ddee0003')).resolves.toBe(false);
  });

  it('does not throw when deleting a non-existent key', async () => {
    await expect(provider.delete('never/existed/00')).resolves.toBeUndefined();
  });

  it('rejects a key containing path traversal segments', () => {
    expect(() => provider.createReadStream('../../etc/passwd')).toThrow();
  });

  it('rejects an absolute-path key', () => {
    expect(() => provider.createReadStream('/etc/passwd')).toThrow();
  });
});
