export interface AccessTokenDto {
  readonly accessToken: string;
  readonly tokenType: "Bearer";
  readonly expiresInSeconds: number;
}

export interface CurrentUserDto {
  readonly name: string | null;
  readonly id: string;
  readonly phoneE164: string;
  readonly role: "customer" | "barista" | "administrator";
  readonly context: "customer" | "staff";
  readonly customer: { readonly registeredAt: string } | null;
  readonly employee: EmployeeMembership | null;
}

export interface EmployeeMembership {
  readonly role: "barista" | "administrator";
  readonly accessEnabled: boolean;
}

export interface SessionIdentity {
  readonly id: string;
  readonly phone: string;
  readonly context: "customer" | "staff";
  readonly customer: { readonly registeredAt: string } | null;
  readonly employee: EmployeeMembership | null;
}

export interface StaffIdentity extends SessionIdentity {
  readonly context: "staff";
  readonly employee: EmployeeMembership & { readonly accessEnabled: true };
}

export interface StaffSession {
  readonly identity: StaffIdentity;
  readonly accessToken: string;
  readonly expiresAt: number;
}

export type SessionState =
  | { readonly kind: "anonymous" }
  | { readonly kind: "pending" }
  | { readonly kind: "staff"; readonly session: StaffSession }
  | { readonly kind: "denied"; readonly identity: SessionIdentity }
  | { readonly kind: "uncertain" };

export type SessionOutcome =
  | { readonly kind: "staff" }
  | { readonly kind: "denied" }
  | { readonly kind: "anonymous" }
  | { readonly kind: "invalid-code" }
  | { readonly kind: "expired-code" }
  | { readonly kind: "unavailable" }
  | { readonly kind: "uncertain" }
  | { readonly kind: "cancelled" };

export type TokenOutcome =
  | { readonly kind: "token"; readonly token: AccessTokenDto }
  | Exclude<SessionOutcome, { readonly kind: "staff" | "denied" }>;

export type IdentityOutcome =
  | { readonly kind: "identity"; readonly identity: SessionIdentity }
  | { readonly kind: "anonymous" | "uncertain" | "cancelled" };
export interface LogoutPushProof {
  readonly endpoint: string;
  readonly keys: { readonly p256dh: string; readonly auth: string };
}

export type LogoutProofSupplier = (
  signal: AbortSignal,
) => Promise<LogoutPushProof | null>;
