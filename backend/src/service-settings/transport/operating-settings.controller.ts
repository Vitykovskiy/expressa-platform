import {
  Body,
  Controller,
  Get,
  Put,
  HttpException,
  HttpStatus,
  Inject,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../auth/transport/roles.decorator";
import { RolesGuard } from "../../auth/transport/roles.guard";
import { SessionGuard } from "../../auth/transport/session.guard";
import { CurrentAuth } from "../../auth/transport/current-auth.decorator";
import type { CurrentAuth as CurrentAuthData } from "../../auth/transport/current-auth.decorator.types";
import { clockPort } from "../../auth/application/clock.constants";
import type { Clock } from "../../auth/application/clock.types";
import { ApiHttpErrorDto } from "../../platform/observability/http-error.dto";
import { ManageOperatingSettingsUseCase } from "../application/manage-operating-settings.use-case";
import { InvalidOperatingSettingsError } from "../domain/operating-settings";
import type {
  OperatingSettingsInput,
  OperatingSettings,
} from "../domain/operating-settings.types";
import {
  OperatingSettingsInputDto,
  OperatingSettingsResponseDto,
} from "./operating-settings.dto";
import type {
  OperatingSettingsResponse,
  OperatingSettingsRequest,
} from "./operating-settings.dto.types";

@ApiTags("backoffice-settings-v3")
@Controller("api/v3/backoffice/settings")
@UseGuards(SessionGuard, RolesGuard)
@Roles("Administrator")
@ApiBearerAuth()
@ApiResponse({ status: 401, type: ApiHttpErrorDto })
@ApiResponse({ status: 403, type: ApiHttpErrorDto })
@ApiResponse({ status: 500, type: ApiHttpErrorDto })
export class OperatingSettingsController {
  constructor(
    private readonly settings: ManageOperatingSettingsUseCase,
    @Inject(clockPort) private readonly clock: Clock,
  ) {}
  @Get()
  @ApiResponse({ status: 200, type: OperatingSettingsResponseDto })
  async get(): Promise<OperatingSettingsResponse> {
    return toResponse(await this.settings.get());
  }
  @Put()
  @ApiResponse({ status: 200, type: OperatingSettingsResponseDto })
  @ApiResponse({ status: 400, type: ApiHttpErrorDto })
  async save(
    @Body() body: OperatingSettingsInputDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: OperatingSettingsRequest,
  ): Promise<OperatingSettingsResponse> {
    const settings = parseInput(body);
    if (
      typeof request.requestId !== "string" ||
      request.requestId.trim() === ""
    ) {
      throw new Error("Missing request identity");
    }
    try {
      return toResponse(
        await this.settings.save({
          settings,
          actorId: auth.userId,
          requestId: request.requestId,
          occurredAt: this.clock.now(),
        }),
      );
    } catch (error) {
      if (error instanceof InvalidOperatingSettingsError) {
        invalid(error.message);
      }
      throw error;
    }
  }
}
function parseInput(value: unknown): OperatingSettingsInput {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !("opensAt" in value) ||
    typeof value.opensAt !== "string" ||
    !("closesAt" in value) ||
    typeof value.closesAt !== "string" ||
    !("slotCapacity" in value) ||
    typeof value.slotCapacity !== "number" ||
    Object.keys(value).some(
      (key) => !["opensAt", "closesAt", "slotCapacity"].includes(key),
    )
  ) {
    invalid("Параметры настроек недопустимы.");
  }
  return {
    opensAt: value.opensAt,
    closesAt: value.closesAt,
    slotCapacity: value.slotCapacity,
  };
}
function invalid(message: string): never {
  throw new HttpException(
    { code: "VALIDATION_ERROR", message, details: null },
    HttpStatus.BAD_REQUEST,
  );
}
function toResponse(value: OperatingSettings): OperatingSettingsResponse {
  return { ...value, updatedAt: value.updatedAt?.toISOString() ?? null };
}
