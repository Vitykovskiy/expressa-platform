import type { StaffSession } from "../../entities/session/session.types";
import type { SectionIntent } from "./navigation.types";

export interface StaffScreenProps {
  readonly session: StaffSession;
  readonly intent: SectionIntent;
  readonly search: string;
  readonly locationHref: string;
  readonly notificationOrder: string | null;
  readonly notificationMessage: string;
  readonly navigationBusy: boolean;
}

export interface StaffScreenEmits {
  logout: [];
  sessionExpired: [];
  navigate: [href: string];
  openNotification: [];
}
