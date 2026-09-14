import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../auth/transport/roles.decorator";
import { RolesGuard } from "../../auth/transport/roles.guard";
import { SessionGuard } from "../../auth/transport/session.guard";
import { GetOrdersUseCase } from "../application/get-orders.use-case";
import { OrderNotFoundError } from "../domain/order-lifecycle.errors";
import type { OrderSnapshotItem } from "../domain/order.types";
import {
  BackofficeOrderV3ResponseDto,
  BackofficeOrdersV3QueryDto,
} from "./backoffice-orders-v3.dto";
import type { BackofficeOrderV3Dto } from "./backoffice-orders-v3.dto.types";

@ApiTags("backoffice-orders-v3")
@Controller("api/v3/backoffice/orders")
@UseGuards(SessionGuard, RolesGuard)
@Roles("Staff")
@ApiBearerAuth()
export class BackofficeOrdersV3Controller {
  constructor(private readonly getOrders: GetOrdersUseCase) {}

  @Get()
  @ApiQuery({
    name: "stage",
    required: false,
    enum: ["CREATED", "ACCEPTED", "PREPARING", "READY", "ISSUED"],
  })
  @ApiQuery({ name: "number", required: false })
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
    });
    return Promise.all(orders.map((order) => this.details(order.id)));
  }

  @Get(":orderId")
  @ApiResponse({ status: 200, type: BackofficeOrderV3ResponseDto })
  async details(
    @Param("orderId") orderId: string,
  ): Promise<BackofficeOrderV3Dto> {
    try {
      const order = await this.getOrders.details(orderId);
      return {
        id: order.id,
        number: order.number,
        createdAt: order.createdAt.toISOString(),
        total: order.total,
        stage: order.stage,
        snapshot: order.snapshot.map(toItem),
      };
    } catch (error) {
      if (error instanceof OrderNotFoundError)
        throw new HttpException(
          { code: error.code, message: error.message, details: null },
          HttpStatus.NOT_FOUND,
        );
      throw error;
    }
  }
}
function assertQuery(query: BackofficeOrdersV3QueryDto): void {
  if (
    query.stage !== undefined &&
    !["CREATED", "ACCEPTED", "PREPARING", "READY", "ISSUED"].includes(
      query.stage,
    )
  )
    invalid();
  if (
    query.number !== undefined &&
    (query.number.trim() === "" || query.number.length > 64)
  )
    invalid();
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
