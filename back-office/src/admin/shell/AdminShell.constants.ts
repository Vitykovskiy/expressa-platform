import type { AdminShellSection } from "./AdminShell.types";

export const ADMIN_SHELL_SECTIONS: AdminShellSection[] = [
  { id: "orders", label: "Заказы", roles: ["barista", "administrator"] },
  {
    id: "availability",
    label: "Доступность",
    roles: ["barista", "administrator"],
  },
  { id: "menu", label: "Меню", roles: ["administrator"] },
  { id: "users", label: "Пользователи", roles: ["administrator"] },
  { id: "settings", label: "Настройки", roles: ["administrator"] },
];
