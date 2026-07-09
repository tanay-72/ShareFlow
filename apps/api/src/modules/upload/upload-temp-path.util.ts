import * as path from 'path';

/**
 * Upload session IDs are server-generated UUIDs (never taken from client
 * input), so building filesystem paths directly from them is safe — no
 * sanitization is needed the way it is for user-supplied filenames.
 */
export function sessionDir(uploadTempRoot: string, uploadSessionId: string): string {
  return path.resolve(uploadTempRoot, uploadSessionId);
}

export function chunkFilePath(
  uploadTempRoot: string,
  uploadSessionId: string,
  chunkIndex: number,
): string {
  return path.join(sessionDir(uploadTempRoot, uploadSessionId), `chunk-${chunkIndex}`);
}

export function mergedFilePath(uploadTempRoot: string, uploadSessionId: string): string {
  return path.join(sessionDir(uploadTempRoot, uploadSessionId), 'merged');
}
