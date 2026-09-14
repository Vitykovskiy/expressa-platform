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
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiHeader,
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
import { CreateOrderUseCase } from "../application/create-order.use-case";
import { GetOrdersUseCase } from "../application/get-orders.use-case";
import type { StoredOrder } from "../application/order-unit-of-work.types";
import {
  IdempotencyKeyReusedError,
  MenuItemUnavailableError,
  OrderDomainError,
  OrderIntakeClosedError,
  OrderTotalChangedError,
  OrderValidationError,
} from "../domain/order.errors";
import { OrderNotFoundError } from "../domain/order-lifecycle.errors";
import { CreateOrderV3Dto } from "./create-order-v3.dto";
import type { CreateOrderV3Body } from "./create-order-v3.dto.types";
import {
  CustomerOrderV3ResponseDto,
  CustomerOrdersV3PageResponseDto,
  OrderV3ResponseDto,
} from "./order-v3.dto";
import type {
  CustomerOrderV3Dto,
  CustomerOrdersV3PageDto,
  OrderV3Dto,
} from "./order-v3.dto.types";

@ApiTags("orders-v3")
@Controller("api/v3/orders")
@UseGuards(SessionGuard, RolesGuard)
@Roles("Customer")
@ApiBearerAuth()
export class OrdersV3Controller {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly getOrders: GetOrdersUseCase,
    @Inject(clockPort) private readonly clock: Clock,
  ) {}

  @Get()
  @ApiResponse({ status: 200, type: CustomerOrdersV3PageResponseDto })
  async list(
    @CurrentAuth() auth: CurrentAuthData,
  ): Promise<CustomerOrdersV3PageDto> {
    const page = await this.getOrders.listForCustomer(auth.userId, null);
    return { orders: page.orders.map(toCustomerDto), nextCursor: null };
  }

  @Get(":orderId")
  @ApiResponse({ status: 200, type: CustomerOrderV3ResponseDto })
  async details(
    @Param("orderId") orderId: string,
    @CurrentAuth() auth: CurrentAuthData,
  ): Promise<CustomerOrderV3Dto> {
    assertUuid(orderId);
    try {
      return toCustomerDto(
        await this.getOrders.detailsForCustomer(auth.userId, orderId),
      );
    } catch (error) {
      if (error instanceof OrderNotFoundError)
        throw new HttpException(
          { code: error.code, message: error.message, details: null },
          HttpStatus.NOT_FOUND,
        );
      throw error;
    }
  }

  @Post()
  @ApiHeader({
    name: "Idempotency-Key",
    required: true,
    schema: { type: "string", format: "uuid" },
  })
  @ApiResponse({ status: 201, type: OrderV3ResponseDto })
  create(
    @Body() body: CreateOrderV3Dto,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @CurrentAuth() auth: CurrentAuthData,
  ): Promise<OrderV3Dto> {
    assertBody(body);
    if (!isUuid(idempotencyKey)) invalid();
    return this.execute(body, idempotencyKey, auth.userId);
  }

  @Post(":orderId/repeat")
  @ApiHeader({
    name: "Idempotency-Key",
    required: true,
    schema: { type: "string", format: "uuid" },
  })
  @ApiResponse({ status: 201, type: OrderV3ResponseDto })
  async repeat(
    @Param("orderId") orderId: string,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @CurrentAuth() auth: CurrentAuthData,
  ): Promise<OrderV3Dto> {
    assertUuid(orderId);
    if (!isUuid(idempotencyKey)) invalid();
    const source = await this.getOrders
      .detailsForCustomer(auth.userId, orderId)
      .catch((error: unknown) => {
        if (error instanceof OrderNotFoundError)
          throw new HttpException(
            { code: error.code, message: error.message, details: null },
            HttpStatus.NOT_FOUND,
          );
        throw error;
      });
    const body: CreateOrderV3Body = {
      expectedTotal: source.total,
      items: source.snapshot.map((item) => ({
        productId: item.productId,
        ...(item.priceChoiceId === null
          ? {}
          : { priceChoiceId: item.priceChoiceId }),
        modifierOptionIds: item.modifiers.map(
          (modifier) => modifier.modifierOptionId,
        ),
        quantity: item.quantity,
      })),
    };
    return this.execute(body, idempotencyKey, auth.userId);
  }

  private async execute(
    body: CreateOrderV3Body,
    idempotencyKey: string,
    customerId: string,
  ): Promise<OrderV3Dto> {
    try {
      return toOrderDto(
        (
          await this.createOrder.execute({
            customerId,
            idempotencyKey,
            now: this.clock.now(),
            request: {
              pricingMode: "v3",
              total: body.expectedTotal,
              items: body.items.map((item) => ({
                productId: item.productId,
                variantId: null,
                priceChoiceId: item.priceChoiceId ?? null,
                modifierOptionIds: item.modifierOptionIds,
                quantity: item.quantity,
              })),
            },
          })
        ).order,
      );
    } catch (error) {
      throwOrderError(error);
    }
  }
}

