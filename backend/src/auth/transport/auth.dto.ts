import { ApiProperty } from "@nestjs/swagger";

export class RequestOtpDto {
  @ApiProperty({ example: "+79991234567" })
  phone!: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: "+79991234567" })
  phone!: string;

  @ApiProperty({ pattern: "^\\d{6}$" })
  code!: string;
}

export class AccessTokenDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ enum: ["Bearer"] })
  tokenType!: "Bearer";

  @ApiProperty({ example: 900 })
  expiresInSeconds!: number;
}

export class RequestOtpResponseDto {
  @ApiProperty({ example: 300 })
  expiresInSeconds!: number;

  @ApiProperty({ example: 60 })
  retryAfterSeconds!: number;
}

export class CurrentUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  phoneE164!: string;

  @ApiProperty({ enum: ["customer", "barista", "administrator"] })
  role!: string;
}
