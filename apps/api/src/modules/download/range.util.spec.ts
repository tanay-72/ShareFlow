import { parseRangeHeader, RangeNotSatisfiableError } from './range.util';

const SIZE = 1000;

describe('parseRangeHeader', () => {
  it('returns null when no range header is present', () => {
    expect(parseRangeHeader(undefined, SIZE)).toBeNull();
  });

  it('parses a standard bytes=start-end range', () => {
    expect(parseRangeHeader('bytes=0-99', SIZE)).toEqual({ start: 0, end: 99 });
  });

  it('parses an open-ended range (bytes=start-)', () => {
    expect(parseRangeHeader('bytes=500-', SIZE)).toEqual({ start: 500, end: 999 });
  });

  it('parses a suffix range (last N bytes)', () => {
    expect(parseRangeHeader('bytes=-100', SIZE)).toEqual({ start: 900, end: 999 });
  });

  it('clamps an end beyond the file size to the last byte', () => {
    expect(parseRangeHeader('bytes=900-5000', SIZE)).toEqual({ start: 900, end: 999 });
  });

  it('falls back to serving the whole file for a multi-range request', () => {
    expect(parseRangeHeader('bytes=0-99,200-299', SIZE)).toBeNull();
  });

  it('throws for a start beyond the file size', () => {
    expect(() => parseRangeHeader('bytes=5000-6000', SIZE)).toThrow(RangeNotSatisfiableError);
  });

  it('throws when start is greater than end', () => {
    expect(() => parseRangeHeader('bytes=500-100', SIZE)).toThrow(RangeNotSatisfiableError);
  });

  it('ignores a header without the bytes= prefix', () => {
    expect(parseRangeHeader('items=0-1', SIZE)).toBeNull();
  });
});
