/**
 * Runs `task` over `items` with at most `limit` in flight at once — the
 * mechanism behind parallel chunk uploads. A fixed-size pool of "workers"
 * each pull the next item off a shared cursor, so as soon as one chunk
 * finishes uploading, that worker immediately starts the next one instead
 * of waiting for the whole batch to settle.
 */
export async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const workerCount = Math.max(1, Math.min(limit, items.length));

  const workers = Array.from({ length: workerCount }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await task(items[index]);
    }
  });

  await Promise.all(workers);
}
