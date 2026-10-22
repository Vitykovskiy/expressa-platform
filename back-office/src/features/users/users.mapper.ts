import type {
  StaffUser,
  StaffUsersQuery,
} from "../../entities/users/users.types";
import type { UserPresentation, UsersFilter } from "./presentation/Users.types";

function userInitials(name: string | null): string {
  if (name === null) {
    return "—";
  }

  const words = name.trim().split(/\s+/);
  const first = words.at(0);
  const last = words.at(-1);

  if (first === undefined || last === undefined || first === "") {
    throw new TypeError("Invalid user name model");
  }

  const initials =
    words.length === 1
      ? Array.from(first).slice(0, 2).join("")
      : Array.from(first).slice(0, 1).join("") +
        Array.from(last).slice(0, 1).join("");

  return initials.toLocaleUpperCase("ru-RU");
}

export function presentStaffUser(
  user: StaffUser,
  identityId: string,
): UserPresentation {
  const name = user.name === null ? "Без имени" : user.name;
  const phone = `${user.phone.slice(0, 2)} ${user.phone.slice(2, 5)} ${user.phone.slice(5, 8)}-${user.phone.slice(8, 10)}-${user.phone.slice(10)}`;

  return {
    id: user.id,
    name,
    initials: userInitials(user.name),
    phone,
    role: user.role === "customer" ? null : user.role,
    blocked: user.blocked,
    canChangeRole: user.id !== identityId,
    canChangeAccess: user.id !== identityId,
  };
}

export function usersQuery(
  search: string,
  filter: UsersFilter,
): StaffUsersQuery {
  const trimmed = search.trim();
  const normalized = /^[+\d\s()-]+$/.test(trimmed)
    ? trimmed.replace(/\D/g, "")
    : trimmed;

  if (filter === "barista") {
    return { search: normalized, role: "barista" };
  }

  if (filter === "unassigned") {
    return { search: normalized, role: "customer" };
  }

  return filter === "blocked"
    ? { search: normalized, blocked: true }
    : { search: normalized };
}
