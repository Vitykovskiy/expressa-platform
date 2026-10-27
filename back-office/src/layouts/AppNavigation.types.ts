import type { RouteLocationRaw } from "vue-router";

export type AppSection =
  "orders" | "availability" | "catalog" | "users" | "settings";

export interface AppNavigationProps {
  readonly administrator: boolean;
  readonly section: AppSection | null;
  readonly navigation: readonly AppNavigationItem[];
}

export interface AppNavigationIcon {
  readonly section: AppSection;
  readonly icon: string;
  readonly mobileIcon: string;
  readonly activeIcon: string;
  readonly activeMobileIcon: string;
}

export interface AppNavigationItem extends AppNavigationIcon {
  readonly label: string;
  readonly to: RouteLocationRaw;
}

export interface AppNavigationEmits {
  logout: [];
}

export interface AppNavigationSlots {
  selection?(): unknown;
  actions?(): unknown;
}
