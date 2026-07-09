import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface FileWithObjectRecord {
  id: string;
  slug: string;
  storedObjectId: string;
  originalFilename: string;
  passwordHash: string | null;
  oneTimeDownload: boolean;
  expiresAt: Date | null;
  downloadCount: number;
  lastDownloadAt: Date | null;
  createdAt: Date;
  deletedAt: Date | null;
  storedObject: {
    id: string;
    sha256: string;
    size: number;
    mimeType: string;
    storageKey: string;
  };
}

const storedObjectInclude = {
  storedObject: {
    select: { id: true, sha256: true, size: true, mimeType: true, storageKey: true },
  },
} as const;

@Injectable()
export class FileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    slug: string;
    storedObjectId: string;
    originalFilename: string;
    passwordHash: string | null;
    oneTimeDownload: boolean;
    expiresAt: Date | null;
  }): Promise<FileWithObjectRecord> {
    const record = await this.prisma.file.create({
      data: params,
      include: storedObjectInclude,
    });
    return this.toRecord(record);
  }

  async findBySlug(slug: string): Promise<FileWithObjectRecord | null> {
    const record = await this.prisma.file.findUnique({
      where: { slug },
      include: storedObjectInclude,
    });
    return record ? this.toRecord(record) : null;
  }

  async findById(id: string): Promise<FileWithObjectRecord | null> {
    const record = await this.prisma.file.findUnique({
      where: { id },
      include: storedObjectInclude,
    });
    return record ? this.toRecord(record) : null;
  }

  async recordDownload(id: string): Promise<void> {
    await this.prisma.file.update({
      where: { id },
      data: { downloadCount: { increment: 1 }, lastDownloadAt: new Date() },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.file.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async findExpiredOrConsumed(before: Date): Promise<FileWithObjectRecord[]> {
    const records = await this.prisma.file.findMany({
      where: {
        deletedAt: null,
        OR: [{ expiresAt: { lt: before } }, { AND: [{ oneTimeDownload: true }, { downloadCount: { gte: 1 } }] }],
      },
      include: storedObjectInclude,
    });
    return records.map((record) => this.toRecord(record));
  }

  async hardDelete(id: string): Promise<void> {
    await this.prisma.file.delete({ where: { id } });
  }

  private toRecord(record: {
    id: string;
    slug: string;
    storedObjectId: string;
    originalFilename: string;
    passwordHash: string | null;
    oneTimeDownload: boolean;
    expiresAt: Date | null;
    downloadCount: number;
    lastDownloadAt: Date | null;
    createdAt: Date;
    deletedAt: Date | null;
    storedObject: { id: string; sha256: string; size: bigint; mimeType: string; storageKey: string };
  }): FileWithObjectRecord {
    return {
      ...record,
      storedObject: { ...record.storedObject, size: Number(record.storedObject.size) },
    };
  }
}
