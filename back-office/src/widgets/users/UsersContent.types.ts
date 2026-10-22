import type {
  UserPresentation,
  UsersFilter,
} from "../../features/users/presentation/Users.types";

export interface UsersContentProps {
  readonly users: readonly UserPresentation[];
  readonly query: string;
  readonly filter: UsersFilter;
  readonly loading: boolean;
  readonly error: string | null;
}

export interface UsersContentEmits {
  "update:query": [value: string];
  "update:filter": [value: UsersFilter];
  create: [];
  role: [user: UserPresentation];
  access: [user: UserPresentation];
  retry: [];
}
