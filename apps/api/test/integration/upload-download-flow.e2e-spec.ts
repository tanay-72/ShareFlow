import { INestApplication } from '@nestjs/common';
import * as crypto from 'crypto';
import request from 'supertest';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { createTestApp } from '../utils/create-test-app';
import { resetDatabase } from '../utils/reset-database';

const CHUNK_SIZE = 5 * 1024 * 1024; // matches UPLOAD_CHUNK_SIZE_BYTES

describe('Upload -> Complete -> Download (e2e)', () => {
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

  async function uploadFile(content: Buffer, filename: string) {
    const initRes = await request(app.getHttpServer())
      .post('/uploads')
      .send({ filename, totalSize: content.length, mimeType: 'application/octet-stream' })
      .expect(201);

    const { uploadId, totalChunks } = initRes.body;

    for (let index = 0; index < totalChunks; index++) {
      const chunk = content.subarray(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE);
      await request(app.getHttpServer())
        .put(`/uploads/${uploadId}/chunks/${index}`)
        .set('Content-Type', 'application/octet-stream')
        .send(chunk)
        .expect(200);
    }

    return { uploadId };
  }

  it('uploads a multi-chunk file and downloads back byte-identical content', async () => {
    const content = crypto.randomBytes(CHUNK_SIZE + 1024); // spans 2 chunks
    const { uploadId } = await uploadFile(content, 'big-file.bin');

    const completeRes = await request(app.getHttpServer())
      .post(`/uploads/${uploadId}/complete`)
      .send({})
      .expect(201);

    expect(completeRes.body.deduplicated).toBe(false);
    const { slug } = completeRes.body;

    const metadataRes = await request(app.getHttpServer()).get(`/files/${slug}`).expect(200);
    expect(metadataRes.body.originalFilename).toBe('big-file.bin');
    expect(metadataRes.body.size).toBe(content.length);
    expect(metadataRes.body.requiresPassword).toBe(false);

    const accessRes = await request(app.getHttpServer())
      .post(`/files/${slug}/access`)
      .send({})
      .expect(200);

    const token = accessRes.body.downloadToken;
    const downloadRes = await request(app.getHttpServer())
      .get(`/download/${token}`)
      .expect(200)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(Buffer.compare(downloadRes.body, content)).toBe(0);
  });

  it('serves a 206 partial response for a Range request', async () => {
    const content = crypto.randomBytes(2048);
    const { uploadId } = await uploadFile(content, 'small-file.bin');
    const { body: completeBody } = await request(app.getHttpServer())
      .post(`/uploads/${uploadId}/complete`)
      .send({})
      .expect(201);

    const { body: accessBody } = await request(app.getHttpServer())
      .post(`/files/${completeBody.slug}/access`)
      .send({})
      .expect(200);

    const rangeRes = await request(app.getHttpServer())
      .get(`/download/${accessBody.downloadToken}`)
      .set('Range', 'bytes=0-99')
      .expect(206)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(rangeRes.headers['content-range']).toBe(`bytes 0-99/${content.length}`);
    expect(Buffer.compare(rangeRes.body, content.subarray(0, 100))).toBe(0);
  });

  it('deduplicates identical content across two separate uploads', async () => {
    const content = crypto.randomBytes(1024);
    const { uploadId: firstId } = await uploadFile(content, 'first-copy.bin');
    await request(app.getHttpServer()).post(`/uploads/${firstId}/complete`).send({}).expect(201);

    const { uploadId: secondId } = await uploadFile(content, 'second-copy.bin');
    const secondComplete = await request(app.getHttpServer())
      .post(`/uploads/${secondId}/complete`)
      .send({})
      .expect(201);

    expect(secondComplete.body.deduplicated).toBe(true);

    const storedObjects = await prisma.storedObject.findMany();
    expect(storedObjects).toHaveLength(1);
    expect(storedObjects[0].refCount).toBe(2);
  });

  it('rejects an out-of-range chunk index', async () => {
    const initRes = await request(app.getHttpServer())
      .post('/uploads')
      .send({ filename: 'tiny.bin', totalSize: 10, mimeType: 'application/octet-stream' })
      .expect(201);

    await request(app.getHttpServer())
      .put(`/uploads/${initRes.body.uploadId}/chunks/5`)
      .set('Content-Type', 'application/octet-stream')
      .send(Buffer.from('x'.repeat(10)))
      .expect(400);
  });

  it('rejects completion when chunks are missing', async () => {
    const initRes = await request(app.getHttpServer())
      .post('/uploads')
      .send({ filename: 'tiny2.bin', totalSize: 10, mimeType: 'application/octet-stream' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/uploads/${initRes.body.uploadId}/complete`)
      .send({})
      .expect(400);
  });

  it('rejects an upload larger than the platform maximum', async () => {
    await request(app.getHttpServer())
      .post('/uploads')
      .send({
        filename: 'too-big.bin',
        totalSize: 3 * 1024 * 1024 * 1024,
        mimeType: 'application/octet-stream',
      })
      .expect(400);
  });

  it('rejects a malformed request with unexpected fields', async () => {
    await request(app.getHttpServer())
      .post('/uploads')
      .send({
        filename: 'ok.bin',
        totalSize: 10,
        mimeType: 'application/octet-stream',
        notAllowedField: 'hack',
      })
      .expect(400);
  });
});
