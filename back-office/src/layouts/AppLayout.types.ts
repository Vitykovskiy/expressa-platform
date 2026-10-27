import type { AppSection, AppNavigationItem } from "./AppNavigation.types";

export interface AppLayoutProps {
  readonly administrator: boolean;
  readonly section: AppSection | null;
  readonly navigation: readonly AppNavigationItem[];
  readonly notificationOrder: string | null;
  readonly notificationMessage: string;
  readonly navigationBusy: boolean;
}

export interface AppLayoutEmits {
  logout: [];
  showNotifications: [];
  openNotification: [];
}

export interface AppLayoutSlots {
  default(): unknown;
}
