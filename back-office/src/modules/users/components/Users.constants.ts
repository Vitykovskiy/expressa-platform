import type { UserDialogPhase, UserRole, UsersFilter } from "./Users.types";

export const USER_DIALOG_PHASE_LABELS: Record<
  Exclude<UserDialogPhase, "editing">,
  string
> = {
  sending: "Сохраняем…",
  unknown: "Проверить состояние",
  checking: "Проверяем…",
  checked: "Закрыть",
};

export const USERS_FILTERS: readonly { id: UsersFilter; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "barista", label: "Баристы" },
  { id: "administrator", label: "Админы" },
  { id: "blocked", label: "Нет доступа" },
];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  barista: "Бариста",
  administrator: "Администратор",
};

export const USER_ROLE_OPTIONS = [
  { value: "barista", label: "Бариста" },
  { value: "administrator", label: "Администратор" },
] as const;

export const USER_CONFIRMATION_TITLES = {
  role: "Изменить роль",
  block: "Заблокировать",
  unblock: "Разблокировать",
} as const;

export const USER_DIALOG_CONTENT = {
  style: { margin: "0", maxHeight: "calc(100dvh - 32px)" },
};

export const USER_ASSETS = {
  plus: "/users/plus.svg",
  plusMobile: "/users/plus-mobile.svg",
  ellipsis: "/users/ellipsis.svg",
  role: "/users/user-check.svg",
  block: "/users/lock.svg",
  unblock: "/users/unlock.svg",
  close: "/users/close.svg",
  radioEmpty: "/users/radio-empty.svg",
  radioSelected: "/users/radio-selected.svg",
  radioNeutral: "/users/radio-neutral.svg",
  empty: "/users/empty.svg",
} as const;

export const USERS_TABS = [
  { id: "employees", label: "Сотрудники" },
  { id: "customers", label: "Клиенты" },
] as const;
