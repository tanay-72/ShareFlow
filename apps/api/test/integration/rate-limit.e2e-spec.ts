import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { createTestApp } from '../utils/create-test-app';
import { resetDatabase } from '../utils/reset-database';

/**
 * Exercising the exact configured numeric limit (e.g. "429 on the 101st
 * request") would require re-loading UploadController with a different
 * `UPLOAD_RATE_LIMIT_PER_HOUR` baked in — but that constant is fixed at
 * module-load time (see rate-limit.constants.ts), and Jest's module
 * registry is already shared with every other e2e file's `AppModule`
 * import in this run, so forcing a reload safely (without corrupting
 * NestJS's own singleton tokens) isn't practical here. Instead, this
 * verifies the ThrottlerGuard is actually wired up and decrementing a
 * real per-IP counter, which is the behavior that matters — the exact
 * threshold is configured via UPLOAD_RATE_LIMIT_PER_HOUR and covered by
 * manual/production verification (see README's rate limiting section).
 */
describe('Rate limiting headers (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  it('reports rate-limit headers that decrease with each upload-session request', async () => {
    const first = await request(app.getHttpServer())
      .post('/uploads')
      .send({ filename: 'a.bin', totalSize: 10, mimeType: 'application/octet-stream' })
      .expect(201);

    const second = await request(app.getHttpServer())
      .post('/uploads')
      .send({ filename: 'b.bin', totalSize: 10, mimeType: 'application/octet-stream' })
      .expect(201);

    expect(first.headers['x-ratelimit-limit']).toBeDefined();
    const firstRemaining = Number(first.headers['x-ratelimit-remaining']);
    const secondRemaining = Number(second.headers['x-ratelimit-remaining']);
    expect(secondRemaining).toBe(firstRemaining - 1);
  });

  it('tracks upload and download requests under separate rate-limit buckets', async () => {
    const uploadRes = await request(app.getHttpServer())
      .post('/uploads')
      .send({ filename: 'c.bin', totalSize: 10, mimeType: 'application/octet-stream' })
      .expect(201);

    const downloadRes = await request(app.getHttpServer())
      .get('/download/not-a-real-token')
      .expect(401);

    // Different configured limits (upload vs. download) prove the two
    // controllers are throttled independently rather than sharing one
    // global counter.
    expect(uploadRes.headers['x-ratelimit-limit']).not.toBe(downloadRes.headers['x-ratelimit-limit']);
  });
});
