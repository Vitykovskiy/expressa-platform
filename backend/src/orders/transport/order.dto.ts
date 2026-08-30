import { ApiProperty } from "@nestjs/swagger";
import type {
  CustomerOrderDto,
  CustomerOrdersPageDto,
  OrderItemDto,
  OrderModifierDto,
  OrderStageDto,
} from "./order.dto.types";

export class OrderModifierResponseDto implements OrderModifierDto {
  @ApiProperty({ format: "uuid" })
  modifierOptionId!: string;

  @ApiProperty()
  modifierName!: string;

  @ApiProperty({ format: "int32", minimum: 0, type: "integer" })
  priceDelta!: number;
}

export class OrderItemResponseDto implements OrderItemDto {
  @ApiProperty({ format: "uuid" })
  productId!: string;

  @ApiProperty({ type: "string", format: "uuid", nullable: true })
  variantId!: string | null;

  @ApiProperty()
  productName!: string;

  @ApiProperty({ enum: ["S", "M", "L"], nullable: true })
  size!: "S" | "M" | "L" | null;

  @ApiProperty({ format: "int32", type: "integer" })
  quantity!: number;

  @ApiProperty({ format: "int32", minimum: 0, type: "integer" })
  unitTotal!: number;

  @ApiProperty({ format: "int32", minimum: 0, type: "integer" })
  lineTotal!: number;

  @ApiProperty({ isArray: true, type: () => OrderModifierResponseDto })
  modifiers!: OrderModifierResponseDto[];
}

export class OrderDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "20300102-001" })
  number!: string;

  @ApiProperty({ enum: ["CREATED"] })
  stage!: OrderStageDto;

  @ApiProperty({ format: "int32", minimum: 0, type: "integer" })
  total!: number;

  @ApiProperty({ isArray: true, type: () => OrderItemResponseDto })
  items!: OrderItemResponseDto[];
}

export class CustomerOrderResponseDto implements CustomerOrderDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "20300102-001" })
  number!: string;

  @ApiProperty({ format: "date-time" })
  createdAt!: string;

  @ApiProperty({
    enum: ["CREATED", "ACCEPTED", "PREPARING", "READY", "ISSUED"],
  })
  stage!: OrderStageDto;

  @ApiProperty({ format: "int32", minimum: 0, type: "integer" })
  total!: number;

  @ApiProperty({ isArray: true, type: () => OrderItemResponseDto })
  snapshot!: OrderItemDto[];
}

export class CustomerOrdersPageResponseDto implements CustomerOrdersPageDto {
  @ApiProperty({ isArray: true, type: () => CustomerOrderResponseDto })
  orders!: CustomerOrderDto[];

  @ApiProperty({ nullable: true, type: "string" })
  nextCursor!: string | null;
}
