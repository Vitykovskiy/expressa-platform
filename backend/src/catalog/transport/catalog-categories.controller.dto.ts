import { ApiProperty } from "@nestjs/swagger";
import type { CategoryDto } from "./catalog-categories.controller.dto.types";

export class CreateCategoryDto {
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ format: "int32", type: "integer" }) sortOrder!: number;
  @ApiProperty() isActive!: boolean;
}

export class UpdateCategoryDto extends CreateCategoryDto {}

export class ReorderCategoriesDto {
  @ApiProperty({ type: "string", format: "uuid", isArray: true })
  categoryIds!: string[];
}

export class CategoryResponseDto implements CategoryDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ format: "int32", type: "integer" }) sortOrder!: number;
  @ApiProperty() isActive!: boolean;
}
