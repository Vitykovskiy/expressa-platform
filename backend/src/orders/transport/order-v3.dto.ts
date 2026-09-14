import { ApiProperty } from "@nestjs/swagger";
import type {
  CustomerOrderV3Dto,
  CustomerOrdersV3PageDto,
  OrderV3Dto,
  OrderV3ItemDto,
  OrderV3ModifierDto,
} from "./order-v3.dto.types";

export class OrderV3ModifierResponseDto implements OrderV3ModifierDto {
  @ApiProperty() modifierOptionId!: string;
  @ApiProperty() modifierName!: string;
  @ApiProperty() priceDelta!: number;
}
export class OrderV3ItemResponseDto implements OrderV3ItemDto {
  @ApiProperty() productId!: string;
  @ApiProperty({ nullable: true, type: String }) priceChoiceId!: string | null;
  @ApiProperty() productName!: string;
  @ApiProperty({ nullable: true, type: String }) portionLabel!: string | null;
  @ApiProperty() quantity!: number;
  @ApiProperty() unitTotal!: number;
  @ApiProperty() lineTotal!: number;
  @ApiProperty({ isArray: true, type: () => OrderV3ModifierResponseDto })
  modifiers!: OrderV3ModifierDto[];
}
export class OrderV3ResponseDto implements OrderV3Dto {
  @ApiProperty() id!: string;
  @ApiProperty() number!: string;
  @ApiProperty() stage!: string;
  @ApiProperty() total!: number;
  @ApiProperty({ isArray: true, type: () => OrderV3ItemResponseDto })
  items!: OrderV3ItemDto[];
}
export class CustomerOrderV3ResponseDto
  extends OrderV3ResponseDto
  implements CustomerOrderV3Dto
{
  @ApiProperty() createdAt!: string;
}
export class CustomerOrdersV3PageResponseDto implements CustomerOrdersV3PageDto {
  @ApiProperty({ isArray: true, type: () => CustomerOrderV3ResponseDto })
  orders!: CustomerOrderV3Dto[];
  @ApiProperty({ nullable: true, type: String }) nextCursor!: string | null;
}
