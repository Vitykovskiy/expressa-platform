import { HttpStatus, UnauthorizedException } from '@nestjs/common';
import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { AddressInfo } from 'node:net';
import { clockPort } from '../application/clock.constants';
import type { Clock } from '../application/clock.types';
import { LogoutUseCase } from '../application/logout.use-case';
import { RefreshSessionUseCase } from '../application/refresh-session.use-case';
import { RequestOtpUseCase } from '../application/request-otp.use-case';
import { VerifyOtpUseCase } from '../application/verify-otp.use-case';
import { originGuardConfigurationToken } from '../auth.constants';
import {
  AccessDeniedError,
  ExpiredOtpCodeError,
  InvalidOtpCodeError,
  OtpRateLimitedError,
} from '../domain/auth.errors';
import { otpRetryAfterSeconds, refreshCookieName } from './auth.controller.constants';
import { AuthController } from './auth.controller';
import { OriginGuard } from './origin.guard';

const now = new Date('2026-08-04T10:00:00.000Z');
const sessionExpiresAt = new Date('2026-08-04T10:01:59.999Z');
const refreshToken = `d2719b1e-6b2c-4c4e-8e61-5c5cc62e1952.${Buffer.alloc(32, 1).toString('base64url')}`;
const apiResponseMetadataKey = 'swagger/apiResponse';

function createController() {
  const requestOtp = { execute: jest.fn().mockResolvedValue({ expiresInSeconds: 300, retryAfterSeconds: 60 }) };
  const verifyOtp = { execute: jest.fn().mockResolvedValue({ accessToken: 'access', refreshToken, sessionExpiresAt }) };
  const refreshSession = { execute: jest.fn().mockResolvedValue({ accessToken: 'fresh-access', refreshToken, sessionExpiresAt }) };
  const logout = { execute: jest.fn().mockResolvedValue(undefined) };
  const clock = { now: jest.fn().mockReturnValue(now) } as jest.Mocked<Clock>;

  return {
    clock,
    controller: new AuthController(requestOtp as never, verifyOtp as never, refreshSession as never, logout as never, clock),
    logout,
    refreshSession,
    requestOtp,
    verifyOtp,
  };
}

