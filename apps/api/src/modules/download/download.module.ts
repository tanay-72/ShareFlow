import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { DownloadController } from './download.controller';
import { DownloadService } from './download.service';

@Module({
  imports: [FilesModule],
  controllers: [DownloadController],
  providers: [DownloadService],
})
export class DownloadModule {}
