import type { StaffSession } from "../../entities/session/session.types";

export interface UsersRouteProps {
  readonly session: StaffSession;
}

export interface UsersRouteEmits {
  sessionExpired: [];
}
