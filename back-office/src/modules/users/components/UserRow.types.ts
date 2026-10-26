import type { UserPresentation } from "./Users.types";

export interface UserRowProps {
  readonly user: UserPresentation;
}

export interface UserRowEmits {
  role: [user: UserPresentation];
  access: [user: UserPresentation];
}
