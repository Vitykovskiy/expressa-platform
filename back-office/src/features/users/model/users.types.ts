import type { UserCommand } from "../../../entities/users/users.types";

export interface UsersMutation {
  readonly command: UserCommand;
  readonly phase: "sending" | "unknown" | "checking" | "checked";
}

export type UsersReadPhase = "idle" | "loading" | "ready" | "error";
