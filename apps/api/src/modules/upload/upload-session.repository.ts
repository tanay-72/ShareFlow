import { Injectable } from '@nestjs/common';
import { UploadSessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface UploadSessionRecord {
  id: string;
  originalFilename: string;
  claimedMimeType: string;
  totalSize: number;
  chunkSize: number;
  totalChunks: number;
  status: UploadSessionStatus;
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class UploadSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    originalFilename: string;
    claimedMimeType: string;
    totalSize: number;
    chunkSize: number;
    totalChunks: number;
    expiresAt: Date;
  }): Promise<UploadSessionRecord> {
    const record = await this.prisma.uploadSession.create({
      data: { ...params, totalSize: BigInt(params.totalSize) },
    });
    return this.toRecord(record);
  }

  async findById(id: string): Promise<UploadSessionRecord | null> {
    const record = await this.prisma.uploadSession.findUnique({ where: { id } });
    return record ? this.toRecord(record) : null;
  }

  async findStale(before: Date): Promise<UploadSessionRecord[]> {
    const records = await this.prisma.uploadSession.findMany({
      where: { expiresAt: { lt: before } },
    });
    return records.map((record) => this.toRecord(record));
  }

  /** Deletes the session; UploadChunk rows cascade automatically. */
  async delete(id: string): Promise<void> {
    await this.prisma.uploadSession.delete({ where: { id } });
  }

  async upsertChunk(params: {
    uploadSessionId: string;
    chunkIndex: number;
    size: number;
  }): Promise<void> {
    await this.prisma.uploadChunk.upsert({
      where: {
        uploadSessionId_chunkIndex: {
          uploadSessionId: params.uploadSessionId,
          chunkIndex: params.chunkIndex,
        },
      },
      create: params,
      update: { size: params.size, receivedAt: new Date() },
    });
  }

  async listReceivedChunkIndexes(uploadSessionId: string): Promise<number[]> {
    const chunks = await this.prisma.uploadChunk.findMany({
      where: { uploadSessionId },
      select: { chunkIndex: true },
      orderBy: { chunkIndex: 'asc' },
    });
    return chunks.map((chunk) => chunk.chunkIndex);
  }

  private toRecord(record: {
    id: string;
    originalFilename: string;
    claimedMimeType: string;
    totalSize: bigint;
    chunkSize: number;
    totalChunks: number;
    status: UploadSessionStatus;
    createdAt: Date;
    expiresAt: Date;
  }): UploadSessionRecord {
    return { ...record, totalSize: Number(record.totalSize) };
  }
}
