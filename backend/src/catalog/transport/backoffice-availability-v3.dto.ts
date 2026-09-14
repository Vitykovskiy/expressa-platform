import { ApiProperty } from "@nestjs/swagger";
export class V3AvailabilityDto {
  @ApiProperty() isAvailable!: boolean;
}
