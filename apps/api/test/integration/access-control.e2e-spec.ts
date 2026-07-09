import { INestApplication } from '@nestjs/common';
import * as crypto from 'crypto';
import request from 'supertest';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { createTestApp } from '../utils/create-test-app';
import { resetDatabase } from '../utils/reset-database';

describe('Access control: password, expiry, one-time download (e2e)', () => {
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

  async function uploadSingleChunkFile(content: Buffer, completeBody: Record<string, unknown>) {
    const initRes = await request(app.getHttpServer())
      .post('/uploads')
      .send({ filename: 'secret.bin', totalSize: content.length, mimeType: 'application/octet-stream' })
      .expect(201);

    await request(app.getHttpServer())
      .put(`/uploads/${initRes.body.uploadId}/chunks/0`)
      .set('Content-Type', 'application/octet-stream')
      .send(content)
      .expect(200);

    const completeRes = await request(app.getHttpServer())
      .post(`/uploads/${initRes.body.uploadId}/complete`)
      .send(completeBody)
      .expect(201);

    return completeRes.body.slug as string;
  }

  it('requires the correct password before issuing a download token', async () => {
    const content = crypto.randomBytes(256);
    const slug = await uploadSingleChunkFile(content, { password: 'hunter2' });

    await request(app.getHttpServer()).post(`/files/${slug}/access`).send({}).expect(401);
    await request(app.getHttpServer())
      .post(`/files/${slug}/access`)
      .send({ password: 'wrong' })
      .expect(401);
    await request(app.getHttpServer())
      .post(`/files/${slug}/access`)
      .send({ password: 'hunter2' })
      .expect(200);
  });

  it('reports requiresPassword in metadata without needing the password itself', async () => {
    const content = crypto.randomBytes(256);
    const slug = await uploadSingleChunkFile(content, { password: 'hunter2' });

    const res = await request(app.getHttpServer()).get(`/files/${slug}`).expect(200);
    expect(res.body.requiresPassword).toBe(true);
  });

  it('returns 410 Gone for an expired share link', async () => {
    const content = crypto.randomBytes(256);
    const slug = await uploadSingleChunkFile(content, { expiresInSeconds: 3600 });

    // Force expiry directly in the DB rather than waiting an hour.
    await prisma.file.update({ where: { slug }, data: { expiresAt: new Date(Date.now() - 1000) } });

    await request(app.getHttpServer()).get(`/files/${slug}`).expect(410);
    await request(app.getHttpServer()).post(`/files/${slug}/access`).send({}).expect(410);
  });

  it('deletes a one-time-download file after its first successful download and rejects further access', async () => {
    const content = crypto.randomBytes(256);
    const slug = await uploadSingleChunkFile(content, { oneTimeDownload: true });

    const accessRes = await request(app.getHttpServer())
      .post(`/files/${slug}/access`)
      .send({})
      .expect(200);

    await request(app.getHttpServer()).get(`/download/${accessRes.body.downloadToken}`).expect(200);

    // Give the async recordDownloadCompletion() a tick to finish.
    await new Promise((resolve) => setImmediate(resolve));

    await request(app.getHttpServer()).get(`/files/${slug}`).expect(404);
    await request(app.getHttpServer()).post(`/files/${slug}/access`).send({}).expect(404);

    const remaining = await prisma.file.findUnique({ where: { slug } });
    expect(remaining).toBeNull();
  });

  it('rejects an invalid or tampered download token', async () => {
    await request(app.getHttpServer()).get('/download/not-a-real-token').expect(401);
  });

  it('returns 404 for a share link that never existed', async () => {
    await request(app.getHttpServer()).get('/files/does-not-exist').expect(404);
  });
});
