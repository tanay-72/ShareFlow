import { Module } from '@nestjs/common';
import { DedupModule } from '../dedup/dedup.module';
import { FilesModule } from '../files/files.module';
import { QrCodeModule } from '../qrcode/qrcode.module';
import { UploadController } from './upload.controller';
import { UploadSessionRepository } from './upload-session.repository';
import { UploadService } from './upload.service';

@Module({
  imports: [DedupModule, FilesModule, QrCodeModule],
  controllers: [UploadController],
  providers: [UploadSessionRepository, UploadService],
  exports: [UploadSessionRepository],
})
export class UploadModule {}
