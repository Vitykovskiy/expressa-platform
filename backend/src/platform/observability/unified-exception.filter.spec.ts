import {
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from "@nestjs/common";
import { UnifiedExceptionFilter } from "./unified-exception.filter";

describe("UnifiedExceptionFilter", () => {
  it("сохраняет безопасный структурированный auth-ответ", () => {
    const reply = jest.fn();
    const recordApiError = jest.fn();
    const recordOtpFailure = jest.fn();
    const filter = new UnifiedExceptionFilter(
      {
        httpAdapter: {
          getRequestUrl: () => "/api/v2/auth/otp/verify",
          reply,
        },
      } as never,
      { log: jest.fn() } as never,
      { recordApiError, recordOtpFailure } as never,
    );

    filter.catch(
      new HttpException(
        {
          code: "AUTH_CODE_INVALID",
          message: "Invalid verification code",
          details: null,
        },
        HttpStatus.UNAUTHORIZED,
      ),
      {
        switchToHttp: () => ({
          getRequest: () => ({ requestId: "auth-request-id" }),
          getResponse: () => ({}),
        }),
      } as never,
    );

    expect(reply).toHaveBeenCalledWith(
      {},
      {
        code: "AUTH_CODE_INVALID",
        message: "Invalid verification code",
        details: null,
        requestId: "auth-request-id",
      },
      HttpStatus.UNAUTHORIZED,
    );
    expect(recordApiError).toHaveBeenCalledTimes(1);
    expect(recordOtpFailure).toHaveBeenCalledTimes(1);
  });

  it("не считает OTP failure для ошибок других маршрутов", () => {
    const recordOtpFailure = jest.fn();
    const filter = new UnifiedExceptionFilter(
      {
        httpAdapter: {
          getRequestUrl: () => "/api/v2/auth/refresh",
          reply: jest.fn(),
        },
      } as never,
      { log: jest.fn() } as never,
      { recordApiError: jest.fn(), recordOtpFailure } as never,
    );

    filter.catch(new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED), {
      switchToHttp: () => ({
        getRequest: () => ({ requestId: "refresh-request-id" }),
        getResponse: () => ({}),
      }),
    } as never);

    expect(recordOtpFailure).not.toHaveBeenCalled();
  });

  it("не раскрывает structured данные server error", () => {
    const reply = jest.fn();
    const filter = new UnifiedExceptionFilter(
      {
        httpAdapter: {
          getRequestUrl: () => "/api/v2/auth/otp/verify",
          reply,
        },
      } as never,
      { log: jest.fn() } as never,
      { recordApiError: jest.fn(), recordOtpFailure: jest.fn() } as never,
    );

    filter.catch(
      new HttpException(
        {
          code: "SMS_PROVIDER_ERROR",
          message: "provider failed for +79990000000 with token secret-token",
          details: {
            phone: "+79990000000",
            providerResponse: "provider response",
            token: "secret-token",
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      ),
      {
        switchToHttp: () => ({
          getRequest: () => ({ requestId: "unknown-request-id" }),
          getResponse: () => ({}),
        }),
      } as never,
    );

    expect(reply).toHaveBeenCalledWith(
      {},
      {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
        details: null,
        requestId: "unknown-request-id",
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(JSON.stringify(reply.mock.calls[0][1])).not.toContain(
      "secret-token",
    );
    expect(JSON.stringify(reply.mock.calls[0][1])).not.toContain(
      "+79990000000",
    );
    expect(JSON.stringify(reply.mock.calls[0][1])).not.toContain(
      "provider response",
    );
  });

  it("пишет readiness failure как структурированный error без query string", () => {
    const reply = jest.fn();
    const log = jest.fn();
    const recordApiError = jest.fn();
    const filter = new UnifiedExceptionFilter(
      {
        httpAdapter: {
          getRequestUrl: () => "/health/ready?password=secret",
          reply,
        },
      } as never,
      { log } as never,
      { recordApiError, recordOtpFailure: jest.fn() } as never,
    );

    filter.catch(new ServiceUnavailableException(), {
      switchToHttp: () => ({
        getRequest: () => ({
          method: "GET",
          requestId: "readiness-request-id",
        }),
        getResponse: () => ({}),
      }),
    } as never);

    expect(recordApiError).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith({
      event: "http_error",
      level: "error",
      method: "GET",
      path: "/health/ready",
      requestId: "readiness-request-id",
      statusCode: 503,
    });
    expect(reply).toHaveBeenCalledWith(
      {},
      {
        code: "SERVICE_UNAVAILABLE",
        message: "Service unavailable",
        details: null,
        requestId: "readiness-request-id",
      },
      503,
    );
  });
});
