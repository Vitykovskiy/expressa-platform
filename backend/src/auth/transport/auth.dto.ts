import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RequestOtpDto {
  @ApiProperty({ example: "+79991234567" })
  phone!: string;
}

export class VerifyOtpDto {
  @ApiPropertyOptional({
    enum: ["customer", "staff"],
    description:
      "Explicit app context. Omission infers enabled staff once under account lock, otherwise customer. Invalid supplied values are rejected.",
  })
  context?: "customer" | "staff";

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

export class CustomerMembershipDto {
  @ApiProperty({ format: "date-time" })
  registeredAt!: string;
}

export class EmployeeMembershipDto {
  @ApiProperty({ enum: ["barista", "administrator"] })
  role!: "barista" | "administrator";

  @ApiProperty()
  accessEnabled!: boolean;
}

export class CurrentUserDto {
  @ApiProperty({ enum: ["customer", "staff"] })
  context!: "customer" | "staff";

  @ApiProperty({ type: () => CustomerMembershipDto, nullable: true })
  customer!: CustomerMembershipDto | null;

  @ApiProperty({ type: () => EmployeeMembershipDto, nullable: true })
  employee!: EmployeeMembershipDto | null;

  @ApiProperty({ type: String, nullable: true })
  name!: string | null;

  @ApiProperty()
  id!: string;

  @ApiProperty()
  phoneE164!: string;

  @ApiProperty({
    enum: ["customer", "barista", "administrator"],
    description:
      "Compatibility projection only; never a stored role, membership or authorization grant. Customer context and denied staff project customer.",
  })
  role!: string;
}
