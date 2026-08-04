import { Controller, Get } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { AddressInfo } from 'node:net';
import { authCryptoPort } from '../../auth/application/auth-crypto.constants';
import { clockPort } from '../../auth/application/clock.constants';
import { GetCurrentUserUseCase } from '../../auth/application/get-current-user.use-case';
import { LogoutUseCase } from '../../auth/application/logout.use-case';
import { RefreshSessionUseCase } from '../../auth/application/refresh-session.use-case';
import { RequestOtpUseCase } from '../../auth/application/request-otp.use-case';
import { VerifyOtpUseCase } from '../../auth/application/verify-otp.use-case';
import { AuthController } from '../../auth/transport/auth.controller';
import { MeController } from '../../auth/transport/me.controller';
import {
  authRepositoryPort,
  originGuardConfigurationToken,
  sessionGuardConfigurationToken,
} from '../../auth/auth.constants';
import {
  apiPrefix,
  bearerSecuritySchemeName,
  refreshCookieSecuritySchemeName,
} from './http-configuration.constants';
import { configureHttp, createOpenApiDocument, isApiDocumentationEnabled } from './http-configuration';

@Controller('probe')
class ProbeController {
  @Get()
  getProbe(): { status: string } {
    return { status: 'ok' };
  }
}

@Controller('health')
class HealthProbeController {
  @Get('live')
  getLiveness(): { status: string } {
    return { status: 'ok' };
  }
}

async function createApplication(environment: string, withAuth = false) {
  const module: TestingModule = await Test.createTestingModule({
    controllers: withAuth
      ? [ProbeController, HealthProbeController, AuthController, MeController]
      : [ProbeController, HealthProbeController],
    providers: withAuth
      ? [
          { provide: RequestOtpUseCase, useValue: {} },
          { provide: VerifyOtpUseCase, useValue: {} },
          { provide: RefreshSessionUseCase, useValue: {} },
          { provide: LogoutUseCase, useValue: {} },
          { provide: GetCurrentUserUseCase, useValue: {} },
          { provide: authRepositoryPort, useValue: {} },
          { provide: authCryptoPort, useValue: {} },
          { provide: clockPort, useValue: {} },
          { provide: originGuardConfigurationToken, useValue: { allowedOrigins: [] } },
          { provide: sessionGuardConfigurationToken, useValue: {} },
        ]
      : [],
  }).compile();
  const app = module.createNestApplication();

  configureHttp(app, environment);
  await app.listen(0, '127.0.0.1');

  const address = app.getHttpServer().address() as AddressInfo;

  return {
    app,
    url: `http://127.0.0.1:${address.port}`,
  };
}

describe('HTTP configuration', () => {
  const originalCorsOrigins = process.env.CORS_ORIGINS;

  beforeEach(() => {
    process.env.CORS_ORIGINS = 'http://customer.expressa.test,https://backoffice.expressa.test';
  });

  afterAll(() => {
    if (originalCorsOrigins === undefined) {
      delete process.env.CORS_ORIGINS;
      return;
    }

    process.env.CORS_ORIGINS = originalCorsOrigins;
  });

  it.each(['local', 'development'])(
    'публикует Swagger и OpenAPI в %s',
    async (environment) => {
      const { app, url } = await createApplication(environment);

      try {
        const [documentation, openApi, probe] = await Promise.all([
          fetch(`${url}/docs`),
          fetch(`${url}/docs/openapi.json`),
          fetch(`${url}/${apiPrefix}/probe`),
        ]);

        expect(documentation.status).toBe(200);
        expect(openApi.status).toBe(200);
        expect(probe.status).toBe(200);
        await expect(openApi.json()).resolves.toMatchObject({
          paths: { '/api/v1/probe': expect.any(Object) },
        });
      } finally {
        await app.close();
      }
    },
  );

  it.each(['staging', 'production'])(
    'не публикует Swagger и OpenAPI в %s',
    async (environment) => {
      const { app, url } = await createApplication(environment);

      try {
        const [documentation, openApi] = await Promise.all([
          fetch(`${url}/docs`),
          fetch(`${url}/docs/openapi.json`),
        ]);

        expect(documentation.status).toBe(404);
        expect(openApi.status).toBe(404);
      } finally {
        await app.close();
      }
    },
  );

  it('включает документацию только в local и development', () => {
    expect(isApiDocumentationEnabled('local')).toBe(true);
    expect(isApiDocumentationEnabled('development')).toBe(true);
    expect(isApiDocumentationEnabled('staging')).toBe(false);
    expect(isApiDocumentationEnabled('production')).toBe(false);
  });

  it('оставляет health вне префикса API', async () => {
    const { app, url } = await createApplication('production');

    try {
      const [health, prefixedHealth, probe] = await Promise.all([
        fetch(`${url}/health/live`),
        fetch(`${url}/${apiPrefix}/health/live`),
        fetch(`${url}/${apiPrefix}/probe`),
      ]);

      expect(health.status).toBe(200);
      expect(prefixedHealth.status).toBe(404);
      expect(probe.status).toBe(200);
    } finally {
      await app.close();
    }
  });

  it('разрешает credentials только exact CORS allowlist', async () => {
    const { app, url } = await createApplication('production');

    try {
      const [allowed, denied] = await Promise.all([
        fetch(`${url}/${apiPrefix}/probe`, { headers: { origin: 'http://customer.expressa.test' } }),
        fetch(`${url}/${apiPrefix}/probe`, { headers: { origin: 'https://evil.example' } }),
      ]);

      expect(allowed.headers.get('access-control-allow-origin')).toBe('http://customer.expressa.test');
      expect(allowed.headers.get('access-control-allow-credentials')).toBe('true');
      expect(denied.headers.get('access-control-allow-origin')).toBeNull();
    } finally {
      await app.close();
    }
  });

  it('описывает Bearer и refresh cookie security schemes на auth routes', async () => {
    const { app } = await createApplication('local', true);

    try {
      const document = createOpenApiDocument(app);

      expect(document.components?.securitySchemes).toMatchObject({
        [bearerSecuritySchemeName]: { bearerFormat: 'JWT', scheme: 'bearer', type: 'http' },
        [refreshCookieSecuritySchemeName]: { in: 'cookie', name: 'expressa_refresh', type: 'apiKey' },
      });
      expect(document.paths['/api/v1/auth/refresh']?.post?.security).toEqual([
        { expressa_refresh: [] },
      ]);
      expect(document.paths['/api/v1/auth/logout']?.post?.security).toEqual([
        { expressa_refresh: [] },
      ]);
      expect(document.paths['/api/v1/me']?.get?.security).toEqual([{ bearer: [] }]);
      expect(document.paths['/api/v1/auth/me']).toBeUndefined();
    } finally {
      await app.close();
    }
  });
});
