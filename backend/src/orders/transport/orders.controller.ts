import {
  Body,
  Controller,
  Headers,
  HttpException,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { clockPort } from '../../auth/application/clock.constants';
import type { Clock } from '../../auth/application/clock.types';
import { CurrentAuth } from '../../auth/transport/current-auth.decorator';
import type { CurrentAuth as CurrentAuthData } from '../../auth/transport/current-auth.decorator.types';
import { Roles } from '../../auth/transport/roles.decorator';
import { RolesGuard } from '../../auth/transport/roles.guard';
import { SessionGuard } from '../../auth/transport/session.guard';
import {
  ApiHttpErrorDto,
} from '../../platform/observability/http-error.dto';
import { CreateOrderUseCase } from '../application/create-order.use-case';
import type { StoredOrder } from '../application/order-unit-of-work.types';
import {
  MenuItemUnavailableError,
  OrderDomainError,
  OrderIntakeClosedError,
  OrderTotalChangedError,
  OrderValidationError,
  IdempotencyKeyReusedError,
} from '../domain/order.errors';
import { maximumOrderItemQuantity, minimumOrderItemQuantity } from '../domain/order.constants';
import {
  idempotencyHeaderDescription,
  idempotencyHeaderName,
  idempotencyHeaderRequestKey,
  idempotencyHeaderSchema,
  maximumOrderTotalMinor,
  ordersApiTag,
  ordersControllerPath,
  orderErrorResponses,
  orderErrorStatus,
  idempotencyKeyReusedStatus,
} from './orders.controller.constants';
import { CreateOrderDto } from './create-order.dto';
import { OrderDto } from './order.dto';

@ApiTags(ordersApiTag)
@Controller(ordersControllerPath)
@UseGuards(SessionGuard, RolesGuard)
@Roles('Customer')
@ApiBearerAuth()
@ApiResponse({ status: 401, type: ApiHttpErrorDto })
@ApiResponse({ status: 403, type: ApiHttpErrorDto })
@ApiResponse({ status: 500, type: ApiHttpErrorDto })
export class OrdersController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    @Inject(clockPort) private readonly clock: Clock,
  ) {}

  @Post()
  @ApiHeader({
    name: idempotencyHeaderName,
    description: idempotencyHeaderDescription,
    required: true,
    schema: idempotencyHeaderSchema,
  })
  @ApiOperation({ summary: 'Создать заказ' })
  @ApiResponse({ status: 201, type: OrderDto })
  @ApiResponse({ status: 400, type: ApiHttpErrorDto })
  @ApiResponse({ status: 409, type: ApiHttpErrorDto })
  async create(
    @Body() body: CreateOrderDto,
    @Headers(idempotencyHeaderRequestKey) idempotencyKey: string | undefined,
    @CurrentAuth() auth: CurrentAuthData,
  ): Promise<OrderDto> {
    assertCreateOrderBody(body);
    if (!isUuid(idempotencyKey)) {
      throwValidationError();
    }

    try {
      const result = await this.createOrder.execute({
        customerId: auth.userId,
        idempotencyKey,
        request: {
          totalMinor: body.expectedTotalMinor,
          items: body.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            modifierOptionIds: item.modifierOptionIds,
            quantity: item.quantity,
          })),
        },
        now: this.clock.now(),
      });
      return toOrderDto(result.order);
    } catch (error) {
      throwOrderError(error);
    }
  }
}

function assertCreateOrderBody(body: unknown): asserts body is CreateOrderDto {
  if (
    typeof body !== 'object'
    || body === null
    || !('expectedTotalMinor' in body)
    || !isNonNegativeInt32(body.expectedTotalMinor)
    || !('items' in body)
    || !Array.isArray(body.items)
    || body.items.length === 0
    || body.items.some((item) => !isCreateOrderItem(item))
  ) {
    throwValidationError();
  }
}

function isCreateOrderItem(value: unknown): boolean {
  return (
    typeof value === 'object'
    && value !== null
    && 'productId' in value
    && isUuid(value.productId)
    && 'variantId' in value
    && (value.variantId === null || isUuid(value.variantId))
    && 'modifierOptionIds' in value
    && Array.isArray(value.modifierOptionIds)
    && value.modifierOptionIds.every(isUuid)
    && new Set(value.modifierOptionIds).size === value.modifierOptionIds.length
    && 'quantity' in value
    && isOrderItemQuantity(value.quantity)
  );
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isNonNegativeInt32(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= maximumOrderTotalMinor;
}

function isOrderItemQuantity(value: unknown): value is number {
  return (
    isNonNegativeInt32(value)
    && value >= minimumOrderItemQuantity
    && value <= maximumOrderItemQuantity
  );
}

function throwValidationError(): never {
  throw new HttpException(orderErrorResponses.validation, orderErrorStatus);
}

function throwOrderError(error: unknown): never {
  if (!(error instanceof OrderDomainError)) {
    throw error;
  }
  if (error instanceof OrderTotalChangedError) {
    throw new HttpException(orderErrorResponses.totalChanged(error.totalMinor), orderErrorStatus);
  }
  if (error instanceof MenuItemUnavailableError) {
    throw new HttpException(orderErrorResponses.unavailable(error.itemId), orderErrorStatus);
  }
  if (error instanceof OrderIntakeClosedError) {
    throw new HttpException(orderErrorResponses.intakeClosed, orderErrorStatus);
  }
  if (error instanceof OrderValidationError) {
    throwValidationError();
  }
  if (error instanceof IdempotencyKeyReusedError) {
    throw new HttpException({ code: error.code, message: error.message, details: null }, idempotencyKeyReusedStatus);
  }
  throw error;
}

function toOrderDto(order: StoredOrder): OrderDto {
  return {
    id: order.id,
    number: order.number,
    stage: order.stage,
    totalMinor: order.totalMinor,
    items: order.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      productName: item.productName,
      size: item.size,
      quantity: item.quantity,
      unitTotalMinor: item.unitTotalMinor,
      lineTotalMinor: item.lineTotalMinor,
      modifiers: item.modifiers.map((modifier) => ({
        modifierOptionId: modifier.modifierOptionId,
        modifierName: modifier.modifierName,
        priceDeltaMinor: modifier.priceDeltaMinor,
      })),
    })),
  };
}
