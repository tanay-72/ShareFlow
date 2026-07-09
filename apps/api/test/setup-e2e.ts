import * as fsp from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

// Populated before any spec file's own imports run (Jest evaluates
// `setupFilesAfterEnv` scripts before requiring the test file itself), so
// every module that reads `process.env` at load time — including the
// `@Throttle`/`@Cron` decorators described in rate-limit.constants.ts and
// cron.constants.ts — sees these values.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  `postgresql://${os.userInfo().username}@localhost:5432/shareflow_test?schema=public`;
process.env.APP_SECRET = 'e2e-test-secret-key-not-for-production-use';
process.env.PUBLIC_APP_URL = 'http://localhost:5173';
process.env.PUBLIC_API_URL = 'http://localhost:4000';
process.env.CORS_ORIGINS = 'http://localhost:5173';
process.env.STORAGE_ROOT = path.join(__dirname, '.e2e-storage', 'objects');
process.env.UPLOAD_TEMP_ROOT = path.join(__dirname, '.e2e-storage', 'tmp-uploads');
process.env.UPLOAD_RATE_LIMIT_PER_HOUR = process.env.UPLOAD_RATE_LIMIT_PER_HOUR ?? '10000';
// Deliberately different from the upload limit so tests can assert the two
// controllers are throttled through independent buckets, not a shared one.
process.env.DOWNLOAD_RATE_LIMIT_PER_HOUR = process.env.DOWNLOAD_RATE_LIMIT_PER_HOUR ?? '12000';
process.env.CLEANUP_CRON_INTERVAL_MINUTES = '60';

// Runs once before each spec *file* (e2e tests are executed with
// --runInBand, so this never races a sibling file's storage directory).
beforeAll(async () => {
  await fsp.rm(path.join(__dirname, '.e2e-storage'), { recursive: true, force: true });
  await fsp.mkdir(process.env.STORAGE_ROOT!, { recursive: true });
  await fsp.mkdir(process.env.UPLOAD_TEMP_ROOT!, { recursive: true });
});
