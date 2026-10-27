import type { StaffSession } from "../modules/session/session.types";

export interface AppContentProps {
  readonly session: StaffSession;
  readonly notificationOrder: string | null;
  readonly notificationMessage: string;
  readonly navigationBusy: boolean;
}

export interface AppContentEmits {
  logout: [];
  sessionExpired: [];
  openNotification: [];
}
