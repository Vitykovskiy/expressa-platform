import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
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
import { GetOrdersUseCase } from '../application/get-orders.use-case';
import type { CustomerOrder, CustomerOrdersCursor } from '../application/order-lifecycle.types';
import type { StoredOrder } from '../application/order-unit-of-work.types';
import { OrderNotFoundError } from '../domain/order-lifecycle.errors';
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
  customerOrdersCursorParameter,
  ordersApiTag,
  ordersControllerPath,
  orderErrorResponses,
  orderErrorStatus,
  idempotencyKeyReusedStatus,
} from './orders.controller.constants';
import { CreateOrderDto } from './create-order.dto';
import { CustomerOrderResponseDto, CustomerOrdersPageResponseDto, OrderDto } from './order.dto';
import type { CustomerOrderDto, CustomerOrdersPageDto } from './order.dto.types';

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
    private readonly getOrders: GetOrdersUseCase,
    @Inject(clockPort) private readonly clock: Clock,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получить историю своих заказов' })
  @ApiQuery({ name: customerOrdersCursorParameter, required: false, type: 'string' })
  @ApiResponse({ status: HttpStatus.OK, type: CustomerOrdersPageResponseDto })
  async list(
    @Query(customerOrdersCursorParameter) cursor: string | undefined,
    @CurrentAuth() auth: CurrentAuthData,
  ): Promise<CustomerOrdersPageDto> {
    const page = await this.getOrders.listForCustomer(auth.userId, parseCursor(cursor));
    return {
      orders: page.orders.map(toCustomerOrderDto),
      nextCursor: page.nextCursor === null ? null : encodeCursor(page.nextCursor),
    };
  }

  @Get(':orderId')
  @ApiParam({ name: 'orderId', format: 'uuid' })
  @ApiOperation({ summary: 'Получить свой заказ' })
  @ApiResponse({ status: HttpStatus.OK, type: CustomerOrderResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiHttpErrorDto })
  async details(
    @Param('orderId') orderId: string,
    @CurrentAuth() auth: CurrentAuthData,
  ): Promise<CustomerOrderDto> {
    if (!isUuid(orderId)) throwValidationError();
    try {
      return toCustomerOrderDto(await this.getOrders.detailsForCustomer(auth.userId, orderId));
    } catch (error) {
      if (error instanceof OrderNotFoundError) {
        throw new HttpException({ code: error.code, message: error.message, details: null }, HttpStatus.NOT_FOUND);
      }
      throw error;
    }
  }

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

function toCustomerOrderDto(order: CustomerOrder): CustomerOrderDto {
  return {
    id: order.id,
    number: order.number,
    createdAt: order.createdAt.toISOString(),
    stage: order.stage,
    totalMinor: order.totalMinor,
    snapshot: order.snapshot.map((item) => ({
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

function parseCursor(value: string | undefined): CustomerOrdersCursor | null {
  if (value === undefined) return null;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (!isRecord(parsed) || typeof parsed.createdAt !== 'string' || !isUuid(parsed.id)) throwValidationError();
    if (!isPostgresTimestamp(parsed.createdAt)) throwValidationError();
    return { createdAt: parsed.createdAt, id: parsed.id };
  } catch (error) {
    if (error instanceof HttpException) throw error;
    throwValidationError();
  }
}

function encodeCursor(cursor: CustomerOrdersCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

function isPostgresTimestamp(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?([+-])(\d{2})(?::?(\d{2}))?$/.exec(value);
  if (match === null) return false;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , sign, offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const offsetHour = Number(offsetHourText);
  const offsetMinute = Number(offsetMinuteText ?? '0');
  if (year === 0 || month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59 || offsetMinute > 59 || offsetHour > 15 || (offsetHour === 15 && offsetMinute > 59)) return false;

  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, 0);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    && date.getUTCHours() === hour && date.getUTCMinutes() === minute && date.getUTCSeconds() === second
    && (sign === '+' || sign === '-');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
