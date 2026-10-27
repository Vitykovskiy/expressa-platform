export type UserRole = "barista" | "administrator";
export type UsersFilter = "all" | "barista" | "administrator" | "blocked";

export interface EmployeePresentation {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly initials: string;
  readonly role: UserRole;
  readonly workUnavailable: boolean;
  readonly accountBlocked: boolean;
  readonly canChangeRole: boolean;
  readonly canChangeAccess: boolean;
}

export interface CreateUserInput {
  name: string;
  phone: string;
  role: UserRole;
}

export type UsersDialog =
  | { readonly kind: "create"; readonly draft: Readonly<CreateUserInput> }
  | {
      readonly kind: "role" | "block" | "unblock";
      readonly user: EmployeePresentation;
      readonly selectedRole: UserRole;
    };

export type UserDialogPhase =
  "editing" | "sending" | "unknown" | "checking" | "checked";

export interface AddUserDialogProps {
  readonly draft: Readonly<CreateUserInput>;
  readonly phase: UserDialogPhase;
  readonly error: string | null;
}

export interface AddUserDialogEmits {
  close: [];
  submit: [input: CreateUserInput];
  updateDraft: [input: CreateUserInput];
  inspect: [];
}

export interface UserAccessDialogProps {
  readonly kind: "role" | "block" | "unblock";
  readonly user: EmployeePresentation;
  readonly selectedRole: UserRole;
  readonly phase: UserDialogPhase;
  readonly error: string | null;
}

export interface UserAccessDialogEmits {
  close: [];
  assignRole: [id: string, role: UserRole];
  setWorkAccess: [id: string, enabled: boolean];
  selectRole: [role: UserRole];
  inspect: [];
}

export interface CustomerPresentation {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly initials: string;
}
