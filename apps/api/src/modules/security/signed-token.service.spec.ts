import { ConfigService } from '@nestjs/config';
import { ExpiredTokenError, InvalidTokenError } from './signed-token.errors';
import { SignedTokenService } from './signed-token.service';

function buildService(secret = 'test-secret-key'): SignedTokenService {
  const configService = {
    get: () => ({ appSecret: secret }),
  } as unknown as ConfigService;
  return new SignedTokenService(configService);
}

describe('SignedTokenService', () => {
  it('round-trips a signed payload', () => {
    const service = buildService();
    const token = service.sign({ fileId: 'abc-123' }, 60);
    const payload = service.verify<{ fileId: string }>(token);
    expect(payload.fileId).toBe('abc-123');
  });

  it('rejects a token signed with a different secret', () => {
    const token = buildService('secret-a').sign({ fileId: 'abc-123' }, 60);
    expect(() => buildService('secret-b').verify(token)).toThrow(InvalidTokenError);
  });

  it('rejects a tampered payload even if the signature segment is untouched', () => {
    const service = buildService();
    const token = service.sign({ fileId: 'abc-123' }, 60);
    const [body, signature] = token.split('.');
    const tamperedPayload = Buffer.from(JSON.stringify({ fileId: 'evil-id', exp: 9999999999 })).toString(
      'base64url',
    );
    const tampered = `${tamperedPayload}.${signature}`;
    expect(tampered).not.toEqual(token);
    expect(body).toBeDefined();
    expect(() => service.verify(tampered)).toThrow(InvalidTokenError);
  });

  it('rejects a malformed token', () => {
    const service = buildService();
    expect(() => service.verify('not-a-valid-token')).toThrow(InvalidTokenError);
  });

  it('rejects an expired token', () => {
    const service = buildService();
    const token = service.sign({ fileId: 'abc-123' }, -1);
    expect(() => service.verify(token)).toThrow(ExpiredTokenError);
  });
});
