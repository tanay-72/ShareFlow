export interface ParsedRange {
  start: number;
  end: number;
}

/**
 * Parses a single-range HTTP `Range` header (`bytes=start-end`,
 * `bytes=start-`, or `bytes=-suffixLength`) against a known content size.
 * Multi-range requests are not supported — like most file-hosting services,
 * ShareFlow treats a multi-range request as "no range" and serves the
 * whole file, since range requests here exist for resumable downloads and
 * media seeking, not partial-content composition.
 *
 * Returns `null` when there is no usable range (serve the whole file).
 * Throws when the header is present but unsatisfiable for the given size.
 */
export function parseRangeHeader(rangeHeader: string | undefined, size: number): ParsedRange | null {
  if (!rangeHeader || !rangeHeader.startsWith('bytes=')) {
    return null;
  }

  const spec = rangeHeader.slice('bytes='.length);
  if (spec.includes(',')) {
    return null; // multi-range: fall back to serving the full file
  }

  const [startRaw, endRaw] = spec.split('-');

  if (startRaw === '' && endRaw !== '') {
    // Suffix range: last N bytes.
    const suffixLength = parseInt(endRaw, 10);
    if (Number.isNaN(suffixLength) || suffixLength <= 0) {
      throw new RangeNotSatisfiableError(size);
    }
    const start = Math.max(0, size - suffixLength);
    return { start, end: size - 1 };
  }

  const start = parseInt(startRaw, 10);
  const end = endRaw === '' ? size - 1 : parseInt(endRaw, 10);

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
    throw new RangeNotSatisfiableError(size);
  }

  return { start, end: Math.min(end, size - 1) };
}

export class RangeNotSatisfiableError extends Error {
  constructor(public readonly size: number) {
    super('Requested range is not satisfiable');
    this.name = 'RangeNotSatisfiableError';
  }
}
