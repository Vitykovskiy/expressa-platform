import {
  Catch,
  type ArgumentsHost,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ObservabilityLogger } from './observability-logger.service';
import { ObservabilityMetrics } from './observability-metrics.service';
import { getRequestPath } from './request-path';
import { clientMessages } from './unified-exception.filter.constants';
import type {
  RequestWithId,
  StructuredErrorResponse,
} from './unified-exception.filter.types';

function getErrorCode(statusCode: number): string {
  return HttpStatus[statusCode]?.toString() ?? 'INTERNAL_SERVER_ERROR';
}

function isStructuredErrorResponse(
  response: unknown,
): response is StructuredErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'code' in response &&
    typeof response.code === 'string' &&
    'message' in response &&
    typeof response.message === 'string' &&
    "details" in response
  );
}

function isOtpFailurePath(path: string): boolean {
  return (
    path === '/api/v2/auth/otp/request' ||
    path === '/api/v2/auth/otp/verify'
  );
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
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;
    const isServerError = statusCode >= HttpStatus.INTERNAL_SERVER_ERROR;
    const errorResponse = isStructuredErrorResponse(exceptionResponse)
      ? isServerError
        ? {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
            details: null,
          }
        : exceptionResponse
      : {
          code: getErrorCode(statusCode),
          message: clientMessages[statusCode] ?? 'Internal server error',
          details: null,
        };
    const requestId = request.requestId ?? 'unknown';
    const requestPath = getRequestPath(httpAdapter.getRequestUrl(request));

    this.metrics.recordApiError();
    if (isOtpFailurePath(requestPath)) {
      this.metrics.recordOtpFailure();
    }

    this.logger.log({
      event: 'http_error',
      level: statusCode >= HttpStatus.INTERNAL_SERVER_ERROR ? 'error' : 'info',
      method: request.method ?? 'UNKNOWN',
      path: requestPath,
      requestId,
      statusCode,
    });
    httpAdapter.reply(
      context.getResponse(),
      {
        ...errorResponse,
        requestId,
      },
      statusCode,
    );
  }
}
