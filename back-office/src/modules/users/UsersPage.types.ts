import type { UsersTab } from "./users.types";
import type {
  CreateUserInput,
  EmployeePresentation,
  CustomerPresentation,
  UserRole,
  UsersDialog,
  UsersFilter,
  UserDialogPhase,
} from "./components/Users.types";

export interface UsersPageProps {
  readonly tab: UsersTab;
  readonly customers: readonly CustomerPresentation[];
  readonly employees: readonly EmployeePresentation[];
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
  "update:tab": [value: UsersTab];
  "update:query": [value: string];
  "update:filter": [value: UsersFilter];
  create: [input: CreateUserInput];
  openCreate: [];
  openRole: [user: EmployeePresentation];
  openAccess: [user: EmployeePresentation];
  closeDialog: [];
  assignRole: [id: string, role: UserRole];
  setWorkAccess: [id: string, enabled: boolean];
  retry: [];
  updateDraft: [input: CreateUserInput];
  selectRole: [role: UserRole];
  inspect: [];
  resumeCommand: [];
}
