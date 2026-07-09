/**
 * Same constraint as rate-limit.constants.ts: `@Cron(...)` is evaluated at
 * class-definition time, before ConfigService exists, so the interval is
 * read directly from `process.env` (populated by the `dotenv/config`
 * import that must run before any other module is loaded).
 */
const intervalMinutes = parseInt(process.env.CLEANUP_CRON_INTERVAL_MINUTES ?? '15', 10);

export const CLEANUP_CRON_EXPRESSION = `*/${intervalMinutes} * * * *`;
