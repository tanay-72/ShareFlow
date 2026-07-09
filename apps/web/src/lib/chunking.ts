/** Mirrors the API's own last-chunk-size math (see upload.service.ts) so the client knows exactly how many bytes each chunk should contain. */
export function chunkByteSize(
  index: number,
  totalChunks: number,
  totalSize: number,
  chunkSize: number,
): number {
  const isLastChunk = index === totalChunks - 1;
  return isLastChunk ? totalSize - chunkSize * (totalChunks - 1) : chunkSize;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
}
