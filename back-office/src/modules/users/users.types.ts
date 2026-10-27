export type EmployeeRole = "barista" | "administrator";

export interface EmployeeDto {
  readonly id: string;
  readonly name: string | null;
  readonly phoneE164: string;
  readonly role: EmployeeRole;
  readonly accessEnabled: boolean;
  readonly accountBlocked: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Employee {
  readonly id: string;
  readonly name: string | null;
  readonly phone: string;
  readonly role: EmployeeRole;
  readonly accessEnabled: boolean;
  readonly accountBlocked: boolean;
}

export interface EmployeesQuery {
  readonly search: string;
  readonly role?: EmployeeRole;
  readonly blocked?: boolean;
}

export interface UsersContext {
  readonly identityId: string;
  readonly role: EmployeeRole;
  readonly accessToken: string;
}

export type EmployeeCommand =
  | {
      readonly kind: "create";
      readonly name: string;
      readonly phoneE164: string;
      readonly role: EmployeeRole;
    }
  | { readonly kind: "role"; readonly id: string; readonly role: EmployeeRole }
  | { readonly kind: "access"; readonly id: string; readonly enabled: boolean };

export interface EmployeeCommandRequest {
  readonly path: string;
  readonly method: "POST" | "PATCH";
  readonly body:
    | {
        readonly name: string;
        readonly phoneE164: string;
        readonly role: EmployeeRole;
      }
    | { readonly role: EmployeeRole }
    | { readonly enabled: boolean };
  readonly expectedStatus: 200 | 201;
}

export type EmployeesReadOutcome =
  | { readonly kind: "loaded"; readonly employees: readonly Employee[] }
  | { readonly kind: "failed" | "session-expired" | "cancelled" };

export type EmployeeCommandOutcome =
  | { readonly kind: "confirmed" }
  | { readonly kind: "rejected"; readonly message: string }
  | { readonly kind: "unknown" | "session-expired" };

export interface CustomerDto {
  readonly id: string;
  readonly name: string;
  readonly phoneE164: string;
  readonly registeredAt: string;
}

export interface Customer {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly registeredAt: string;
}

export type CustomersReadOutcome =
  | { readonly kind: "loaded"; readonly customers: readonly Customer[] }
  | { readonly kind: "failed" | "session-expired" | "cancelled" };

export type UsersTab = "employees" | "customers";
