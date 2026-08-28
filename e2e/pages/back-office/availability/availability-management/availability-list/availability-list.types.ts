export enum AvailabilityState {
  AVAILABLE = "true",
  UNAVAILABLE = "false",
}

export interface IntakeChangeMetadata {
  readonly actor: string;
  readonly displayedAt: string;
}
