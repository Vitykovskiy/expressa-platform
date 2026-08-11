import type {
  AddUserData,
  ToggleUserBlockEvent,
  UpdateUserRoleEvent,
  User,
  UserAction,
} from "../../../shared/ui/admin/Admin.types";

export type UserFilter = "all" | "barista" | "no_role" | "blocked";

export interface ActionSelection {
  action: UserAction;
  user: User;
}

export interface UsersScreenProps {
  users: readonly User[];
}

export interface UsersScreenEmits {
  "add-user": [data: AddUserData];
  "update-role": [event: UpdateUserRoleEvent];
  "toggle-block": [event: ToggleUserBlockEvent];
}
