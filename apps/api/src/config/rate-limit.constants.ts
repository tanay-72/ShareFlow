/**
 * `@Throttle(...)` decorators run at class-definition time (when the
 * controller module is first `require`d), which is *before* Nest's
 * dependency-injected `ConfigService` exists — so these two values are read
 * directly from `process.env` instead of going through config injection.
 * This only works because `main.ts`'s very first statement is
 * `import 'dotenv/config'`, guaranteeing env vars are populated before any
 * other module (and therefore any decorator) is evaluated.
 */
export const UPLOAD_RATE_LIMIT_PER_HOUR = parseInt(
  process.env.UPLOAD_RATE_LIMIT_PER_HOUR ?? '100',
  10,
);

export const DOWNLOAD_RATE_LIMIT_PER_HOUR = parseInt(
  process.env.DOWNLOAD_RATE_LIMIT_PER_HOUR ?? '300',
  10,
);
