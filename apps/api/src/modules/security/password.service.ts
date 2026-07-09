import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

/**
 * Wraps argon2id, the current OWASP-recommended password hashing algorithm
 * (memory-hard, resistant to GPU/ASIC cracking — a materially better choice
 * than bcrypt for a greenfield project in 2026). Share-link passwords are
 * short-lived, low-stakes secrets by nature, but they're still never stored
 * or logged in plaintext.
 */
@Injectable()
export class PasswordService {
  async hash(plainTextPassword: string): Promise<string> {
    return argon2.hash(plainTextPassword, { type: argon2.argon2id });
  }

  async verify(hash: string, plainTextPassword: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plainTextPassword);
    } catch {
      // A malformed hash should never crash the request — treat it as a failed match.
      return false;
    }
  }
}
