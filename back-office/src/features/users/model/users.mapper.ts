import type {
  StaffUser,
  StaffUsersQuery,
} from "../../../entities/users/users.types";
import type { UserPresentation, UsersFilter } from "../ui/Users.types";

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
  const phone = formatUserPhone(user.phone);
  const canManageUser = user.id !== identityId;

  return {
    id: user.id,
    name,
    initials: userInitials(user.name),
    phone,
    role: user.role === "customer" ? null : user.role,
    blocked: user.blocked,
    canChangeRole: canManageUser,
    canChangeAccess: canManageUser,
  };
}

export function buildUsersQuery(
  search: string,
  filter: UsersFilter,
): StaffUsersQuery {
  const trimmed = search.trim();
  const normalized = /^[+\d\s()-]+$/.test(trimmed)
    ? trimmed.replace(/\D/g, "")
    : trimmed;

  switch (filter) {
    case "barista":
      return { search: normalized, role: "barista" };
    case "unassigned":
      return { search: normalized, role: "customer" };
    case "blocked":
      return { search: normalized, blocked: true };
    case "all":
      return { search: normalized };
  }
}

function formatUserPhone(phone: string): string {
  const countryCode = phone.slice(0, 2);
  const operatorCode = phone.slice(2, 5);
  const subscriberStart = phone.slice(5, 8);
  const subscriberMiddle = phone.slice(8, 10);
  const subscriberEnd = phone.slice(10);

  return `${countryCode} ${operatorCode} ${subscriberStart}-${subscriberMiddle}-${subscriberEnd}`;
}
