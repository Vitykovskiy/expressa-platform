import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { getCorsOrigins } from '../config/environment';
import {
  apiPrefix,
  apiPrefixExclusions,
  bearerSecuritySchemeName,
  refreshCookieSecuritySchemeName,
} from './http-configuration.constants';

export function isApiDocumentationEnabled(environment: string | undefined): boolean {
  return environment === 'local' || environment === 'development';
}

export function createOpenApiDocument(app: INestApplication) {
  const configuration = new DocumentBuilder()
    .setTitle('Expressa API')
    .setVersion('1.0.0')
    .addBearerAuth(undefined, bearerSecuritySchemeName)
    .addCookieAuth(refreshCookieSecuritySchemeName, undefined, refreshCookieSecuritySchemeName)
    .build();

  return SwaggerModule.createDocument(app, configuration);
}

export function configureHttp(
  app: INestApplication,
  environment: string | undefined,
): void {
  app.enableCors({
    credentials: true,
    origin: getCorsOrigins(process.env),
  });
  app.setGlobalPrefix(apiPrefix, {
    exclude: apiPrefixExclusions,
  });

  if (!isApiDocumentationEnabled(environment)) {
    return;
  }

  SwaggerModule.setup('docs', app, createOpenApiDocument(app), {
    jsonDocumentUrl: 'docs/openapi.json',
    raw: ['json'],
  });
}
