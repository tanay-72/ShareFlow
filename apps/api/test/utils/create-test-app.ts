import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { MimeSniffingService } from '../../src/modules/security/mime-sniffing.service';

/**
 * `file-type` is an ESM-only package loaded via a Function-wrapped dynamic
 * `import()` (see mime-sniffing.service.ts) to survive CommonJS
 * downleveling in a normal Node process. Jest, however, runs test files
 * inside a VM sandbox that rejects dynamic `import()` without the
 * `--experimental-vm-modules` flag — a real magic-byte sniff is exercised
 * by the manual smoke test in the README instead, so tests substitute a
 * trivial stub that skips the dynamic import entirely and just trusts the
 * client-declared MIME type, keeping these tests focused on ShareFlow's
 * own business logic rather than third-party ESM/CJS interop.
 */
class StubMimeSniffingService extends MimeSniffingService {
  async detectFromFile(_filePath: string, fallbackMimeType: string): Promise<string> {
    return fallbackMimeType;
  }
}

/**
 * Boots a real Nest application (full DI graph, real Postgres, real local
 * disk under test/.e2e-storage) the same way main.ts does, minus the
 * network-facing concerns (Helmet, actual port binding) that don't matter
 * for supertest, which talks to the app in-process.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(MimeSniffingService)
    .useClass(StubMimeSniffingService)
    .compile();

  const app = moduleRef.createNestApplication({ bodyParser: false });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.init();
  return app;
}
