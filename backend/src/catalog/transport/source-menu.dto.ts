import { ApiProperty } from "@nestjs/swagger";
import { AdminV3CategoryDto } from "./admin-catalog-v3.dto";

export class SourceNameDto {
  @ApiProperty({ minLength: 1 }) name!: string;
}
export class SourceCategoryCreateDto extends SourceNameDto {
  @ApiProperty({ type: String, format: "uuid", nullable: true })
  optionGroupId!: string | null;
}
export class SourceCategoryUpdateDto extends SourceNameDto {
  @ApiProperty({
    type: String,
    format: "uuid",
    nullable: true,
    required: false,
  })
  optionGroupId?: string | null;
}
export class SourceCategoryResponseDto {
  @ApiProperty({ type: () => AdminV3CategoryDto })
  category!: AdminV3CategoryDto;
  @ApiProperty({ type: String, format: "uuid", isArray: true })
  modifierGroupIds!: string[];
}
export class SourceOptionDto extends SourceNameDto {
  @ApiProperty({ type: "integer", minimum: 0, maximum: 2_147_483_647 })
  priceDelta!: number;
}
export class SourcePriceChoiceDto {
  @ApiProperty({ type: String, format: "uuid", required: false }) id?: string;
  @ApiProperty({ minLength: 1 }) portionLabel!: string;
  @ApiProperty({ type: "integer", minimum: 0, maximum: 2_147_483_647 })
  price!: number;
}
export class SourceProductDto extends SourceNameDto {
  @ApiProperty({ format: "uuid" }) categoryId!: string;
  @ApiProperty({
    type: "integer",
    nullable: true,
    minimum: 0,
    maximum: 2_147_483_647,
  })
  price!: number | null;
  @ApiProperty({
    type: () => SourcePriceChoiceDto,
    isArray: true,
    description:
      "Empty for fixed pricing; one or more real choices when price is null.",
  })
  priceChoices!: SourcePriceChoiceDto[];
}
