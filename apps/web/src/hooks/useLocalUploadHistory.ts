import { useCallback, useEffect, useState } from 'react';

export interface UploadHistoryEntry {
  slug: string;
  filename: string;
  size: number;
  uploadedAt: string;
}

const STORAGE_KEY = 'shareflow:upload-history';
const MAX_ENTRIES = 50;

function readHistory(): UploadHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UploadHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

/**
 * Since ShareFlow has no accounts, "my uploads" only exists as a
 * convenience on the device that created the link — stored in
 * localStorage, never sent to the server.
 */
export function useLocalUploadHistory() {
  const [history, setHistory] = useState<UploadHistoryEntry[]>(readHistory);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const addEntry = useCallback((entry: UploadHistoryEntry) => {
    setHistory((prev) => [entry, ...prev.filter((existing) => existing.slug !== entry.slug)].slice(0, MAX_ENTRIES));
  }, []);

  const removeEntry = useCallback((slug: string) => {
    setHistory((prev) => prev.filter((entry) => entry.slug !== slug));
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  return { history, addEntry, removeEntry, clearHistory };
}
