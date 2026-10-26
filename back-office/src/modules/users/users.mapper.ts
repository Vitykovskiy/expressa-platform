import type { StaffUser, StaffUserDto } from "./users.types";

export function mapStaffUser(dto: StaffUserDto): StaffUser {
  return {
    id: dto.id,
    name: dto.name,
    phone: dto.phoneE164,
    role: dto.role,
    blocked: dto.blocked,
  };
}
