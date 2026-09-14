import { ApiProperty } from "@nestjs/swagger";

export class AdminV3CategoryDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ minimum: 0, type: "integer" }) sortOrder!: number;
  @ApiProperty() isActive!: boolean;
}
export class AdminV3ChoiceDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() portionLabel!: string;
  @ApiProperty({ minimum: 0, type: "integer" }) price!: number;
  @ApiProperty({ minimum: 0, type: "integer" }) sortOrder!: number;
  @ApiProperty() isAvailable!: boolean;
}
export class AdminV3ProductDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({ format: "uuid" }) categoryId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ nullable: true, minimum: 0, type: "integer" }) price!:
    number | null;
  @ApiProperty({ nullable: true, type: String }) portionLabel!: string | null;
  @ApiProperty({ type: () => AdminV3ChoiceDto, isArray: true })
  priceChoices!: AdminV3ChoiceDto[];
  @ApiProperty({ minimum: 0, type: "integer" }) sortOrder!: number;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() isAvailable!: boolean;
}
export class AdminV3ModifierGroupDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: ["single", "multiple"] }) selectionType!:
    "single" | "multiple";
  @ApiProperty({ minimum: 0, type: "integer" }) minSelect!: number;
  @ApiProperty({ minimum: 0, type: "integer" }) maxSelect!: number;
  @ApiProperty() isActive!: boolean;
}
export class AdminV3ModifierOptionDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({ format: "uuid" }) groupId!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ type: "integer" }) priceDelta!: number;
  @ApiProperty({ minimum: 0, type: "integer" }) sortOrder!: number;
  @ApiProperty() isDefault!: boolean;
  @ApiProperty() isAvailable!: boolean;
}
export class AdminV3CategoryModifierGroupDto {
  @ApiProperty({ format: "uuid" }) categoryId!: string;
  @ApiProperty({ format: "uuid" }) groupId!: string;
  @ApiProperty({ minimum: 0, type: "integer" }) sortOrder!: number;
}
export class AdminCatalogV3Dto {
  @ApiProperty({ type: () => AdminV3CategoryDto, isArray: true })
  categories!: AdminV3CategoryDto[];
  @ApiProperty({ type: () => AdminV3ProductDto, isArray: true })
  products!: AdminV3ProductDto[];
  @ApiProperty({ type: () => AdminV3ModifierGroupDto, isArray: true })
  modifierGroups!: AdminV3ModifierGroupDto[];
  @ApiProperty({ type: () => AdminV3ModifierOptionDto, isArray: true })
  modifierOptions!: AdminV3ModifierOptionDto[];
  @ApiProperty({ type: () => AdminV3CategoryModifierGroupDto, isArray: true })
  categoryModifierGroups!: AdminV3CategoryModifierGroupDto[];
}
