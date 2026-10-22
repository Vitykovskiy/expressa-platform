import { ApiProperty } from "@nestjs/swagger";
import type {
  PickupSlotDto,
  OrderRejectionDto,
} from "./order-metadata.dto.types";

export class PickupSlotResponseDto implements PickupSlotDto {
  @ApiProperty({ format: "date-time" }) startsAt!: string;
  @ApiProperty({ format: "date-time" }) endsAt!: string;
}
export class OrderRejectionResponseDto implements OrderRejectionDto {
  @ApiProperty() reason!: string;
  @ApiProperty({ format: "date-time" }) at!: string;
  @ApiProperty({ format: "uuid" }) actorId!: string;
}
