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
        className={`group relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed px-8 py-16 text-center transition-all duration-300 ${
          isDraggingOver
            ? 'border-brand-500 bg-brand-500/10 scale-[1.01] shadow-xl shadow-brand-500/5 dark:border-brand-400 dark:bg-brand-500/5'
            : 'border-slate-200/90 bg-white/40 hover:border-brand-500/60 hover:bg-white/80 hover:shadow-lg hover:shadow-slate-100/50 dark:border-slate-800/80 dark:bg-slate-900/10 dark:hover:border-brand-500/40 dark:hover:bg-slate-900/30 dark:hover:shadow-black/10'
        } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      >
        <span className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100/80 text-brand-600 shadow-sm transition-all duration-300 dark:from-slate-850 dark:to-slate-800/80 dark:text-brand-400 ${isDraggingOver ? 'scale-110 rotate-3' : 'group-hover:scale-105'}`}>
          <UploadCloud className={`h-7 w-7 transition-transform duration-300 ${isDraggingOver ? 'animate-bounce' : 'group-hover:-translate-y-0.5'}`} />
        </span>
        <div className="space-y-1">
          <p className="font-display text-base font-semibold text-slate-800 dark:text-slate-200">
            Drag &amp; drop files here, or <span className="text-brand-600 dark:text-brand-400 group-hover:underline">browse</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
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
      {rejectionError && <p className="mt-2 text-sm text-red-650 dark:text-red-400">{rejectionError}</p>}
    </div>
  );
}
