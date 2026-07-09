import { describe, expect, it } from 'vitest';
import { runWithConcurrency } from './concurrency';

describe('runWithConcurrency', () => {
  it('runs every item exactly once', async () => {
    const seen: number[] = [];
    await runWithConcurrency([1, 2, 3, 4, 5], 2, async (item) => {
      seen.push(item);
    });
    expect(seen.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('never exceeds the concurrency limit', async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    await runWithConcurrency(Array.from({ length: 10 }, (_, i) => i), 3, async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight--;
    });

    expect(maxInFlight).toBeLessThanOrEqual(3);
  });

  it('propagates a task error', async () => {
    await expect(
      runWithConcurrency([1, 2, 3], 2, async (item) => {
        if (item === 2) throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
  });

  it('handles an empty item list', async () => {
    let called = false;
    await runWithConcurrency([], 4, async () => {
      called = true;
    });
    expect(called).toBe(false);
  });
});
