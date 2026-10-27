import {
  CustomerMembershipDto,
  EmployeeMembershipDto,
} from "../../auth/transport/auth.dto";
import { ApiProperty } from "@nestjs/swagger";
import type { UserRole } from "../../auth/domain/auth.types";
import { userRoles } from "../../auth/domain/auth.constants";

export class StaffUserDto {
  @ApiProperty({ type: () => CustomerMembershipDto, nullable: true })
  customer!: CustomerMembershipDto | null;

  @ApiProperty({ type: () => EmployeeMembershipDto, nullable: true })
  employee!: EmployeeMembershipDto | null;

  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ type: String, nullable: true })
  name!: string | null;

  @ApiProperty({ pattern: "^\\+7[0-9]{10}$" })
  phoneE164!: string;

  @ApiProperty({
    enum: userRoles,
    description:
      "Compatibility account projection: enabled employee role, otherwise customer; not authorization evidence.",
  })
  role!: UserRole;

  @ApiProperty()
  blocked!: boolean;

  @ApiProperty({ format: "date-time" })
  createdAt!: string;

  @ApiProperty({ format: "date-time" })
  updatedAt!: string;
}

export class StaffUsersResponseDto {
  @ApiProperty({ type: () => StaffUserDto, isArray: true })
  users!: StaffUserDto[];
}

export class CreateStaffUserDto {
  @ApiProperty({ minLength: 1 })
  name!: string;

  @ApiProperty({ pattern: "^\\+7[0-9]{10}$" })
  phoneE164!: string;

  @ApiProperty({ enum: userRoles })
  role!: UserRole;
}

export class ChangeStaffUserRoleDto {
  @ApiProperty({ enum: userRoles })
  role!: UserRole;
}

export class ChangeStaffUserBlockDto {
  @ApiProperty()
  blocked!: boolean;
}
