import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentAuth } from "../../auth/transport/current-auth.decorator";
import type { CurrentAuth as CurrentAuthData } from "../../auth/transport/current-auth.decorator.types";
import { RolesGuard } from "../../auth/transport/roles.guard";
import { Roles } from "../../auth/transport/roles.decorator";
import { SessionGuard } from "../../auth/transport/session.guard";
import { ApiHttpErrorDto } from "../../platform/observability/http-error.dto";
import { ManagePushSubscriptionUseCase } from "../application/manage-push-subscription.use-case";
import { PushAssociationConflictError } from "../application/manage-push-subscription.use-case";
import {
  PushPublicKeyDto,
  PushAssociationRequestDto,
  PushAssociationDeleteRequestDto,
  PushAssociationResponseDto,
  PushSubscriptionInspectionDto,
  PushSubscriptionDto,
} from "./push-subscriptions.dto";
import type {
  PushPublicKeyDto as PushPublicKeyResponse,
  PushAssociationRequestDto as PushAssociationRequest,
  PushAssociationDeleteRequestDto as PushAssociationDeleteRequest,
  PushAssociationResponseDto as PushAssociationResponse,
  PushSubscriptionInspectionDto as PushSubscriptionInspection,
  PushSubscriptionDto as PushSubscriptionRequest,
} from "./push-subscriptions.dto.types";

@ApiTags("Push")
@Controller("push")
@UseGuards(SessionGuard, RolesGuard)
@ApiBearerAuth()
@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ApiHttpErrorDto })
@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ApiHttpErrorDto })
export class PushSubscriptionsController {
  constructor(
    private readonly subscriptions: ManagePushSubscriptionUseCase,
    @Inject(ConfigService) private readonly configuration: ConfigService,
  ) {}

  @Get("public-key")
  @ApiOperation({ summary: "Получить публичный VAPID ключ" })
  @ApiResponse({ status: HttpStatus.OK, type: PushPublicKeyDto })
  publicKey(): PushPublicKeyResponse {
    return {
      publicKey: this.configuration.getOrThrow<string>("VAPID_PUBLIC_KEY"),
    };
  }

  @Post("subscriptions/inspect")
  @Roles("Customer")
  @Header("Cache-Control", "no-store")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Проверить связь текущей push-подписки" })
  @ApiBody({ type: PushSubscriptionDto })
  @ApiResponse({ status: HttpStatus.OK, type: PushSubscriptionInspectionDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiHttpErrorDto })
  async inspect(
    @Body() body: unknown,
    @CurrentAuth() auth: CurrentAuthData,
  ): Promise<PushSubscriptionInspection> {
    const subscription = parseSubscription(body);
    return this.subscriptions.inspect(
      auth.userId,
      toCommand(auth.userId, subscription),
    );
  }

  @Put("subscriptions/association")
  @Roles("Customer")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Включить или перенести связь push-подписки" })
  @ApiBody({ type: PushAssociationRequestDto })
  @ApiResponse({ status: HttpStatus.OK, type: PushAssociationResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiHttpErrorDto })
  async associate(
    @Body() body: unknown,
    @CurrentAuth() auth: CurrentAuthData,
  ): Promise<PushAssociationResponse> {
    const request = parseAssociationRequest(body);
    try {
      return await this.subscriptions.associate(
        auth.userId,
        toCommand(auth.userId, request.subscription),
        request.action,
        request.expectedVersion,
      );
    } catch (error) {
      rethrowAssociationConflict(error);
    }
  }

  @Delete("subscriptions/association")
  @Roles("Customer")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Отключить свою versioned push-связь" })
  @ApiBody({ type: PushAssociationDeleteRequestDto })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiHttpErrorDto })
  async deleteAssociation(
    @Body() body: unknown,
    @CurrentAuth() auth: CurrentAuthData,
  ): Promise<void> {
    const request = parseDeleteAssociationRequest(body);
    try {
      await this.subscriptions.deleteAssociation(
        auth.userId,
        toCommand(auth.userId, request.subscription),
        request.expectedVersion,
      );
    } catch (error) {
      rethrowAssociationConflict(error);
    }
  }
}

function parseSubscription(value: unknown): PushSubscriptionRequest {
  if (
    typeof value !== "object" ||
    value === null ||
    !("endpoint" in value) ||
    !("keys" in value) ||
    typeof value.endpoint !== "string" ||
    !isUrl(value.endpoint) ||
    typeof value.keys !== "object" ||
    value.keys === null ||
    !("p256dh" in value.keys) ||
    !("auth" in value.keys) ||
    typeof value.keys.p256dh !== "string" ||
    typeof value.keys.auth !== "string" ||
    value.keys.p256dh.trim() === "" ||
    value.keys.auth.trim() === ""
  )
    validationError();
  return value as PushSubscriptionRequest;
}
function toCommand(userId: string, subscription: PushSubscriptionRequest) {
  return {
    userId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  };
}
function parseAssociationRequest(value: unknown): PushAssociationRequest {
  if (
    typeof value !== "object" ||
    value === null ||
    !("subscription" in value) ||
    !("action" in value) ||
    !("expectedVersion" in value) ||
    (value.action !== "enable" && value.action !== "transfer") ||
    (value.expectedVersion !== null &&
      (typeof value.expectedVersion !== "string" ||
        !isUuid(value.expectedVersion)))
  )
    validationError();
  return {
    subscription: parseSubscription(value.subscription),
    action: value.action,
    expectedVersion: value.expectedVersion,
  };
}
function parseDeleteAssociationRequest(
  value: unknown,
): PushAssociationDeleteRequest {
  if (
    typeof value !== "object" ||
    value === null ||
    !("subscription" in value) ||
    !("expectedVersion" in value) ||
    typeof value.expectedVersion !== "string" ||
    !isUuid(value.expectedVersion)
  )
    validationError();
  return {
    subscription: parseSubscription(value.subscription),
    expectedVersion: value.expectedVersion,
  };
}
function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
function rethrowAssociationConflict(error: unknown): never {
  if (!(error instanceof PushAssociationConflictError)) throw error;
  throw new HttpException(
    {
      code: error.code,
      message:
        "Связь уведомлений изменилась. Проверьте состояние и повторите действие.",
      details: null,
    },
    HttpStatus.CONFLICT,
  );
}
function isUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
function validationError(): never {
  throw new HttpException(
    {
      code: "VALIDATION_ERROR",
      message: "Параметры запроса недопустимы.",
      details: null,
    },
    HttpStatus.BAD_REQUEST,
  );
}
