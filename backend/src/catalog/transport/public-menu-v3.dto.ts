import { ApiProperty } from "@nestjs/swagger";
import { modifierSelectionTypes } from "../domain/catalog.constants";
import type { CatalogModifierSelectionType } from "../domain/catalog.types";

export class PublicMenuOptionDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ format: "int32", minimum: 0, type: "integer" })
  priceDelta!: number;
  @ApiProperty() isDefault!: boolean;
  @ApiProperty() isAvailable!: boolean;
}

export class PublicMenuModifierGroupDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: modifierSelectionTypes })
  selectionType!: CatalogModifierSelectionType;
  @ApiProperty({ format: "int32", type: "integer" }) minSelect!: number;
  @ApiProperty({ format: "int32", type: "integer" }) maxSelect!: number;
  @ApiProperty({ isArray: true, type: () => PublicMenuOptionDto })
  options!: PublicMenuOptionDto[];
}

export class PublicMenuV3PriceChoiceDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() portionLabel!: string;
  @ApiProperty({ format: "int32", minimum: 0, type: "integer" }) price!: number;
  @ApiProperty() isAvailable!: boolean;
}

export class PublicMenuV3ProductDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ format: "int32", minimum: 0, nullable: true, type: "integer" })
  price!: number | null;
  @ApiProperty({ nullable: true, type: String }) portionLabel!: string | null;
  @ApiProperty() isAvailable!: boolean;
  @ApiProperty({ isArray: true, type: () => PublicMenuV3PriceChoiceDto })
  priceChoices!: PublicMenuV3PriceChoiceDto[];
  @ApiProperty({ isArray: true, type: () => PublicMenuModifierGroupDto })
  modifierGroups!: PublicMenuModifierGroupDto[];
}

export class PublicMenuV3CategoryDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ isArray: true, type: () => PublicMenuV3ProductDto })
  products!: PublicMenuV3ProductDto[];
}

export class PublicMenuV3Dto {
  @ApiProperty() acceptsNewOrders!: boolean;
  @ApiProperty({ isArray: true, type: () => PublicMenuV3CategoryDto })
  categories!: PublicMenuV3CategoryDto[];
}
