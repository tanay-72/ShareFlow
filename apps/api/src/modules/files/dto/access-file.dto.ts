import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AccessFileDto {
  @IsOptional()
  @IsString()
  @MaxLength(256)
  password?: string;
}
