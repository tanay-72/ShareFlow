import { sanitizeDisplayFilename, toContentDispositionFilename } from './filename.util';

describe('sanitizeDisplayFilename', () => {
  it('leaves a normal filename untouched', () => {
    expect(sanitizeDisplayFilename('report.pdf')).toBe('report.pdf');
  });

  it('strips directory components (path traversal attempt)', () => {
    expect(sanitizeDisplayFilename('../../etc/passwd')).toBe('passwd');
  });

  it('strips a Windows-style traversal attempt', () => {
    expect(sanitizeDisplayFilename('..\\..\\windows\\system32\\config')).not.toContain('\\');
  });

  it('replaces unsafe characters', () => {
    expect(sanitizeDisplayFilename('weird<>:"|?*name.txt')).toBe('weird_______name.txt');
  });

  it('falls back to a default name when nothing safe remains', () => {
    expect(sanitizeDisplayFilename('////')).toBe('unnamed-file');
  });

  it('truncates excessively long filenames', () => {
    const longName = `${'a'.repeat(300)}.txt`;
    expect(sanitizeDisplayFilename(longName).length).toBeLessThanOrEqual(255);
  });
});

describe('toContentDispositionFilename', () => {
  it('escapes double quotes to prevent header injection', () => {
    expect(toContentDispositionFilename('evil".pdf')).toBe("evil'.pdf");
  });
});
