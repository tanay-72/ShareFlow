import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { MAX_FILE_SIZE_BYTES } from '@shareflow/shared';

export class InitUploadDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_FILE_SIZE_BYTES)
  totalSize: number;

  @IsString()
  @IsNotEmpty()
  mimeType: string;
}
