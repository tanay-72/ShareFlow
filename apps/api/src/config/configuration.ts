export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  appSecret: string;
  publicAppUrl: string;
  publicApiUrl: string;
  corsOrigins: string[];
  storageRoot: string;
  uploadTempRoot: string;
  uploadRateLimitPerHour: number;
  downloadRateLimitPerHour: number;
  cleanupCronIntervalMinutes: number;
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
    storageRoot: process.env.STORAGE_ROOT ?? './data/storage/objects',
    uploadTempRoot: process.env.UPLOAD_TEMP_ROOT ?? './data/storage/tmp-uploads',
    uploadRateLimitPerHour: parseInt(process.env.UPLOAD_RATE_LIMIT_PER_HOUR ?? '100', 10),
    downloadRateLimitPerHour: parseInt(process.env.DOWNLOAD_RATE_LIMIT_PER_HOUR ?? '300', 10),
    cleanupCronIntervalMinutes: parseInt(
      process.env.CLEANUP_CRON_INTERVAL_MINUTES ?? '15',
      10,
    ),
  },
});
