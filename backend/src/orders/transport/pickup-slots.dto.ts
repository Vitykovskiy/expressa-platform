import { ApiProperty } from "@nestjs/swagger";

export class CustomerPickupSlotDto {
  @ApiProperty({ format: "date-time" }) startsAt!: string;
  @ApiProperty({ format: "date-time" }) endsAt!: string;
  @ApiProperty() available!: boolean;
}

export class CustomerPickupSlotsDto {
  @ApiProperty({ format: "date" }) serviceDay!: string;
  @ApiProperty({ enum: ["UTC"] }) timeZone!: "UTC";
  @ApiProperty({ enum: [10] }) slotMinutes!: 10;
  @ApiProperty() acceptsNewOrders!: boolean;
  @ApiProperty({ type: () => CustomerPickupSlotDto, isArray: true })
  slots!: CustomerPickupSlotDto[];
}
