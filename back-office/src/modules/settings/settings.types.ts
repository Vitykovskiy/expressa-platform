export interface SettingsInput {
  readonly opensAt: string;
  readonly closesAt: string;
  readonly slotCapacity: number;
}

export interface OperatingSettings extends SettingsInput {
  readonly slotMinutes: 10;
  readonly timeZone: "UTC";
  readonly updatedAt: string | null;
}

export interface SettingsDraft {
  readonly opensAt: string;
  readonly closesAt: string;
  readonly slotCapacity: string;
}

export interface SettingsContext {
  readonly identityId: string;
  readonly accessToken: string;
}

export type SettingsReadOutcome =
  | { readonly kind: "loaded"; readonly settings: OperatingSettings }
  | { readonly kind: "failed" | "cancelled" | "session-expired" };

export type SettingsSaveOutcome =
  | { readonly kind: "confirmed"; readonly settings: OperatingSettings }
  | { readonly kind: "rejected" }
  | { readonly kind: "not-sent" }
  | { readonly kind: "unknown" }
  | { readonly kind: "session-expired" };

export interface SettingsCommand {
  readonly phase:
    "sending" | "refreshing" | "unknown" | "inspecting" | "inspected";
  readonly observed: OperatingSettings | null;
}

export type SettingsPhase = "idle" | "loading" | "ready" | "error";
