import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const passwordService = new PasswordService();

  it('hashes a password to a non-plaintext argon2id string', async () => {
    const hash = await passwordService.hash('correct-horse-battery-staple');
    expect(hash).not.toEqual('correct-horse-battery-staple');
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it('verifies a correct password against its hash', async () => {
    const hash = await passwordService.hash('my-secret');
    await expect(passwordService.verify(hash, 'my-secret')).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await passwordService.hash('my-secret');
    await expect(passwordService.verify(hash, 'wrong-secret')).resolves.toBe(false);
  });

  it('treats a malformed stored hash as a failed match instead of throwing', async () => {
    await expect(passwordService.verify('not-a-real-hash', 'anything')).resolves.toBe(false);
  });

  it('produces different hashes for the same password (random salt)', async () => {
    const [first, second] = await Promise.all([
      passwordService.hash('same-password'),
      passwordService.hash('same-password'),
    ]);
    expect(first).not.toEqual(second);
  });
});
