import type { User, UserAction } from "../../shared/ui/Admin.types";

export type UserActionMenuAction = UserAction;

export interface UserActionMenuProps {
  user: User;
  availableActions: readonly UserAction[];
}

export interface UserActionMenuEmits {
  select: [action: UserAction];
}
