import { ApiProperty } from "@nestjs/swagger";
import type { OperatingSettingsInput } from "../domain/operating-settings.types";
import type { OperatingSettingsResponse } from "./operating-settings.dto.types";

export class OperatingSettingsInputDto implements OperatingSettingsInput {
  @ApiProperty({ pattern: "^([01][0-9]|2[0-3]):[0-5][0-9]$", example: "09:00" })
  opensAt!: string;
  @ApiProperty({ pattern: "^([01][0-9]|2[0-3]):[0-5][0-9]$", example: "20:00" })
  closesAt!: string;
  @ApiProperty({ type: "integer", minimum: 1, maximum: 2147483647 })
  slotCapacity!: number;
}
export class OperatingSettingsResponseDto
  extends OperatingSettingsInputDto
  implements OperatingSettingsResponse
{
  @ApiProperty({ enum: [10], type: "integer" }) slotMinutes!: 10;
  @ApiProperty({ enum: ["UTC"] }) timeZone!: "UTC";
  @ApiProperty({ type: String, format: "date-time", nullable: true })
  updatedAt!: string | null;
}
