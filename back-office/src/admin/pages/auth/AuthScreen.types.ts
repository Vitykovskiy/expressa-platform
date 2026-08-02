import type { AuthResult } from "../../shared/ui/Admin.types";

export type AuthStep = "phone" | "otp" | "loading" | "denied" | "success";

export type AuthScreenPresentation = Record<
  AuthStep,
  { content: AuthStep; title?: string }
>;

export interface AuthScreenProps {
  login: (phone: string) => AuthResult;
}
