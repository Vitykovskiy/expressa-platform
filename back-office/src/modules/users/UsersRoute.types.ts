import type { StaffSession } from "../session/session.types";

export interface UsersRouteProps {
  readonly session: StaffSession;
}

export interface UsersRouteEmits {
  sessionExpired: [];
}
