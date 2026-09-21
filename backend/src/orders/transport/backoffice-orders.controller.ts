import {
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { clockPort } from "../../auth/application/clock.constants";
import type { Clock } from "../../auth/application/clock.types";
import { CurrentAuth } from "../../auth/transport/current-auth.decorator";
import type { CurrentAuth as CurrentAuthData } from "../../auth/transport/current-auth.decorator.types";
import { Roles } from "../../auth/transport/roles.decorator";
import { RolesGuard } from "../../auth/transport/roles.guard";
import { SessionGuard } from "../../auth/transport/session.guard";
import { ApiHttpErrorDto } from "../../platform/observability/http-error.dto";
import { TransitionOrderUseCase } from "../application/transition-order.use-case";
import type {
  OrderDetails,
  OrderTransitionAction,
} from "../domain/order-lifecycle.types";
import {
  OrderLifecycleError,
  OrderNotFoundError,
  OrderStageConflictError,
} from "../domain/order-lifecycle.errors";
import { BackofficeOrderDetailsResponseDto } from "./backoffice-orders.dto";
import type { BackofficeOrderDetailsDto } from "./backoffice-orders.dto.types";
import {
  backofficeOrderErrorResponses,
  backofficeOrderErrorStatus,
  backofficeOrdersApiTag,
  backofficeOrdersControllerPath,
} from "./backoffice-orders.controller.constants";

@ApiTags(backofficeOrdersApiTag)
@Controller(backofficeOrdersControllerPath)
@UseGuards(SessionGuard, RolesGuard)
@Roles("Staff")
@ApiBearerAuth()
@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ApiHttpErrorDto })
@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ApiHttpErrorDto })
@ApiResponse({
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  type: ApiHttpErrorDto,
})
export class BackofficeOrdersController {
  constructor(
    private readonly transitionOrder: TransitionOrderUseCase,
    @Inject(clockPort) private readonly clock: Clock,
  ) {}

  @Post(":orderId/accept")
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: "orderId", format: "uuid" })
  @ApiOperation({ summary: "Принять заказ" })
  @ApiResponse({
    status: HttpStatus.OK,
    type: BackofficeOrderDetailsResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ApiHttpErrorDto })
  accept(
    @Param("orderId") orderId: string,
    @CurrentAuth() auth: CurrentAuthData,
  ): Promise<BackofficeOrderDetailsDto> {
    return this.transition(orderId, "accept", auth.userId);
  }

  @Post(":orderId/start-preparing")
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: "orderId", format: "uuid" })
  @ApiOperation({ summary: "Начать приготовление заказа" })
  @ApiResponse({
    status: HttpStatus.OK,
    type: BackofficeOrderDetailsResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ApiHttpErrorDto })
  startPreparing(
    @Param("orderId") orderId: string,
    @CurrentAuth() auth: CurrentAuthData,
  ): Promise<BackofficeOrderDetailsDto> {
    return this.transition(orderId, "startPreparing", auth.userId);
  }

  @Post(":orderId/mark-ready")
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: "orderId", format: "uuid" })
  @ApiOperation({ summary: "Отметить заказ готовым" })
  @ApiResponse({
    status: HttpStatus.OK,
    type: BackofficeOrderDetailsResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ApiHttpErrorDto })
  markReady(
    @Param("orderId") orderId: string,
    @CurrentAuth() auth: CurrentAuthData,
  ): Promise<BackofficeOrderDetailsDto> {
    return this.transition(orderId, "markReady", auth.userId);
  }

  @Post(":orderId/issue")
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: "orderId", format: "uuid" })
  @ApiOperation({ summary: "Выдать заказ" })
  @ApiResponse({
    status: HttpStatus.OK,
    type: BackofficeOrderDetailsResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ApiHttpErrorDto })
  issue(
    @Param("orderId") orderId: string,
    @CurrentAuth() auth: CurrentAuthData,
  ): Promise<BackofficeOrderDetailsDto> {
    return this.transition(orderId, "issue", auth.userId);
  }

  private async transition(
    orderId: string,
    action: OrderTransitionAction,
    actorId: string,
  ): Promise<BackofficeOrderDetailsDto> {
    assertUuid(orderId);
    return execute(() =>
      this.transitionOrder.execute({
        orderId,
        action,
        actorId,
        occurredAt: this.clock.now(),
      }),
    ).then(toDetailsDto);
  }
}

function assertUuid(value: string): void {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throwValidationError();
}
function throwValidationError(): never {
  throw new HttpException(
    {
      code: "VALIDATION_ERROR",
      message: "Параметры запроса недопустимы.",
      details: null,
    },
    HttpStatus.BAD_REQUEST,
  );
}
async function execute<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof OrderNotFoundError)
      throw new HttpException(
        backofficeOrderErrorResponses.notFound,
        backofficeOrderErrorStatus.notFound,
      );
    if (error instanceof OrderStageConflictError)
      throw new HttpException(
        backofficeOrderErrorResponses.conflict,
        backofficeOrderErrorStatus.conflict,
      );
    if (error instanceof OrderLifecycleError) throw error;
    throw error;
  }
}
function toDetailsDto(order: OrderDetails): BackofficeOrderDetailsDto {
  return {
    id: order.id,
    number: order.number,
    createdAt: order.createdAt.toISOString(),
    total: order.total,
    stage: order.stage,
    customer: order.customer,
    snapshot: order.snapshot.map((item) => ({
      productId: item.productId,
      priceChoiceId: item.priceChoiceId,
      productName: item.productName,
      portionLabel: item.portionLabel,
      quantity: item.quantity,
      unitTotal: item.unitTotal,
      lineTotal: item.lineTotal,
      modifiers: [...item.modifiers],
    })),
    events: order.events.map((event) => ({
      actorId: event.actorId,
      actorLabel: event.actorLabel,
      occurredAt: event.occurredAt.toISOString(),
      from: event.from,
      to: event.to,
    })),
  };
}
