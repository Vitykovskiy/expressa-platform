import { ApiProperty } from "@nestjs/swagger";
import type { StaffRole } from "../../auth/domain/auth.types";

export class EmployeeDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({ type: String, nullable: true }) name!: string | null;
  @ApiProperty({ pattern: "^\\+7[0-9]{10}$" }) phoneE164!: string;
  @ApiProperty({ enum: ["barista", "administrator"] }) role!: StaffRole;
  @ApiProperty({
    description:
      "Membership access; effective access also requires !accountBlocked.",
  })
  accessEnabled!: boolean;
  @ApiProperty() accountBlocked!: boolean;
  @ApiProperty({ format: "date-time" }) createdAt!: string;
  @ApiProperty({ format: "date-time" }) updatedAt!: string;
}

export class EmployeesResponseDto {
  @ApiProperty({ type: () => EmployeeDto, isArray: true })
  employees!: EmployeeDto[];
}

export class CustomerDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({ minLength: 1 }) name!: string;
  @ApiProperty({ pattern: "^\\+7[0-9]{10}$" }) phoneE164!: string;
  @ApiProperty({ format: "date-time" }) registeredAt!: string;
}

export class CustomersResponseDto {
  @ApiProperty({ type: () => CustomerDto, isArray: true })
  customers!: CustomerDto[];
}

export class EnrollEmployeeDto {
  @ApiProperty({ minLength: 1 }) name!: string;
  @ApiProperty({ pattern: "^\\+7[0-9]{10}$" }) phoneE164!: string;
  @ApiProperty({ enum: ["barista", "administrator"] }) role!: StaffRole;
}

export class ChangeEmployeeRoleDto {
  @ApiProperty({ enum: ["barista", "administrator"] }) role!: StaffRole;
}

export class ChangeEmployeeAccessDto {
  @ApiProperty() enabled!: boolean;
}