function toOrderDto(order: StoredOrder): OrderV3Dto {
  return {
    id: order.id,
    number: order.number,
    stage: order.stage,
    total: order.total,
    items: order.items.map((item) => ({
      productId: item.productId,
      priceChoiceId: item.priceChoiceId,
      productName: item.productName,
      portionLabel: item.portionLabel,
      quantity: item.quantity,
      unitTotal: item.unitTotal,
      lineTotal: item.lineTotal,
      modifiers: item.modifiers.map((modifier) => ({ ...modifier })),
    })),
  };
}
function toCustomerDto(order: {
  id: string;
  number: string;
  createdAt: Date;
  stage: string;
  total: number;
  snapshot: readonly import("../domain/order.types").OrderSnapshotItem[];
}): CustomerOrderV3Dto {
  return {
    ...toOrderDto({ ...order, items: order.snapshot } as StoredOrder),
    createdAt: order.createdAt.toISOString(),
  };
}
function assertBody(body: unknown): asserts body is CreateOrderV3Body {
  if (!isRecord(body)) invalid();
  const expectedTotal = body.expectedTotal;
  const items = body.items;
  if (
    typeof expectedTotal !== "number" ||
    !Number.isInteger(expectedTotal) ||
    expectedTotal < 0 ||
    !Array.isArray(items) ||
    items.length === 0 ||
    items.some((item) => !isItem(item))
  )
    invalid();
}
function isItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const quantity = value.quantity;
  return (
    isUuid(value.productId) &&
    (value.priceChoiceId === undefined || isUuid(value.priceChoiceId)) &&
    Array.isArray(value.modifierOptionIds) &&
    value.modifierOptionIds.every(isUuid) &&
    new Set(value.modifierOptionIds).size === value.modifierOptionIds.length &&
    typeof quantity === "number" &&
    Number.isInteger(quantity) &&
    quantity >= 1
  );
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}
function assertUuid(value: unknown): asserts value is string {
  if (!isUuid(value)) invalid();
}
function invalid(): never {
  throw new HttpException(
    {
      code: "VALIDATION_ERROR",
      message: "Состав заказа недопустим.",
      details: null,
    },
    HttpStatus.BAD_REQUEST,
  );
}
function throwOrderError(error: unknown): never {
  if (!(error instanceof OrderDomainError)) throw error;
  if (error instanceof OrderTotalChangedError)
    throw new HttpException(
      {
        code: error.code,
        message: error.message,
        details: { total: error.total },
      },
      HttpStatus.BAD_REQUEST,
    );
  if (error instanceof MenuItemUnavailableError)
    throw new HttpException(
      {
        code: error.code,
        message: error.message,
        details: { itemId: error.itemId },
      },
      HttpStatus.BAD_REQUEST,
    );
  if (
    error instanceof OrderIntakeClosedError ||
    error instanceof OrderValidationError
  )
    invalid();
  if (error instanceof IdempotencyKeyReusedError)
    throw new HttpException(
      { code: error.code, message: error.message, details: null },
      HttpStatus.CONFLICT,
    );
  throw error;
}
