export type StaffUserRole = "customer" | "barista" | "administrator";

export interface StaffUserDto {
  readonly id: string;
  readonly name: string | null;
  readonly phoneE164: string;
  readonly role: StaffUserRole;
  readonly blocked: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StaffUser {
  readonly id: string;
  readonly name: string | null;
  readonly phone: string;
  readonly role: StaffUserRole;
  readonly blocked: boolean;
}

export interface StaffUsersQuery {
  readonly search: string;
  readonly role?: StaffUserRole;
  readonly blocked?: boolean;
}

export interface UsersContext {
  readonly identityId: string;
  readonly role: StaffUserRole;
  readonly accessToken: string;
}

export type UserCommand =
  | {
      readonly kind: "create";
      readonly name: string;
      readonly phoneE164: string;
      readonly role: StaffUserRole;
    }
  | { readonly kind: "role"; readonly id: string; readonly role: StaffUserRole }
  | { readonly kind: "block"; readonly id: string; readonly blocked: boolean };

export interface UserCommandRequest {
  readonly path: string;
  readonly method: "POST" | "PATCH";
  readonly body:
    | {
        readonly name: string;
        readonly phoneE164: string;
        readonly role: StaffUserRole;
      }
    | { readonly role: StaffUserRole }
    | { readonly blocked: boolean };
  readonly expectedStatus: 200 | 201;
}

export type UsersReadOutcome =
  | { readonly kind: "loaded"; readonly users: readonly StaffUser[] }
  | { readonly kind: "failed" | "session-expired" | "cancelled" };

export type UserCommandOutcome =
  | { readonly kind: "confirmed" }
  | { readonly kind: "rejected"; readonly message: string }
  | { readonly kind: "unknown" | "session-expired" };
