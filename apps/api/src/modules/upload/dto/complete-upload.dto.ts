import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const MAX_EXPIRATION_SECONDS = 30 * 24 * 60 * 60; // 30 days

export class CompleteUploadDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  password?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(60)
  @Max(MAX_EXPIRATION_SECONDS)
  expiresInSeconds?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  oneTimeDownload?: boolean;
}
