import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentAuth } from "../../auth/transport/current-auth.decorator";
import type { CurrentAuth as CurrentAuthData } from "../../auth/transport/current-auth.decorator.types";
import { Roles } from "../../auth/transport/roles.decorator";
import { RolesGuard } from "../../auth/transport/roles.guard";
import { SessionGuard } from "../../auth/transport/session.guard";
import {
  ApiHttpErrorDto,
  ApiValidationErrorDto,
} from "../../platform/observability/http-error.dto";
import type { AvailabilityEntityType } from "../application/admin-catalog.repository.types";
import { GetAdminCatalogUseCase } from "../application/get-admin-catalog.use-case";
import {
  AvailabilityNotFoundError,
  ManageAvailabilityUseCase,
} from "../application/manage-availability.use-case";
import { ManageServiceIntakeUseCase } from "../application/manage-service-intake.use-case";
import { validationError } from "./catalog-validation-error";
import {
  AvailabilityResponseDto,
  AvailabilityUpdateRequestDto,
  AvailabilityUpdateResponseDto,
  ServiceIntakeRequestDto,
  ServiceIntakeResponseDto,
} from "./backoffice-availability.dto";
import type {
  AvailabilityRequestContext,
  AvailabilityRouteType,
} from "./backoffice-availability.dto.types";

const controllerPath = "backoffice";
const apiTag = "backoffice";

@ApiTags(apiTag)
@Controller(controllerPath)
@UseGuards(SessionGuard, RolesGuard)
@Roles("Staff")
@ApiBearerAuth()
@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ApiHttpErrorDto })
@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ApiHttpErrorDto })
@ApiResponse({
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  type: ApiHttpErrorDto,
})
export class BackofficeAvailabilityController {
  constructor(
    private readonly getAdminCatalog: GetAdminCatalogUseCase,
    private readonly manageAvailability: ManageAvailabilityUseCase,
    private readonly manageServiceIntake: ManageServiceIntakeUseCase,
  ) {}

  @Get("availability")
  @ApiOperation({ summary: "Получить доступность каталога и приём заказов" })
  @ApiResponse({ status: 200, type: AvailabilityResponseDto })
  async getAvailability(): Promise<AvailabilityResponseDto> {
    const catalog = await this.getAdminCatalog.execute();
    if (catalog.intake === undefined)
      throw new Error("Availability intake is missing");
    return { ...catalog, intake: catalog.intake };
  }

  @Patch("availability/:type/:id")
  @ApiParam({ name: "type", enum: ["product", "variant", "modifier"] })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiOperation({ summary: "Изменить доступность позиции каталога" })
  @ApiResponse({ status: 200, type: AvailabilityUpdateResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiHttpErrorDto })
  async updateAvailability(
    @Param("type") type: AvailabilityRouteType,
    @Param("id") id: string,
    @Body() body: AvailabilityUpdateRequestDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: AvailabilityRequestContext,
  ): Promise<AvailabilityUpdateResponseDto> {
    assertAvailabilityType(type);
    assertUuid(id, "id");
    assertBoolean(body?.isAvailable, "isAvailable");
    try {
      return await this.manageAvailability.execute({
        type,
        id,
        isAvailable: body.isAvailable,
        actorId: auth.userId,
        requestId: requestId(request),
      });
    } catch (error) {
      throwAvailabilityError(error);
    }
  }

  @Patch("service/intake")
  @ApiOperation({ summary: "Изменить приём новых заказов" })
  @ApiResponse({ status: 200, type: ServiceIntakeResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationErrorDto })
  async updateIntake(
    @Body() body: ServiceIntakeRequestDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: AvailabilityRequestContext,
  ): Promise<ServiceIntakeResponseDto> {
    assertBoolean(body?.acceptsNewOrders, "acceptsNewOrders");
    return this.manageServiceIntake.execute({
      acceptsNewOrders: body.acceptsNewOrders,
      actorId: auth.userId,
      requestId: requestId(request),
    });
  }
}

function assertAvailabilityType(
  value: string,
): asserts value is AvailabilityEntityType {
  if (value !== "product" && value !== "variant" && value !== "modifier")
    throw validationError([
      { path: "type", reason: "Must be product, variant, or modifier" },
    ]);
}
function assertBoolean(value: unknown, path: string): asserts value is boolean {
  if (typeof value !== "boolean")
    throw validationError([{ path, reason: "Must be a boolean" }]);
}
function assertUuid(value: string, path: string): void {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw validationError([{ path, reason: "Must be a UUID" }]);
}
function requestId(request: AvailabilityRequestContext): string {
  if (typeof request.requestId !== "string" || request.requestId === "")
    throw validationError([{ path: "requestId", reason: "Must be present" }]);
  return request.requestId;
}
function throwAvailabilityError(error: unknown): never {
  if (error instanceof AvailabilityNotFoundError)
    throw new HttpException(
      {
        code: "AVAILABILITY_ITEM_NOT_FOUND",
        message: "Availability item not found",
        details: null,
      },
      HttpStatus.NOT_FOUND,
    );
  throw error;
}
