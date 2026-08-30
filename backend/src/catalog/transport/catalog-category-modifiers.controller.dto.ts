import { ApiProperty } from "@nestjs/swagger";
import type { CategoryModifierGroupDto } from "./catalog-category-modifiers.controller.dto.types";

export class ReplaceCategoryModifierGroupsDto {
  @ApiProperty({
    type: "string",
    format: "uuid",
    isArray: true,
    uniqueItems: true,
  })
  groupIds!: string[];
}

export class CategoryModifierGroupResponseDto implements CategoryModifierGroupDto {
  @ApiProperty({ format: "uuid" }) categoryId!: string;
  @ApiProperty({ format: "uuid" }) groupId!: string;
  @ApiProperty({ format: "int32", type: "integer" }) sortOrder!: number;
}
