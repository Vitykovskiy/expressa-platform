import { Injectable, type NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { ObservabilityLogger } from './observability-logger.service';
import { ObservabilityMetrics } from './observability-metrics.service';
import { getRequestPath } from './request-path';

type RequestWithId = IncomingMessage & { requestId?: string };

function isValidRequestId(value: string | undefined): value is string {
  return value !== undefined && /^[A-Za-z0-9._-]{1,128}$/.test(value);
}

@Injectable()
export class RequestObservabilityMiddleware implements NestMiddleware {
  constructor(
    private readonly logger: ObservabilityLogger,
    private readonly metrics: ObservabilityMetrics,
  ) {}

  use(request: RequestWithId, response: ServerResponse, next: () => void): void {
    const requestIdHeader = request.headers['x-request-id'];
    const receivedRequestId =
      typeof requestIdHeader === 'string' ? requestIdHeader : undefined;
    const requestId = isValidRequestId(receivedRequestId)
      ? receivedRequestId
      : randomUUID();
    const startedAt = performance.now();

    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);
    response.on('finish', () => {
      this.logger.log({
        event: 'http_request',
        level: 'info',
        method: request.method ?? 'UNKNOWN',
        path: getRequestPath(request.url),
        requestId,
        statusCode: response.statusCode,
        durationMs: Math.round(performance.now() - startedAt),
      });
      this.metrics.recordHttpResponse(response.statusCode);
    });

    next();
  }
}
