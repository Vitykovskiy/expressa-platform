export interface PushProof {
  readonly endpoint: string;
  readonly keys: { readonly p256dh: string; readonly auth: string };
}

export interface PushInspection {
  readonly association: "none" | "current" | "other";
  readonly version: string | null;
}

export type PushOutcome<T> =
  | { readonly kind: "confirmed"; readonly value: T }
  | { readonly kind: "expired" }
  | { readonly kind: "refused" }
  | { readonly kind: "unknown" };

export interface PushContext {
  readonly identityId: string;
  readonly accessToken: string;
}

export interface PushCommand {
  readonly action: "enable" | "disable";
  readonly proof: PushProof;
  readonly expectedVersion: string | null;
}
