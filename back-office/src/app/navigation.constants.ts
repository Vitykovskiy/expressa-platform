import type { NavigationItem } from "./navigation.types";

export const navigationDefinitions = {
  queue: {
    label: "Очередь",
    path: "/queue",
    roles: ["barista", "administrator"],
    section: "orders",
  },
  availability: {
    label: "Доступность",
    path: "/availability",
    roles: ["barista", "administrator"],
    section: "availability",
  },
  menu: {
    label: "Меню",
    path: "/menu",
    roles: ["administrator"],
    section: "menu",
  },
} as const satisfies Record<string, NavigationItem>;
