import type { EmployeeCommand, Customer } from "./users.types";

export interface UsersMutation {
  readonly command: EmployeeCommand;
  readonly phase: "sending" | "unknown" | "checking" | "checked";
}

export type UsersReadPhase = "idle" | "loading" | "ready" | "error";

export interface CustomerDirectory {
  readonly records: readonly Customer[];
  readonly query: string;
  readonly phase: UsersReadPhase;
  readonly hasSnapshot: boolean;
  readonly error: string | null;
}
