export interface Addon {
  id: string;
  name: string;
  priceRub: number;
}

export type ConfiguredCartItemDraft = PricedCartItemDraft | OtherCartItemDraft;

export type CartItem = PricedCartItem | OtherCartItem;

export type PricedCartItemDraft = ConfiguredCartItemDraftBase & {
  type: "PRICED";
  selectedPriceChoice: CartPriceChoiceSelection | null;
  portionLabel: string | null;
  price: number;
};

export type OtherCartItemDraft = ConfiguredCartItemDraftBase & {
  type: "OTHER";
  selectedPriceChoice?: never;
  portionLabel?: string | null;
  price?: number;
};

export type PricedCartItem = PricedCartItemDraft & { id: string };

export type OtherCartItem = OtherCartItemDraft & { id: string };

export type ConfiguredCartItemDraftBase = {
  productId: string;
  productName: string;
  addons: Addon[];
  quantity: number;
  lineTotalRub: number;
  unitTotal: number;
  lineTotal: number;
  selectedModifierOptions: CartSelectedModifierOption[];
};

export type CartPriceChoiceSelection = {
  id: string;
  portionLabel: string;
  price: number;
};
export type CartSelectedModifierOption = {
  groupId: string;
  id: string;
  name: string;
  priceDelta: number;
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
