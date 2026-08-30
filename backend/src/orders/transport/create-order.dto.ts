import { ApiProperty } from "@nestjs/swagger";
import {
  maximumOrderItemQuantity,
  minimumOrderItemQuantity,
} from "../domain/order.constants";
import { maximumOrderTotal } from "./orders.controller.constants";
import type { CreateOrderItem } from "./create-order.dto.types";

export class CreateOrderItemDto implements CreateOrderItem {
  @ApiProperty({ format: "uuid" })
  productId!: string;

  @ApiProperty({ type: "string", format: "uuid", nullable: true })
  variantId!: string | null;

  @ApiProperty({
    type: "string",
    format: "uuid",
    isArray: true,
    uniqueItems: true,
  })
  modifierOptionIds!: string[];

  @ApiProperty({
    format: "int32",
    minimum: minimumOrderItemQuantity,
    maximum: maximumOrderItemQuantity,
    type: "integer",
  })
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty({
    format: "int32",
    minimum: 0,
    maximum: maximumOrderTotal,
    type: "integer",
  })
  expectedTotal!: number;

  @ApiProperty({ isArray: true, type: () => CreateOrderItemDto, minItems: 1 })
  items!: CreateOrderItemDto[];
}
