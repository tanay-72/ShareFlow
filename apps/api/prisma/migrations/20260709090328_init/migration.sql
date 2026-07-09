-- CreateEnum
CREATE TYPE "UploadSessionStatus" AS ENUM ('PENDING', 'COMPLETED', 'ABORTED');

-- CreateTable
CREATE TABLE "UploadSession" (
    "id" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "claimedMimeType" TEXT NOT NULL,
    "totalSize" BIGINT NOT NULL,
    "chunkSize" INTEGER NOT NULL,
    "totalChunks" INTEGER NOT NULL,
    "status" "UploadSessionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadChunk" (
    "id" TEXT NOT NULL,
    "uploadSessionId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoredObject" (
    "id" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "refCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "storedObjectId" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "passwordHash" TEXT,
    "oneTimeDownload" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastDownloadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UploadSession_status_expiresAt_idx" ON "UploadSession"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UploadChunk_uploadSessionId_chunkIndex_key" ON "UploadChunk"("uploadSessionId", "chunkIndex");

-- CreateIndex
CREATE UNIQUE INDEX "StoredObject_sha256_key" ON "StoredObject"("sha256");

-- CreateIndex
CREATE INDEX "StoredObject_refCount_idx" ON "StoredObject"("refCount");

-- CreateIndex
CREATE UNIQUE INDEX "File_slug_key" ON "File"("slug");

-- CreateIndex
CREATE INDEX "File_expiresAt_idx" ON "File"("expiresAt");

-- CreateIndex
CREATE INDEX "File_deletedAt_idx" ON "File"("deletedAt");

-- AddForeignKey
ALTER TABLE "UploadChunk" ADD CONSTRAINT "UploadChunk_uploadSessionId_fkey" FOREIGN KEY ("uploadSessionId") REFERENCES "UploadSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_storedObjectId_fkey" FOREIGN KEY ("storedObjectId") REFERENCES "StoredObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
