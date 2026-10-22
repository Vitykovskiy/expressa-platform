import type {
  CreateUserInput,
  UserPresentation,
  UserRole,
  UsersDialog,
  UsersFilter,
  UserDialogPhase,
} from "../../features/users/presentation/Users.types";

export interface UsersPageProps {
  readonly users: readonly UserPresentation[];
  readonly query: string;
  readonly filter: UsersFilter;
  readonly loading: boolean;
  readonly error: string | null;
  readonly dialog: UsersDialog | null;
  readonly commandPhase: UserDialogPhase;
  readonly commandError: string | null;
  readonly notice: string | null;
  readonly needsInspection: boolean;
}

export interface UsersPageEmits {
  "update:query": [value: string];
  "update:filter": [value: UsersFilter];
  create: [input: CreateUserInput];
  openCreate: [];
  openRole: [user: UserPresentation];
  openAccess: [user: UserPresentation];
  closeDialog: [];
  assignRole: [id: string, role: UserRole];
  setBlocked: [id: string, blocked: boolean];
  retry: [];
  updateDraft: [input: CreateUserInput];
  selectRole: [role: UserRole];
  inspect: [];
  resumeCommand: [];
}
