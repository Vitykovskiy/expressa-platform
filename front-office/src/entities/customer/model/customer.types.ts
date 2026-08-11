export type ProductType = "drink" | "food" | "extra";

export interface Addon {
  id: string;
  name: string;
  priceRub: number;
}

export interface ProductSize {
  sizeCode: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  type: ProductType;
  image: string;
  basePrice: number;
  sizes?: ProductSize[];
  addons?: Addon[];
}

export interface Category {
  id: string;
  name: string;
  image: string;
  products: Product[];
}

export interface LegacyCartItemDraft {
  productId: string;
  productName: string;
  type: ProductType;
  addons: Addon[];
  quantity: number;
  lineTotalRub: number;
  size?: string;
  sizePrice?: number;
}

export type LegacyCartItem = LegacyCartItemDraft & { id: string };

export type CartItemDraft = LegacyCartItemDraft;

export type ConfiguredCartItemDraft = DrinkCartItemDraft | OtherCartItemDraft;

export type CartItem = DrinkCartItem | OtherCartItem | LegacyCartItem;

export type DrinkCartItemDraft = ConfiguredCartItemDraftBase & {
  type: "DRINK";
  selectedVariant: CartVariantSelection;
  size: "S" | "M" | "L";
  sizePrice: number;
};

export type OtherCartItemDraft = ConfiguredCartItemDraftBase & {
  type: "OTHER";
  selectedVariant?: never;
  size?: never;
  sizePrice?: never;
};

export type DrinkCartItem = DrinkCartItemDraft & { id: string };

export type OtherCartItem = OtherCartItemDraft & { id: string };

export type ConfiguredCartItemDraftBase = {
  productId: string;
  productName: string;
  addons: Addon[];
  quantity: number;
  lineTotalRub: number;
  unitTotalMinor: number;
  lineTotalMinor: number;
  selectedModifierOptions: CartSelectedModifierOption[];
};

export type CartVariantSelection = {
  id: string;
  size: "S" | "M" | "L";
  priceMinor: number;
};

export type CartSelectedModifierOption = {
  groupId: string;
  id: string;
  name: string;
  priceDeltaMinor: number;
};

export interface TimeSlot {
  id: string;
  date: string;
  timeFrom: string;
  timeTo: string;
  available: number;
  capacity: number;
}

export type OrderStatus =
  "pending" | "preparing" | "ready" | "completed" | "cancelled";

export interface OrderItemAddon {
  name: string;
  quantity: number;
}

export interface OrderItem {
  productName: string;
  quantity: number;
  lineTotalRub: number;
  addons: OrderItemAddon[];
  size?: string;
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  totalRub: number;
  slotDate: string;
  slotTimeFrom: string;
  slotTimeTo: string;
  items: OrderItem[];
}

export type AuthStep = "phone" | "otp" | "loading" | "register" | "success";

export interface AuthState {
  step: AuthStep;
  name: string;
  phone: string;
  errorMessage: string;
  verified: boolean;
}
