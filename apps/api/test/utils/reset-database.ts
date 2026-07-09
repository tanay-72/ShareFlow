import { PrismaService } from '../../src/modules/prisma/prisma.service';

export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "File", "StoredObject", "UploadChunk", "UploadSession" RESTART IDENTITY CASCADE',
  );
}
