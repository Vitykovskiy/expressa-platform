import { ApiProperty } from "@nestjs/swagger";
import type {
  CreateOrderV3Body,
  CreateOrderV3Item,
} from "./create-order-v3.dto.types";

export class CreateOrderV3ItemDto implements CreateOrderV3Item {
  @ApiProperty({ format: "uuid" }) productId!: string;
  @ApiProperty({ format: "uuid", required: false }) priceChoiceId?: string;
  @ApiProperty({
    type: "string",
    format: "uuid",
    isArray: true,
    uniqueItems: true,
  })
  modifierOptionIds!: string[];
  @ApiProperty({ minimum: 1, type: "integer" }) quantity!: number;
}

export class CreateOrderV3Dto implements CreateOrderV3Body {
  @ApiProperty({ minimum: 0, type: "integer" }) expectedTotal!: number;
  @ApiProperty({ type: () => CreateOrderV3ItemDto, isArray: true, minItems: 1 })
  items!: CreateOrderV3ItemDto[];
}
