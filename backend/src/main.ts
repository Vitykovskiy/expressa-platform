import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { validateEnvironment } from './platform/config/environment';
import { configureHttp } from './platform/http/http-configuration';
import { configureObservability } from './platform/observability/observability-configuration';

export async function createApplication(): Promise<INestApplication> {
  validateEnvironment(process.env);

  const app = await NestFactory.create(AppModule);
  configureHttp(app, process.env.NODE_ENV);
  configureObservability(app);
  return app;
}

export async function startServer(app: INestApplication): Promise<void> {
  let isShuttingDown = false;

  app.use((_request: Request, response: Response, next: NextFunction) => {
    if (isShuttingDown) {
      response.status(503).end();
      return;
    }

    next();
  });

  process.once('SIGTERM', () => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    void app
      .close()
      .then(() => {
        process.exitCode = 0;
        process.disconnect?.();
      })
      .catch(() => {
        process.exitCode = 1;
        process.disconnect?.();
      });
  });

  await app.listen(Number(process.env.PORT));
}

export async function bootstrap(): Promise<void> {
  const app = await createApplication();
  await startServer(app);
}

if (require.main === module) {
  void bootstrap();
}
