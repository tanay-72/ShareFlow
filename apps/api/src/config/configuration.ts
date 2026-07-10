export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  appSecret: string;
  publicAppUrl: string;
  publicApiUrl: string;
  corsOrigins: string[];
  storageProvider: 'local' | 'r2';
  storageRoot: string;
  uploadTempRoot: string;
  uploadRateLimitPerHour: number;
  downloadRateLimitPerHour: number;
  cleanupCronIntervalMinutes: number;
  r2?: R2Config;
}

export default (): { app: AppConfig } => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '4000', 10),
    databaseUrl: process.env.DATABASE_URL as string,
    appSecret: process.env.APP_SECRET as string,
    publicAppUrl: process.env.PUBLIC_APP_URL as string,
    publicApiUrl: process.env.PUBLIC_API_URL ?? (process.env.PUBLIC_APP_URL as string),
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    storageProvider: process.env.STORAGE_PROVIDER === 'r2' ? 'r2' : 'local',
    storageRoot: process.env.STORAGE_ROOT ?? './data/storage/objects',
    uploadTempRoot: process.env.UPLOAD_TEMP_ROOT ?? './data/storage/tmp-uploads',
    uploadRateLimitPerHour: parseInt(process.env.UPLOAD_RATE_LIMIT_PER_HOUR ?? '100', 10),
    downloadRateLimitPerHour: parseInt(process.env.DOWNLOAD_RATE_LIMIT_PER_HOUR ?? '300', 10),
    cleanupCronIntervalMinutes: parseInt(
      process.env.CLEANUP_CRON_INTERVAL_MINUTES ?? '15',
      10,
    ),
    r2: process.env.R2_ACCOUNT_ID
      ? {
          accountId: process.env.R2_ACCOUNT_ID as string,
          accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
          bucket: process.env.R2_BUCKET as string,
        }
      : undefined,
  },
});
