export enum AvailabilityState {
  AVAILABLE = "true",
  UNAVAILABLE = "false",
}

export enum AvailabilityItemType {
  PRODUCT = "товара",
  SIZE = "размера",
  MODIFIER = "добавки",
}

export interface IntakeChangeMetadata {
  /** Отображаемая UI-подпись сотрудника, выполнившего изменение. */
  readonly actor: string;
  readonly displayedAt: string;
}
