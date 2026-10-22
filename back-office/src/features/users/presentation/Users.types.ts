export type UserRole = "barista" | "administrator";
export type UsersFilter = "all" | "barista" | "unassigned" | "blocked";

export interface UserPresentation {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly initials: string;
  readonly role: UserRole | null;
  readonly blocked: boolean;
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
      readonly user: UserPresentation;
      readonly selectedRole: UserRole | null;
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
  readonly user: UserPresentation;
  readonly selectedRole: UserRole | null;
  readonly phase: UserDialogPhase;
  readonly error: string | null;
}

export interface UserAccessDialogEmits {
  close: [];
  assignRole: [id: string, role: UserRole];
  setBlocked: [id: string, blocked: boolean];
  selectRole: [role: UserRole];
  inspect: [];
}
