import { toCurrentUserDto } from "./current-user.projection";
import {
  Controller,
  Get,
  Body,
  Post,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  HttpException,
  Req,
  Res,
  Headers,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CompleteCustomerRegistrationUseCase } from "../application/complete-customer-registration.use-case";
import { AccessDeniedError } from "../domain/auth.errors";
import {
  CustomerRegistrationForbiddenError,
  CustomerRegistrationNameConflictError,
  CustomerRegistrationUnavailableError,
} from "../domain/customer-registration.errors";
import { CompleteCustomerRegistrationDto } from "./customer-registration.dto";
import { parseRegistrationName } from "./customer-registration.validation";
import { Roles } from "./roles.decorator";
import { RolesGuard } from "./roles.guard";
import { ApiHttpErrorDto } from "../../platform/observability/http-error.dto";
import { authErrorResponses } from "./auth.controller.constants";
import type { AuthErrorResponse, AuthRequest } from "./auth.controller.types";
import type { Response } from "express";
import { CurrentAuth } from "./current-auth.decorator";
import type { CurrentAuth as CurrentAuthData } from "./current-auth.decorator.types";
import { CurrentUserDto } from "./auth.dto";
import { SessionGuard } from "./session.guard";

@ApiTags("auth")
@Controller("me")
export class MeController {
  constructor(
    private readonly registration: CompleteCustomerRegistrationUseCase,
  ) {}

  @Get()
  @UseGuards(SessionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Получить текущего пользователя" })
  @ApiResponse({ status: 200, type: CurrentUserDto })
  async currentUser(
    @Headers("authorization") authorization: string | undefined,
    @CurrentAuth() auth: CurrentAuthData,
  ): Promise<CurrentUserDto> {
    const accessToken = readBearerToken(authorization);
    if (accessToken === null) {
      throw new UnauthorizedException();
    }

    try {
      return toCurrentUserDto(
        await this.registration.currentUser(accessToken, auth.sessionId),
      );
    } catch (error) {
      if (error instanceof AccessDeniedError) {
        throw new UnauthorizedException();
      }
      throw error;
    }
  }

  @Post("registration")
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard, RolesGuard)
  @Roles("CustomerContext")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Завершить первую регистрацию клиента",
    description:
      "Customer context only; no prior customer membership required. First enrollment preserves a canonical staff name or returns USER_NAME_CONFLICT. Completed repeats return the stored profile without overwriting name; no cookie replacement or staff privilege change.",
  })
  @ApiBody({
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["name"],
      properties: { name: { type: "string", minLength: 1 } },
    },
  })
  @ApiResponse({ status: 200, type: CurrentUserDto })
  @ApiResponse({ status: 400, type: ApiHttpErrorDto })
  @ApiResponse({ status: 401, type: ApiHttpErrorDto })
  @ApiResponse({ status: 403, type: ApiHttpErrorDto })
  @ApiResponse({
    status: 409,
    type: ApiHttpErrorDto,
    description: "USER_NAME_CONFLICT",
  })
  @ApiResponse({ status: 503, type: ApiHttpErrorDto })
  async completeRegistration(
    @Body() body: CompleteCustomerRegistrationDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Res({ passthrough: true }) response: Response,
    @Req() request: AuthRequest,
  ): Promise<CurrentUserDto | AuthErrorResponse> {
    const name = parseRegistrationName(body);
    try {
      return toCurrentUserDto(
        await this.registration.complete({
          userId: auth.userId,
          sessionId: auth.sessionId,
          name,
        }),
      );
    } catch (error) {
      if (error instanceof AccessDeniedError) {
        throw new UnauthorizedException();
      }
      if (error instanceof CustomerRegistrationForbiddenError) {
        throw new ForbiddenException();
      }
      if (error instanceof CustomerRegistrationNameConflictError) {
        throw new HttpException(
          {
            code: "USER_NAME_CONFLICT",
            message: "Account name differs from the submitted name.",
            details: null,
          },
          HttpStatus.CONFLICT,
        );
      }
      if (error instanceof CustomerRegistrationUnavailableError) {
        response.status(HttpStatus.SERVICE_UNAVAILABLE);
        return {
          ...authErrorResponses.serviceUnavailable,
          requestId: request.requestId ?? "unknown",
        };
      }
      throw error;
    }
  }
}

function readBearerToken(value: string | undefined): string | null {
  return value !== undefined && /^Bearer [^\s]+$/.test(value)
    ? value.slice("Bearer ".length)
    : null;
}
