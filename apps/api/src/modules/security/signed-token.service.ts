import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { AppConfig } from '../../config/configuration';
import { ExpiredTokenError, InvalidTokenError } from './signed-token.errors';

/**
 * Issues and verifies short-lived, tamper-proof download tokens.
 *
 * Deliberately hand-rolled instead of pulling in `jsonwebtoken`: the token
 * only ever needs one claim shape and one algorithm (HMAC-SHA256), so a JWT
 * library would add header/alg-negotiation surface area (a common source of
 * real-world JWT vulnerabilities — e.g. `alg: none` confusion) without any
 * benefit here. The format is `base64url(payload).base64url(hmac)`,
 * verified with a constant-time comparison to prevent timing attacks.
 */
@Injectable()
export class SignedTokenService {
  private readonly secret: Buffer;

  constructor(configService: ConfigService) {
    this.secret = Buffer.from(configService.get<AppConfig>('app')!.appSecret, 'utf8');
  }

  sign<T extends Record<string, unknown>>(payload: T, ttlSeconds: number): string {
    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
    const body = Buffer.from(JSON.stringify({ ...payload, exp: expiresAt }), 'utf8').toString(
      'base64url',
    );
    const signature = this.computeSignature(body);
    return `${body}.${signature}`;
  }

  verify<T extends Record<string, unknown>>(token: string): T & { exp: number } {
    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new InvalidTokenError('Malformed token');
    }
    const [body, signature] = parts;
    const expectedSignature = this.computeSignature(body);

    if (!this.timingSafeEquals(signature, expectedSignature)) {
      throw new InvalidTokenError();
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T & {
      exp: number;
    };

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new ExpiredTokenError();
    }

    return payload;
  }

  private computeSignature(body: string): string {
    return crypto.createHmac('sha256', this.secret).update(body).digest('base64url');
  }

  private timingSafeEquals(a: string, b: string): boolean {
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);
    if (bufferA.length !== bufferB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufferA, bufferB);
  }
}
