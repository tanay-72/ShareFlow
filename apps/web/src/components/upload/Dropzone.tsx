import { MAX_FILE_SIZE_BYTES } from '@shareflow/shared';
import { UploadCloud } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { formatBytes } from '../../lib/chunking';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function Dropzone({ onFilesSelected, disabled }: DropzoneProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      const oversized = files.filter((file) => file.size > MAX_FILE_SIZE_BYTES);

      if (oversized.length > 0) {
        setRejectionError(
          `${oversized.map((f) => f.name).join(', ')} exceed${oversized.length === 1 ? 's' : ''} the ${formatBytes(MAX_FILE_SIZE_BYTES)} limit.`,
        );
      } else {
        setRejectionError(null);
      }

      const accepted = files.filter((file) => file.size <= MAX_FILE_SIZE_BYTES);
      if (accepted.length > 0) {
        onFilesSelected(accepted);
      }
    },
    [onFilesSelected],
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDraggingOver(false);
          if (!disabled) acceptFiles(event.dataTransfer.files);
        }}
        aria-disabled={disabled}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-16 text-center transition ${
          isDraggingOver
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
            : 'border-slate-300 hover:border-brand-400 dark:border-slate-700'
        } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
          <UploadCloud className="h-6 w-6" />
        </span>
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100">
            Drag &amp; drop files here, or click to browse
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Up to {formatBytes(MAX_FILE_SIZE_BYTES)} per file &middot; multiple files supported
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => acceptFiles(event.target.files)}
        />
      </div>
      {rejectionError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{rejectionError}</p>}
    </div>
  );
}
