import type {
  User,
  UserAction,
  UserRole,
} from "../../../shared/ui/admin/Admin.types";

export interface RolePresentation {
  label: string;
  className: string;
}

export interface StatusPresentation {
  label: string;
  className: string;
}

export interface UserRowProps {
  user: User;
}

export interface UserRowEmits {
  action: [action: UserAction];
}

export type UserRolePresentation = Record<UserRole, RolePresentation>;
