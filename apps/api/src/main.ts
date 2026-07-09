// Must be the very first import: several decorators elsewhere in this
// codebase (`@Throttle`, `@Cron`) read `process.env` directly at module
// load time, before Nest's DI-based ConfigService exists. Loading dotenv
// here guarantees env vars are populated before any other module —
// including their decorators — is evaluated.
import 'dotenv/config';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Disabled globally so the chunk-upload route can consume the raw
    // request stream; AppModule re-applies JSON parsing to every other
    // route via middleware (see AppModule#configure).
    bodyParser: false,
  });

  const configService = app.get(ConfigService);
  const { port, corsOrigins } = configService.get<AppConfig>('app')!;

  app.use(
    helmet({
      // Downloaded/previewed files are served from this API's own origin,
      // not inline HTML, so a strict default CSP is safe here.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`ShareFlow API listening on port ${port}`);
}

bootstrap();
