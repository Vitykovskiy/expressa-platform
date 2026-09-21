import { ApiProperty } from "@nestjs/swagger";
import type {
  AvailabilityUpdateDto,
  ServiceIntakeDto,
} from "./backoffice-availability.dto.types";

export class AvailabilityUpdateRequestDto {
  @ApiProperty() isAvailable!: boolean;
}
export class ServiceIntakeRequestDto {
  @ApiProperty() acceptsNewOrders!: boolean;
}
export class ServiceIntakeResponseDto implements ServiceIntakeDto {
  @ApiProperty() acceptsNewOrders!: boolean;
  @ApiProperty({ type: String, format: "uuid", nullable: true }) updatedBy!:
    string | null;
  @ApiProperty({
    type: String,
    nullable: true,
    pattern: "^\\+[1-9]\\d{1,14}$",
    example: "+79991234567",
  })
  updatedByLabel!: string | null;
  @ApiProperty({ type: String, format: "date-time", nullable: true })
  updatedAt!: Date | null;
}

export class AvailabilityPriceChoiceResponseDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({ format: "uuid" }) productId!: string;
  @ApiProperty() portionLabel!: string;
  @ApiProperty({ format: "int32", minimum: 0, type: "integer" })
  price!: number;
  @ApiProperty({ format: "int32", minimum: 0, type: "integer" })
  sortOrder!: number;
  @ApiProperty() isAvailable!: boolean;
}

export class AvailabilityProductModifierGroupResponseDto {
  @ApiProperty({ format: "uuid" }) productId!: string;
  @ApiProperty({ format: "uuid" }) groupId!: string;
  @ApiProperty({ format: "int32", minimum: 0, type: "integer" })
  sortOrder!: number;
}
export class AvailabilityCategoryResponseDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ format: "int32", minimum: 0, type: "integer" })
  sortOrder!: number;
  @ApiProperty() isActive!: boolean;
}
export class AvailabilityProductResponseDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({ format: "uuid" }) categoryId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ nullable: true, minimum: 0, type: "integer" }) price!:
    number | null;
  @ApiProperty({ minimum: 0, type: "integer" }) sortOrder!: number;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() isAvailable!: boolean;
}
export class AvailabilityModifierGroupResponseDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: ["single", "multiple"] }) selectionType!:
    "single" | "multiple";
  @ApiProperty({ minimum: 0, type: "integer" }) minSelect!: number;
  @ApiProperty({ minimum: 0, type: "integer" }) maxSelect!: number;
  @ApiProperty() isActive!: boolean;
}
export class AvailabilityModifierOptionResponseDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({ format: "uuid" }) groupId!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ type: "integer" }) priceDelta!: number;
  @ApiProperty({ minimum: 0, type: "integer" }) sortOrder!: number;
  @ApiProperty() isDefault!: boolean;
  @ApiProperty() isAvailable!: boolean;
}
export class AvailabilityCategoryModifierGroupResponseDto {
  @ApiProperty({ format: "uuid" }) categoryId!: string;
  @ApiProperty({ format: "uuid" }) groupId!: string;
  @ApiProperty({ minimum: 0, type: "integer" }) sortOrder!: number;
}
export class AvailabilityResponseDto {
  @ApiProperty({ isArray: true, type: () => AvailabilityCategoryResponseDto })
  categories!: AvailabilityCategoryResponseDto[];
  @ApiProperty({ isArray: true, type: () => AvailabilityProductResponseDto })
  products!: AvailabilityProductResponseDto[];
  @ApiProperty({
    isArray: true,
    type: () => AvailabilityModifierGroupResponseDto,
  })
  modifierGroups!: AvailabilityModifierGroupResponseDto[];
  @ApiProperty({
    isArray: true,
    type: () => AvailabilityModifierOptionResponseDto,
  })
  modifierOptions!: AvailabilityModifierOptionResponseDto[];
  @ApiProperty({
    isArray: true,
    type: () => AvailabilityCategoryModifierGroupResponseDto,
  })
  categoryModifierGroups!: AvailabilityCategoryModifierGroupResponseDto[];
  @ApiProperty({
    isArray: true,
    type: () => AvailabilityPriceChoiceResponseDto,
  })
  priceChoices!: AvailabilityPriceChoiceResponseDto[];
  @ApiProperty({
    isArray: true,
    type: () => AvailabilityProductModifierGroupResponseDto,
  })
  productModifierGroups!: AvailabilityProductModifierGroupResponseDto[];
  @ApiProperty({ type: () => ServiceIntakeResponseDto })
  intake!: ServiceIntakeResponseDto;
}
export class AvailabilityUpdateResponseDto implements AvailabilityUpdateDto {
  @ApiProperty({ enum: ["product", "modifier"] }) type!: "product" | "modifier";
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() isAvailable!: boolean;
}
