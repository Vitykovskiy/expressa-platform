import { ServiceUnavailableException } from '@nestjs/common';
import { UnifiedExceptionFilter } from './unified-exception.filter';

describe('UnifiedExceptionFilter', () => {
  it('пишет readiness failure как структурированный error без query string', () => {
    const reply = jest.fn();
    const log = jest.fn();
    const recordApiError = jest.fn();
    const filter = new UnifiedExceptionFilter(
      {
        httpAdapter: {
          getRequestUrl: () => '/health/ready?password=secret',
          reply,
        },
      } as never,
      { log } as never,
      { recordApiError } as never,
    );

    filter.catch(
      new ServiceUnavailableException(),
      {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'GET',
            requestId: 'readiness-request-id',
          }),
          getResponse: () => ({}),
        }),
      } as never,
    );

    expect(recordApiError).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith({
      event: 'http_error',
      level: 'error',
      method: 'GET',
      path: '/health/ready',
      requestId: 'readiness-request-id',
      statusCode: 503,
    });
    expect(reply).toHaveBeenCalledWith(
      {},
      {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service unavailable',
        details: null,
        requestId: 'readiness-request-id',
      },
      503,
    );
  });
});
