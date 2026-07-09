import { Module } from '@nestjs/common';
import { StoredObjectRepository } from './stored-object.repository';
import { StoredObjectService } from './stored-object.service';

@Module({
  providers: [StoredObjectRepository, StoredObjectService],
  exports: [StoredObjectService],
})
export class DedupModule {}
