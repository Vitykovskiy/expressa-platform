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
export class AvailabilityResponseDto extends AdminCatalogDto {
  @ApiProperty({ type: () => ServiceIntakeResponseDto })
  intake!: ServiceIntakeResponseDto;
}
export class AvailabilityUpdateResponseDto implements AvailabilityUpdateDto {
  @ApiProperty({ enum: ["product", "variant", "modifier"] }) type!:
    "product" | "variant" | "modifier";
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() isAvailable!: boolean;
}
