import type { RegisteredAuthUser } from "../application/customer-registration.repository.types";
import type { CurrentUserDto } from "./auth.dto";

/** Опубликованный v2 role — только проекция ответа; права определяются контекстом и участиями. */
export function toCurrentUserDto(user: RegisteredAuthUser): CurrentUserDto {
  return {
    ...user,
    customer:
      user.customer === null
        ? null
        : { registeredAt: user.customer.registeredAt.toISOString() },
    role:
      user.context === "staff" && user.employee?.accessEnabled
        ? user.employee.role
        : "customer",
  };
}
