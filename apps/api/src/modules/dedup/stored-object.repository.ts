import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface StoredObjectRecord {
  id: string;
  sha256: string;
  size: number;
  mimeType: string;
  storageKey: string;
  refCount: number;
  createdAt: Date;
}

/** Isolates Prisma access for the StoredObject entity behind a plain-number API (Prisma's BigInt is only used at the storage boundary). */
@Injectable()
export class StoredObjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySha256(sha256: string): Promise<StoredObjectRecord | null> {
    const record = await this.prisma.storedObject.findUnique({ where: { sha256 } });
    return record ? this.toRecord(record) : null;
  }

  async create(params: {
    sha256: string;
    size: number;
    mimeType: string;
    storageKey: string;
  }): Promise<StoredObjectRecord> {
    const record = await this.prisma.storedObject.create({
      data: { ...params, size: BigInt(params.size), refCount: 1 },
    });
    return this.toRecord(record);
  }

  async incrementRefCount(id: string): Promise<StoredObjectRecord> {
    const record = await this.prisma.storedObject.update({
      where: { id },
      data: { refCount: { increment: 1 } },
    });
    return this.toRecord(record);
  }

  async decrementRefCount(id: string): Promise<StoredObjectRecord> {
    const record = await this.prisma.storedObject.update({
      where: { id },
      data: { refCount: { decrement: 1 } },
    });
    return this.toRecord(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.storedObject.delete({ where: { id } });
  }

  async findOrphaned(): Promise<StoredObjectRecord[]> {
    const records = await this.prisma.storedObject.findMany({ where: { refCount: { lte: 0 } } });
    return records.map((record) => this.toRecord(record));
  }

  private toRecord(record: {
    id: string;
    sha256: string;
    size: bigint;
    mimeType: string;
    storageKey: string;
    refCount: number;
    createdAt: Date;
  }): StoredObjectRecord {
    return { ...record, size: Number(record.size) };
  }
}
