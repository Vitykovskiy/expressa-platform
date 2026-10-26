import type { AppSection } from "./AppNavigation.types";

export interface AppLayoutProps {
  readonly administrator: boolean;
  readonly section: AppSection | null;
  readonly links: Readonly<Record<AppSection, string>>;
  readonly notificationOrder: string | null;
  readonly notificationMessage: string;
  readonly navigationBusy: boolean;
}

export interface AppLayoutEmits {
  navigate: [event: globalThis.MouseEvent, href: string];
  logout: [];
  showNotifications: [];
  openNotification: [];
}

export interface AppLayoutSlots {
  default(): unknown;
}
