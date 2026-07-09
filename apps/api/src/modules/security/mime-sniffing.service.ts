import { Injectable } from '@nestjs/common';
import type { fileTypeFromFile as FileTypeFromFile } from 'file-type';

/**
 * `file-type` ships as an ESM-only package. A plain `await import(...)`
 * would normally handle that fine at runtime, but TypeScript compiled with
 * `module: commonjs` silently downlevels dynamic `import()` back into a
 * synchronous `require()` call — which then fails on an ESM-only package
 * with ERR_PACKAGE_PATH_NOT_EXPORTED. Routing the import through the
 * Function constructor hides it from that downleveling, forcing Node's
 * real ESM-aware dynamic import at runtime.
 */
const importFileType = new Function(
  'return import("file-type")',
) as () => Promise<{ fileTypeFromFile: typeof FileTypeFromFile }>;

/**
 * Determines a file's real MIME type from its magic bytes rather than
 * trusting the client-supplied Content-Type / filename extension, which are
 * trivially spoofable and would otherwise let a malicious upload masquerade
 * as e.g. an image to bypass preview or validation logic.
 */
@Injectable()
export class MimeSniffingService {
  async detectFromFile(filePath: string, fallbackMimeType: string): Promise<string> {
    const { fileTypeFromFile } = await importFileType();
    const detected = await fileTypeFromFile(filePath);
    return detected?.mime ?? fallbackMimeType;
  }

  categorizeForPreview(mimeType: string): 'image' | 'pdf' | 'video' | 'audio' | 'none' {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'none';
  }
}
