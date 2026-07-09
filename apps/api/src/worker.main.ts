// See main.ts for why this must be the first import.
import 'dotenv/config';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './modules/worker/worker.module';

/**
 * Separate entrypoint for the background cleanup worker. Runs as its own
 * process/container (see docker-compose.yml's `worker` service) sharing
 * the same codebase and Prisma/storage access as the API, but with no HTTP
 * server — `createApplicationContext` boots the DI container and schedules
 * the cron jobs registered in CleanupService without binding a port.
 */
async function bootstrap() {
  const logger = new Logger('Worker');
  await NestFactory.createApplicationContext(WorkerModule);
  logger.log('ShareFlow cleanup worker started');
}

bootstrap();
