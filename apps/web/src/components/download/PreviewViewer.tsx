import type { PreviewCategory } from '@shareflow/shared';

interface PreviewViewerProps {
  category: PreviewCategory;
  downloadUrl: string;
  filename: string;
}

export function PreviewViewer({ category, downloadUrl, filename }: PreviewViewerProps) {
  switch (category) {
    case 'image':
      return (
        <div className="overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
          <img src={downloadUrl} alt={filename} className="mx-auto max-h-96 w-auto" />
        </div>
      );
    case 'video':
      return (
        <video controls className="w-full rounded-xl bg-black">
          <source src={downloadUrl} />
        </video>
      );
    case 'audio':
      return (
        <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
          <audio controls className="w-full">
            <source src={downloadUrl} />
          </audio>
        </div>
      );
    case 'pdf':
      return (
        <iframe
          src={downloadUrl}
          title={filename}
          className="h-96 w-full rounded-xl border border-slate-200 dark:border-slate-800"
        />
      );
    default:
      return null;
  }
}
