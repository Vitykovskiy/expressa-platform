export enum CartItemSize {
  S = "Размер S",
  M = "Размер M",
  L = "Размер L",
}

export interface CartRepeatWarning {
  readonly productName: string;
  readonly context?: string;
  readonly reason: string;
}
