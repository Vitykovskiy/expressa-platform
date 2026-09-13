import { ApiProperty } from "@nestjs/swagger";

export class PushSubscriptionKeysDto {
  @ApiProperty() p256dh!: string;
  @ApiProperty() auth!: string;
}

export class PushSubscriptionDto {
  @ApiProperty({ format: "uri" }) endpoint!: string;
  @ApiProperty({ type: () => PushSubscriptionKeysDto })
  keys!: PushSubscriptionKeysDto;
}

export class PushPublicKeyDto {
  @ApiProperty() publicKey!: string;
}

export class PushAssociationRequestDto {
  @ApiProperty({ type: () => PushSubscriptionDto })
  subscription!: PushSubscriptionDto;
  @ApiProperty({ enum: ["enable", "transfer"] })
  action!: "enable" | "transfer";
  @ApiProperty({ type: String, format: "uuid", nullable: true })
  expectedVersion!: string | null;
}

export class PushAssociationResponseDto {
  @ApiProperty({ enum: ["current"] }) association!: "current";
  @ApiProperty({ type: String, format: "uuid" }) version!: string;
}

export class PushSubscriptionInspectionDto {
  @ApiProperty({ enum: ["none", "current", "other"] })
  association!: "none" | "current" | "other";
  @ApiProperty({ type: String, format: "uuid", nullable: true })
  version!: string | null;
}

export class PushAssociationDeleteRequestDto {
  @ApiProperty({ type: () => PushSubscriptionDto })
  subscription!: PushSubscriptionDto;
  @ApiProperty({ type: String, format: "uuid" }) expectedVersion!: string;
}
