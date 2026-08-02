import type { FilterTab } from "../../shared/ui/filter-tabs/FilterTabs.types";
import type { UserFilter } from "./UsersScreen.types";

export const USER_FILTER_ALL: UserFilter = "all";
export const USER_FILTER_BARISTA: UserFilter = "barista";
export const USER_FILTER_NO_ROLE: UserFilter = "no_role";
export const USER_FILTER_BLOCKED: UserFilter = "blocked";
export const USERS_SNACKBAR_TIMEOUT = 4000;

export const USER_FILTER_ITEMS: readonly FilterTab<UserFilter>[] = [
  { value: USER_FILTER_ALL, label: "Все" },
  { value: USER_FILTER_BARISTA, label: "Баристы" },
  { value: USER_FILTER_NO_ROLE, label: "Без роли" },
  { value: USER_FILTER_BLOCKED, label: "Нет доступа" },
];
