import type { UserPresentation } from "../../features/users/ui/Users.types";

export interface UserRowProps {
  readonly user: UserPresentation;
}

export interface UserRowEmits {
  role: [user: UserPresentation];
  access: [user: UserPresentation];
}
