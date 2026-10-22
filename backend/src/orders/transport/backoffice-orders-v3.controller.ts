import { SourceOrderActionsUseCase } from "../application/source-order-actions.use-case";
import type { SourceOrderCommand } from "../application/source-order-actions.types";
import { toOrderMetadataDto } from "./order-metadata.mapper";
import type { SourceOrderRequest } from "./order-metadata.dto.types";
import type { OrderDetails } from "../domain/order-lifecycle.types";
import { CurrentAuth } from "../../auth/transport/current-auth.decorator";
import type { CurrentAuth as CurrentAuthData } from "../../auth/transport/current-auth.decorator.types";
import { clockPort } from "../../auth/application/clock.constants";
import type { Clock } from "../../auth/application/clock.types";
import { ApiHttpErrorDto } from "../../platform/observability/http-error.dto";
import {
  Controller,
  Body,
  Post,
  HttpCode,
  Inject,
  Req,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiParam,
} from "@nestjs/swagger";
import { Roles } from "../../auth/transport/roles.decorator";
import { RolesGuard } from "../../auth/transport/roles.guard";
import { SessionGuard } from "../../auth/transport/session.guard";
import { GetOrdersUseCase } from "../application/get-orders.use-case";
import {
  OrderStageConflictError,
  OrderNotFoundError,
} from "../domain/order-lifecycle.errors";
import type { OrderSnapshotItem } from "../domain/order.types";
import {
  BackofficeOrderV3ResponseDto,
  BackofficeOrdersV3QueryDto,
  SourceOrderReadyDto,
  SourceOrderRejectDto,
} from "./backoffice-orders-v3.dto";
import type { BackofficeOrderV3Dto } from "./backoffice-orders-v3.dto.types";

@ApiTags("backoffice-orders-v3")
@Controller("api/v3/backoffice/orders")
@UseGuards(SessionGuard, RolesGuard)
@Roles("Staff")
@ApiBearerAuth()
@ApiResponse({ status: 400, type: ApiHttpErrorDto })
@ApiResponse({ status: 401, type: ApiHttpErrorDto })
@ApiResponse({ status: 403, type: ApiHttpErrorDto })
@ApiResponse({ status: 404, type: ApiHttpErrorDto })
@ApiResponse({ status: 409, type: ApiHttpErrorDto })
@ApiResponse({ status: 500, type: ApiHttpErrorDto })
export class BackofficeOrdersV3Controller {
  constructor(
    private readonly getOrders: GetOrdersUseCase,
    private readonly sourceActions: SourceOrderActionsUseCase,
    @Inject(clockPort) private readonly clock: Clock,
  ) {}

  @Get()
  @ApiQuery({
    name: "stage",
    required: false,
    enum: ["CREATED", "ACCEPTED", "PREPARING", "READY", "ISSUED"],
  })
  @ApiQuery({ name: "number", required: false })
  @ApiQuery({
    name: "view",
    required: false,
    enum: ["all", "new", "confirmed", "ready"],
  })
  @ApiResponse({
    status: 200,
    type: BackofficeOrderV3ResponseDto,
    isArray: true,
  })
  async list(
    @Query() query: BackofficeOrdersV3QueryDto,
  ): Promise<BackofficeOrderV3Dto[]> {
    assertQuery(query);
    const orders = await this.getOrders.list({
      stage: query.stage,
      number: query.number,
      view: query.view,
    });
    return Promise.all(orders.map((order) => this.details(order.id)));
  }

