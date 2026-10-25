export type StaffSection =
  "orders" | "availability" | "catalog" | "users" | "settings";

export interface StaffNavigationProps {
  readonly administrator: boolean;
  readonly section: StaffSection | null;
  readonly links: Readonly<Record<StaffSection, string>>;
}

export interface StaffNavigationItem {
  readonly section: StaffSection;
  readonly administratorOnly: boolean;
  readonly label: string;
  readonly icon: string;
  readonly mobileIcon: string;
  readonly activeIcon: string;
  readonly activeMobileIcon: string;
}

export interface StaffNavigationEmits {
  navigate: [event: globalThis.MouseEvent, href: string];
  logout: [];
}

export interface StaffNavigationSlots {
  selection?(): unknown;
  actions?(): unknown;
}
