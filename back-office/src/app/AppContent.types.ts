import type { StaffSession } from "../modules/session/session.types";
import type { SectionIntent } from "./navigation.types";

export interface AppContentProps {
  readonly session: StaffSession;
  readonly intent: SectionIntent;
  readonly search: string;
  readonly locationHref: string;
  readonly notificationOrder: string | null;
  readonly notificationMessage: string;
  readonly navigationBusy: boolean;
}

export interface AppContentEmits {
  logout: [];
  sessionExpired: [];
  navigate: [href: string];
  openNotification: [];
}