  @Get(":orderId")
  @ApiResponse({ status: 200, type: BackofficeOrderV3ResponseDto })
  async details(
    @Param("orderId") orderId: string,
  ): Promise<BackofficeOrderV3Dto> {
    assertUuid(orderId);
    try {
      const order = await this.getOrders.details(orderId);
      return toStaffDto(order);
    } catch (error) {
      if (error instanceof OrderNotFoundError) {
        throw new HttpException(
          { code: error.code, message: error.message, details: null },
          HttpStatus.NOT_FOUND,
        );
      }
      throw error;
    }
  }
  @Post(":orderId/ready")
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: "orderId", format: "uuid" })
  @ApiResponse({ status: 200, type: BackofficeOrderV3ResponseDto })
  ready(
    @Param("orderId") orderId: string,
    @Body() body: SourceOrderReadyDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: SourceOrderRequest,
  ): Promise<BackofficeOrderV3Dto> {
    if (!isRecord(body) || Object.keys(body).length !== 0) {
      invalid();
    }
    return this.applyAction({
      action: "ready",
      orderId,
      actorId: auth.userId,
      occurredAt: this.clock.now(),
      requestId: getRequestId(request),
    });
  }

  @Post(":orderId/reject")
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: "orderId", format: "uuid" })
  @ApiResponse({ status: 200, type: BackofficeOrderV3ResponseDto })
  reject(
    @Param("orderId") orderId: string,
    @Body() body: SourceOrderRejectDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: SourceOrderRequest,
  ): Promise<BackofficeOrderV3Dto> {
    if (
      !isRecord(body) ||
      typeof body.reason !== "string" ||
      body.reason.trim() === "" ||
      Object.keys(body).some((key) => key !== "reason")
    ) {
      invalid();
    }
    return this.applyAction({
      action: "reject",
      reason: body.reason,
      orderId,
      actorId: auth.userId,
      occurredAt: this.clock.now(),
      requestId: getRequestId(request),
    });
  }

  private async applyAction(
    command: SourceOrderCommand,
  ): Promise<BackofficeOrderV3Dto> {
    assertUuid(command.orderId);
    try {
      return toStaffDto(await this.sourceActions.execute(command));
    } catch (error) {
      if (
        error instanceof OrderNotFoundError ||
        error instanceof OrderStageConflictError
      ) {
        throw new HttpException(
          { code: error.code, message: error.message, details: null },
          error instanceof OrderNotFoundError
            ? HttpStatus.NOT_FOUND
            : HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }
}
function assertQuery(query: BackofficeOrdersV3QueryDto): void {
  if (
    !isRecord(query) ||
    Object.keys(query).some((key) => !["stage", "number", "view"].includes(key))
  ) {
    invalid();
  }
  if (
    query.stage !== undefined &&
    (typeof query.stage !== "string" ||
      !["CREATED", "ACCEPTED", "PREPARING", "READY", "ISSUED"].includes(
        query.stage,
      ))
  ) {
    invalid();
  }
  if (
    query.number !== undefined &&
    (typeof query.number !== "string" ||
      query.number.trim() === "" ||
      query.number.length > 64)
  ) {
    invalid();
  }
  if (
    query.view !== undefined &&
    (typeof query.view !== "string" ||
      !["all", "new", "confirmed", "ready"].includes(query.view))
  ) {
    invalid();
  }
  if (query.stage !== undefined && query.view !== undefined) {
    invalid();
  }
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function assertUuid(value: string): void {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    invalid();
  }
}
function getRequestId(request: SourceOrderRequest): string {
  if (
    typeof request.requestId !== "string" ||
    request.requestId.trim() === ""
  ) {
    throw new Error("Missing request identity");
  }
  return request.requestId;
}
function toStaffDto(order: OrderDetails): BackofficeOrderV3Dto {
  return {
    id: order.id,
    number: order.number,
    createdAt: order.createdAt.toISOString(),
    total: order.total,
    stage: order.stage,
    customer: { ...order.customer, name: order.customer.name ?? null },
    ...toOrderMetadataDto(order),
    snapshot: order.snapshot.map(toItem),
    events: order.events.map((event) => ({
      actorId: event.actorId,
      actorLabel: event.actorLabel,
      occurredAt: event.occurredAt.toISOString(),
      from: event.from,
      to: event.to,
    })),
  };
}

function invalid(): never {
  throw new HttpException(
    {
      code: "VALIDATION_ERROR",
      message: "Параметры запроса недопустимы.",
      details: null,
    },
    HttpStatus.BAD_REQUEST,
  );
}
function toItem(
  item: OrderSnapshotItem,
): import("./order-v3.dto.types").OrderV3ItemDto {
  return {
    productId: item.productId,
    priceChoiceId: item.priceChoiceId,
    productName: item.productName,
    portionLabel: item.portionLabel,
    quantity: item.quantity,
    unitTotal: item.unitTotal,
    lineTotal: item.lineTotal,
    modifiers: item.modifiers.map((modifier) => ({ ...modifier })),
  };
}
