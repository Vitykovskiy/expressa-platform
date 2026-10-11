import type { CurrentUserDto, SessionUser } from "./session.types";

export function mapUser(dto: CurrentUserDto): SessionUser {
  return { id: dto.id, phone: dto.phoneE164, role: dto.role };
}
