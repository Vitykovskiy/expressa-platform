import { Controller, Get } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { AddressInfo } from 'node:net';
import {
  apiPrefix,
  configureHttp,
  isApiDocumentationEnabled,
} from './http-configuration';

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

async function createApplication(environment: string) {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [ProbeController, HealthProbeController],
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
});
