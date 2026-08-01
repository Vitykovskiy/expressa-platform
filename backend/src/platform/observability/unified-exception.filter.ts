import {
  Catch,
  type ArgumentsHost,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { IncomingMessage } from 'node:http';
import { ObservabilityLogger } from './observability-logger.service';
import { ObservabilityMetrics } from './observability-metrics.service';
import { getRequestPath } from './request-path';

type RequestWithId = IncomingMessage & { requestId?: string };

const clientMessages: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Too many requests',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'Service unavailable',
};

function getErrorCode(statusCode: number): string {
  return HttpStatus[statusCode]?.toString() ?? 'INTERNAL_SERVER_ERROR';
}

@Catch()
export class UnifiedExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly adapterHost: HttpAdapterHost,
    private readonly logger: ObservabilityLogger,
    private readonly metrics: ObservabilityMetrics,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.adapterHost;
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithId>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const requestId = request.requestId ?? 'unknown';

    this.metrics.recordApiError();

    this.logger.log({
      event: 'http_error',
      level: statusCode >= HttpStatus.INTERNAL_SERVER_ERROR ? 'error' : 'info',
      method: request.method ?? 'UNKNOWN',
      path: getRequestPath(httpAdapter.getRequestUrl(request)),
      requestId,
      statusCode,
    });
    httpAdapter.reply(
      context.getResponse(),
      {
        code: getErrorCode(statusCode),
        message: clientMessages[statusCode] ?? 'Internal server error',
        details: null,
        requestId,
      },
      statusCode,
    );
  }
}
