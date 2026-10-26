export type AppSection =
  "orders" | "availability" | "catalog" | "users" | "settings";

export interface AppNavigationProps {
  readonly administrator: boolean;
  readonly section: AppSection | null;
  readonly links: Readonly<Record<AppSection, string>>;
}

export interface AppNavigationItem {
  readonly section: AppSection;
  readonly administratorOnly: boolean;
  readonly label: string;
  readonly icon: string;
  readonly mobileIcon: string;
  readonly activeIcon: string;
  readonly activeMobileIcon: string;
}

export interface AppNavigationEmits {
  navigate: [event: globalThis.MouseEvent, href: string];
  logout: [];
}

export interface AppNavigationSlots {
  selection?(): unknown;
  actions?(): unknown;
}
