import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validateEnvironment } from './platform/config/environment';
import { configureHttp } from './platform/http/http-configuration';
import { configureObservability } from './platform/observability/observability-configuration';

async function bootstrap(): Promise<void> {
  validateEnvironment(process.env);

  const app = await NestFactory.create(AppModule);
  configureHttp(app, process.env.NODE_ENV);
  configureObservability(app);
  app.enableShutdownHooks(['SIGTERM']);
  await app.listen(Number(process.env.PORT));
}

void bootstrap();
