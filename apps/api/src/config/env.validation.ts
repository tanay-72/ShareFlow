import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

/**
 * Fails fast on boot if the environment is misconfigured, rather than
 * surfacing a confusing error later at the first request that touches a
 * missing variable.
 */
class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: string = 'development';

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 4000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  APP_SECRET: string;

  @IsString()
  @IsNotEmpty()
  PUBLIC_APP_URL: string;

  @IsString()
  @IsOptional()
  PUBLIC_API_URL?: string;

  @IsString()
  @IsOptional()
  CORS_ORIGINS?: string;

  @IsString()
  @IsOptional()
  STORAGE_ROOT?: string;

  @IsIn(['local', 'r2'])
  @IsOptional()
  STORAGE_PROVIDER?: string;

  @IsString()
  @IsOptional()
  R2_ACCOUNT_ID?: string;

  @IsString()
  @IsOptional()
  R2_ACCESS_KEY_ID?: string;

  @IsString()
  @IsOptional()
  R2_SECRET_ACCESS_KEY?: string;

  @IsString()
  @IsOptional()
  R2_BUCKET?: string;

  @IsInt()
  @IsOptional()
  UPLOAD_RATE_LIMIT_PER_HOUR?: number;

  @IsInt()
  @IsOptional()
  DOWNLOAD_RATE_LIMIT_PER_HOUR?: number;

  @IsInt()
  @IsOptional()
  CLEANUP_CRON_INTERVAL_MINUTES?: number;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    const message = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Environment validation failed: ${message}`);
  }

  return validatedConfig;
}
