import { ApiProperty } from "@nestjs/swagger";
import { AdminCatalogDto } from "./admin-catalog.dto";
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
export class AvailabilityResponseDto extends AdminCatalogDto {
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
  @ApiProperty({ enum: ["product", "variant", "modifier"] }) type!:
    "product" | "variant" | "modifier";
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() isAvailable!: boolean;
}
