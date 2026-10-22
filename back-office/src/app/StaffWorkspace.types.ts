import type { StaffSession } from "../entities/session/session.types";
import type { SectionIntent } from "./navigation.types";

export interface StaffWorkspaceProps {
  readonly session: StaffSession;
  readonly intent: SectionIntent;
  readonly search: string;
  readonly notificationOrder: string | null;
  readonly notificationMessage: string;
  readonly navigationBusy: boolean;
}
