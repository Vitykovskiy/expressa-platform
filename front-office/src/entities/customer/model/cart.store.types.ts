import type { CartItem } from "./customer.types";

export interface CartState {
  items: CartItem[];
  repeatWarnings: RepeatWarning[];
}

export interface RepeatWarning {
  productName: string;
  context?: string;
  reason: string;
}

export interface CartStorage {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}
