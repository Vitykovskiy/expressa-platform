import type { NativePushProof } from "../../shared/browser/web-push.types";

export type LogoutProofSupplier = () => Promise<NativePushProof | null>;
export type UserRole = "customer" | "barista" | "administrator";
export type SessionStatus =
  "restoring" | "anonymous" | "staff" | "denied" | "unavailable";
export interface AccessTokenDto {
  accessToken: string;
  tokenType: "Bearer";
  expiresInSeconds: number;
}
export interface CurrentUserDto {
  id: string;
  phoneE164: string;
  role: UserRole;
}
export interface SessionUser {
  id: string;
  phone: string;
  role: UserRole;
}
export interface OtpMetadataDto {
  expiresInSeconds: number;
  retryAfterSeconds: number;
}
