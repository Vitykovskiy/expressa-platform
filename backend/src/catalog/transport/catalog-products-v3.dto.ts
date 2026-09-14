import { ApiProperty } from "@nestjs/swagger";

export class V3PriceChoiceDto {
  @ApiProperty({ required: false, format: "uuid" }) id?: string;
  @ApiProperty() portionLabel!: string;
  @ApiProperty({ minimum: 0, maximum: 2_147_483_647, type: "integer" })
  price!: number;
  @ApiProperty({ minimum: 0, maximum: 2_147_483_647, type: "integer" })
  sortOrder!: number;
  @ApiProperty() isAvailable!: boolean;
}

export class V3ProductDto {
  @ApiProperty({ format: "uuid" }) categoryId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty({
    nullable: true,
    minimum: 0,
    maximum: 2_147_483_647,
    type: "integer",
  })
  price!: number | null;
  @ApiProperty({ nullable: true, type: String }) portionLabel!: string | null;
  @ApiProperty({ type: () => V3PriceChoiceDto, isArray: true })
  priceChoices!: V3PriceChoiceDto[];
  @ApiProperty({ minimum: 0, maximum: 2_147_483_647, type: "integer" })
  sortOrder!: number;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() isAvailable!: boolean;
}

export class V3ProductResponseDto extends V3ProductDto {
  @ApiProperty({ format: "uuid" }) id!: string;
}

export class V3ReorderProductsDto {
  @ApiProperty({ format: "uuid" }) categoryId!: string;
  @ApiProperty({ type: "string", format: "uuid", isArray: true })
  productIds!: string[];
}
