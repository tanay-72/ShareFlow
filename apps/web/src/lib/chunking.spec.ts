import { describe, expect, it } from 'vitest';
import { chunkByteSize, formatBytes } from './chunking';

describe('chunkByteSize', () => {
  const chunkSize = 5 * 1024 * 1024;

  it('returns the full chunk size for a non-final chunk', () => {
    expect(chunkByteSize(0, 3, chunkSize * 2 + 1024, chunkSize)).toBe(chunkSize);
  });

  it('returns the remainder for the final chunk', () => {
    const totalSize = chunkSize * 2 + 1024;
    expect(chunkByteSize(2, 3, totalSize, chunkSize)).toBe(1024);
  });

  it('handles a single-chunk file', () => {
    expect(chunkByteSize(0, 1, 1024, chunkSize)).toBe(1024);
  });
});

describe('formatBytes', () => {
  it('formats zero bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats bytes under 1 KB without decimals', () => {
    expect(formatBytes(512)).toBe('512 B');
  });

  it('formats kilobytes with one decimal', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('formats gigabytes', () => {
    expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe('2.0 GB');
  });
});
