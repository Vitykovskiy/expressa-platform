import {
  Body,
  BadRequestException,
  Controller,
  Inject,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { clockPort } from "../application/clock.constants";
import type { Clock } from "../application/clock.types";
import { LogoutUseCase } from "../application/logout.use-case";
import { RefreshSessionUseCase } from "../application/refresh-session.use-case";
import {
  OtpDeliveryUnavailableError,
  RequestOtpUseCase,
} from "../application/request-otp.use-case";
import {
  SessionCreationUnavailableError,
  VerifyOtpUseCase,
} from "../application/verify-otp.use-case";
import { accessTokenLifetimeMs } from "../application/verify-otp.use-case.constants";
import {
  AccessDeniedError,
  ExpiredOtpCodeError,
  InvalidOtpCodeError,
  InvalidPhoneError,
  OtpRateLimitedError,
} from "../domain/auth.errors";
import { OriginGuard } from "./origin.guard";
import {
  clearRefreshCookie,
  readRefreshCookie,
  writeRefreshCookie,
} from "./auth-cookie";
import {
  authErrorResponses,
  otpRetryAfterSeconds,
} from "./auth.controller.constants";
import {
  AccessTokenDto,
  RequestOtpDto,
  RequestOtpResponseDto,
  VerifyOtpDto,
} from "./auth.dto";
import type {
  AccessTokenResponse,
  AuthCookieResponse,
  AuthHeaderResponse,
} from "./auth.controller.types";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly requestOtp: RequestOtpUseCase,
    private readonly verifyOtp: VerifyOtpUseCase,
    private readonly refreshSession: RefreshSessionUseCase,
    private readonly logout: LogoutUseCase,
    @Inject(clockPort) private readonly clock: Clock,
  ) {}

  @Post("otp/request")
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: "Запросить одноразовый код" })
  @ApiResponse({ status: HttpStatus.ACCEPTED, type: RequestOtpResponseDto })
  async requestCode(
    @Body() body: RequestOtpDto,
    @Res({ passthrough: true }) response: AuthHeaderResponse,
  ): Promise<RequestOtpResponseDto> {
    assertRequestOtpBody(body);

    try {
      return await this.requestOtp.execute(body.phone);
    } catch (error) {
      if (error instanceof OtpRateLimitedError) {
        response.header("Retry-After", otpRetryAfterSeconds);
      }

      throwSafeAuthError(error);
    }
  }

  @Post("otp/verify")
  @HttpCode(200)
  @ApiOperation({ summary: "Подтвердить одноразовый код" })
  @ApiResponse({ status: 200, type: AccessTokenDto })
  async verifyCode(
    @Body() body: VerifyOtpDto,
    @Res({ passthrough: true }) response: AuthCookieResponse,
  ): Promise<AccessTokenResponse> {
    assertVerifyOtpBody(body);
    let result;
    try {
      result = await this.verifyOtp.execute(body.phone, body.code);
    } catch (error) {
      throwSafeAuthError(error);
    }
    writeRefreshCookie(
      response,
      result.refreshToken,
      this.getCookieMaxAge(result.sessionExpiresAt),
    );

    return createAccessTokenResponse(result.accessToken);
  }

  @Post("refresh")
  @HttpCode(200)
  @UseGuards(OriginGuard)
  @ApiCookieAuth("expressa_refresh")
  @ApiOperation({ summary: "Обновить access token" })
  @ApiResponse({ status: 200, type: AccessTokenDto })
  async refresh(
    @Headers("cookie") cookie: string | undefined,
    @Res({ passthrough: true }) response: AuthCookieResponse,
  ): Promise<AccessTokenResponse> {
    const refreshToken = readRefreshCookie(cookie);
    if (refreshToken === null) {
      throw new UnauthorizedException();
    }

    try {
      const result = await this.refreshSession.execute(refreshToken);
      writeRefreshCookie(
        response,
        result.refreshToken,
        this.getCookieMaxAge(result.sessionExpiresAt),
      );
      return createAccessTokenResponse(result.accessToken);
    } catch (error) {
      if (error instanceof AccessDeniedError) {
        throw new UnauthorizedException();
      }

      throw error;
    }
  }

  @Post("logout")
  @HttpCode(204)
  @UseGuards(OriginGuard)
  @ApiCookieAuth("expressa_refresh")
  @ApiOperation({ summary: "Завершить сессию" })
  @ApiResponse({ status: 204 })
  async logoutSession(
    @Headers("cookie") cookie: string | undefined,
    @Res({ passthrough: true }) response: AuthCookieResponse,
  ): Promise<void> {
    const refreshToken = readRefreshCookie(cookie);

    if (refreshToken !== null) {
      try {
        await this.logout.execute(refreshToken);
      } catch (error) {
        if (!(error instanceof AccessDeniedError)) {
          throw error;
        }
      }
    }

    clearRefreshCookie(response);
  }

  private getCookieMaxAge(expiresAt: Date): number {
    return Math.max(0, expiresAt.getTime() - this.clock.now().getTime());
  }
}

function assertRequestOtpBody(body: RequestOtpDto): void {
  if (typeof body?.phone !== "string") {
    throw new BadRequestException(authErrorResponses.validation);
  }
}

function assertVerifyOtpBody(body: VerifyOtpDto): void {
  if (typeof body?.phone !== "string" || typeof body?.code !== "string") {
    throw new BadRequestException(authErrorResponses.validation);
  }
}

function throwSafeAuthError(error: unknown): never {
  if (error instanceof InvalidPhoneError) {
    throw new HttpException(
      authErrorResponses.validation,
      HttpStatus.BAD_REQUEST,
    );
  }

  if (error instanceof InvalidOtpCodeError) {
    throw new HttpException(
      authErrorResponses.invalidOtp,
      HttpStatus.UNAUTHORIZED,
    );
  }

  if (error instanceof ExpiredOtpCodeError) {
    throw new HttpException(
      authErrorResponses.expiredOtp,
      HttpStatus.UNAUTHORIZED,
    );
  }

  if (error instanceof OtpRateLimitedError) {
    throw new HttpException(
      authErrorResponses.rateLimited,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  if (
    error instanceof OtpDeliveryUnavailableError ||
    error instanceof SessionCreationUnavailableError
  ) {
    throw new HttpException(
      authErrorResponses.serviceUnavailable,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  throw error;
}

function createAccessTokenResponse(accessToken: string): AccessTokenResponse {
  return {
    accessToken,
    expiresInSeconds: accessTokenLifetimeMs / 1_000,
    tokenType: "Bearer",
  };
}
