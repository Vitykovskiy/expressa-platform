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
