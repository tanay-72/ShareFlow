import { Module } from '@nestjs/common';
import { DedupModule } from '../dedup/dedup.module';
import { FileRepository } from './file.repository';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [DedupModule],
  controllers: [FilesController],
  providers: [FileRepository, FilesService],
  exports: [FilesService],
})
export class FilesModule {}
