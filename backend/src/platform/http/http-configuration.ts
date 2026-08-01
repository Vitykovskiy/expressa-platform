import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const apiPrefix = 'api/v1';

export function isApiDocumentationEnabled(environment: string | undefined): boolean {
  return environment === 'local' || environment === 'development';
}

export function createOpenApiDocument(app: INestApplication) {
  const configuration = new DocumentBuilder()
    .setTitle('Expressa API')
    .setVersion('1.0.0')
    .build();

  return SwaggerModule.createDocument(app, configuration);
}

export function configureHttp(
  app: INestApplication,
  environment: string | undefined,
): void {
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['health/live', 'health/ready'],
  });

  if (!isApiDocumentationEnabled(environment)) {
    return;
  }

  SwaggerModule.setup('docs', app, createOpenApiDocument(app), {
    jsonDocumentUrl: 'docs/openapi.json',
    raw: ['json'],
  });
}