describe('AuthController', () => {
  it('передаёт OTP request и не меняет response transport', async () => {
    const { controller, requestOtp } = createController();

    await expect(controller.requestCode({ phone: '+79123456789' }, { cookie: jest.fn(), header: jest.fn() })).resolves.toEqual({ expiresInSeconds: 300, retryAfterSeconds: 60 });
    expect(requestOtp.execute).toHaveBeenCalledWith('+79123456789');
  });

  it('публикует OTP request с HTTP 202', async () => {
    const requestOtp = { execute: jest.fn().mockResolvedValue({ expiresInSeconds: 300, retryAfterSeconds: 60 }) };
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: RequestOtpUseCase, useValue: requestOtp },
        { provide: VerifyOtpUseCase, useValue: {} },
        { provide: RefreshSessionUseCase, useValue: {} },
        { provide: LogoutUseCase, useValue: {} },
        { provide: clockPort, useValue: { now: () => now } },
        { provide: originGuardConfigurationToken, useValue: { allowedOrigins: [] } },
      ],
    }).compile();
    const app = module.createNestApplication();

    await app.listen(0, '127.0.0.1');
    const address = app.getHttpServer().address() as AddressInfo;

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/auth/otp/request`, {
        body: JSON.stringify({ phone: '+79123456789' }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      });

      expect(response.status).toBe(HttpStatus.ACCEPTED);
      await expect(response.json()).resolves.toEqual({ expiresInSeconds: 300, retryAfterSeconds: 60 });
      expect(Reflect.getMetadata(apiResponseMetadataKey, AuthController.prototype.requestCode)).toHaveProperty('202');
      const document = SwaggerModule.createDocument(app, new DocumentBuilder().build());
      expect(document.components?.schemas?.VerifyOtpDto).toMatchObject({
        properties: { code: { pattern: '^\\d{6}$' } },
      });
      expect(document.components?.schemas?.VerifyOtpDto).not.toMatchObject({
        properties: { code: { example: expect.anything() } },
      });
      expect(document.components?.schemas?.AccessTokenDto).toMatchObject({
        properties: {
          expiresInSeconds: { example: 900 },
          tokenType: { enum: ['Bearer'] },
        },
      });
    } finally {
      await app.close();
    }
  });

  it('verify и refresh возвращают только access token и ставят strict cookie с floor maxAge', async () => {
    const originalNodeEnvironment = process.env.NODE_ENV;
    process.env.NODE_ENV = 'local';

    try {
      const verify = createController();
      const verifyResponse = { cookie: jest.fn() };

      await expect(verify.controller.verifyCode({ phone: '+79123456789', code: '123456' }, verifyResponse)).resolves.toEqual({ accessToken: 'access', expiresInSeconds: 900, tokenType: 'Bearer' });
      expect(verify.verifyOtp.execute).toHaveBeenCalledWith('+79123456789', '123456');
      expect(verifyResponse.cookie).toHaveBeenCalledWith(refreshCookieName, refreshToken, expect.objectContaining({ maxAge: 119999, httpOnly: true, path: '/api/v1/auth', sameSite: 'strict', secure: false }));

      const refresh = createController();
      const refreshResponse = { cookie: jest.fn() };
      await expect(refresh.controller.refresh(`${refreshCookieName}=${refreshToken}`, refreshResponse)).resolves.toEqual({ accessToken: 'fresh-access', expiresInSeconds: 900, tokenType: 'Bearer' });
      expect(refreshResponse.cookie).toHaveBeenCalledWith(refreshCookieName, refreshToken, expect.objectContaining({ maxAge: 119999 }));
    } finally {
      if (originalNodeEnvironment === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = originalNodeEnvironment;
      }
    }
  });

  it('refresh превращает absent, malformed и denied cookie в canonical unauthorized', async () => {
    const absent = createController();
    await expect(absent.controller.refresh(undefined, { cookie: jest.fn() })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(absent.refreshSession.execute).not.toHaveBeenCalled();

    const denied = createController();
    denied.refreshSession.execute.mockRejectedValue(new AccessDeniedError());
    await expect(denied.controller.refresh(`${refreshCookieName}=${refreshToken}`, { cookie: jest.fn() })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('отклоняет raw invalid OTP bodies до use case безопасной validation error', async () => {
    const request = createController();
    const response = { cookie: jest.fn(), header: jest.fn() };

    await expect(request.controller.requestCode({ phone: 1 } as never, response)).rejects.toMatchObject({
      response: authErrorResponse('VALIDATION_ERROR', 'Bad request'),
      status: HttpStatus.BAD_REQUEST,
    });
    expect(request.requestOtp.execute).not.toHaveBeenCalled();

    const verify = createController();
    await expect(verify.controller.verifyCode({ phone: '+79123456789' } as never, response)).rejects.toMatchObject({
      response: authErrorResponse('VALIDATION_ERROR', 'Bad request'),
      status: HttpStatus.BAD_REQUEST,
    });
    expect(verify.verifyOtp.execute).not.toHaveBeenCalled();
  });

  it('мапит known OTP errors в safe HTTP contract и ставит Retry-After', async () => {
    const rateLimited = createController();
    rateLimited.requestOtp.execute.mockRejectedValue(new OtpRateLimitedError());
    const response = { cookie: jest.fn(), header: jest.fn() };

    await expect(rateLimited.controller.requestCode({ phone: '+79123456789' }, response)).rejects.toMatchObject({
      response: authErrorResponse('AUTH_RATE_LIMITED', 'Too many requests'),
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
    expect(response.header).toHaveBeenCalledWith('Retry-After', otpRetryAfterSeconds);

    const invalidCode = createController();
    invalidCode.verifyOtp.execute.mockRejectedValue(new InvalidOtpCodeError());
    await expect(invalidCode.controller.verifyCode({ phone: '+79123456789', code: '123456' }, response)).rejects.toMatchObject({
      response: authErrorResponse('AUTH_CODE_INVALID', 'Invalid verification code'),
      status: HttpStatus.UNAUTHORIZED,
    });

    const expiredCode = createController();
    expiredCode.verifyOtp.execute.mockRejectedValue(new ExpiredOtpCodeError());
    await expect(expiredCode.controller.verifyCode({ phone: '+79123456789', code: '123456' }, response)).rejects.toMatchObject({
      response: authErrorResponse('AUTH_CODE_EXPIRED', 'Verification code expired'),
      status: HttpStatus.UNAUTHORIZED,
    });
  });

  it('logout invalid idempotent: не вызывает usecase и всегда очищает cookie', async () => {
    const { controller, logout } = createController();
    const response = { cookie: jest.fn() };

    await expect(controller.logoutSession(undefined, response)).resolves.toBeUndefined();
    expect(logout.execute).not.toHaveBeenCalled();
    expect(response.cookie).toHaveBeenCalledWith(refreshCookieName, '', expect.objectContaining({ maxAge: 0 }));
  });

  it('logout подавляет denied', async () => {
    const logoutCase = createController();
    logoutCase.logout.execute.mockRejectedValue(new AccessDeniedError());
    await expect(logoutCase.controller.logoutSession(`${refreshCookieName}=${refreshToken}`, { cookie: jest.fn() })).resolves.toBeUndefined();

  });

  it('регистрирует paths и нужные guards на endpoint methods', () => {
    const prototype = AuthController.prototype;

    expect(Reflect.getMetadata(PATH_METADATA, prototype.refresh)).toBe('refresh');
    expect(Reflect.getMetadata(GUARDS_METADATA, prototype.refresh)).toContain(OriginGuard);
    expect(Reflect.getMetadata(GUARDS_METADATA, prototype.logoutSession)).toContain(OriginGuard);
    expect(prototype).not.toHaveProperty('currentUser');
  });
});

function authErrorResponse(code: string, message: string): Record<string, unknown> {
  return { code, details: null, message };
}
