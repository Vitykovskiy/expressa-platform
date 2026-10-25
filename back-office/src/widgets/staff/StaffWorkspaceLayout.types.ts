import type { StaffSection } from "./StaffNavigation.types";

export interface StaffWorkspaceLayoutProps {
  readonly administrator: boolean;
  readonly section: StaffSection | null;
  readonly links: Readonly<Record<StaffSection, string>>;
  readonly notificationOrder: string | null;
  readonly notificationMessage: string;
  readonly navigationBusy: boolean;
}

export interface StaffWorkspaceLayoutEmits {
  navigate: [event: globalThis.MouseEvent, href: string];
  logout: [];
  showNotifications: [];
  openNotification: [];
}

export interface StaffWorkspaceLayoutSlots {
  default(): unknown;
}
