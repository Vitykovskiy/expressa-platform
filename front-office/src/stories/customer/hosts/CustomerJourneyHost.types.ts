export type CustomerJourneyProductType = "drink" | "food" | "extra";

export interface CustomerJourneyAddon {
  id: string;
  name: string;
  priceRub: number;
}

export interface CustomerJourneyProductSize {
  sizeCode: string;
  price: number;
}

export interface CustomerJourneyProduct {
  id: string;
  name: string;
  description: string;
  type: CustomerJourneyProductType;
  image: string;
  basePrice: number;
  sizes?: CustomerJourneyProductSize[];
  addons?: CustomerJourneyAddon[];
}

export type CustomerJourneyCategory = PublicMenuCategory;
export type LegacyFixtureCategory = {
  id: string;
  name: string;
  image: string;
  products: CustomerJourneyProduct[];
};
export type CustomerJourneyCartItem = CartItem;
export type CustomerJourneyCartItemDraft = ConfiguredCartItemDraft;

export interface CustomerJourneyTimeSlot {
  id: string;
  date: string;
  timeFrom: string;
  timeTo: string;
  available: number;
  capacity: number;
}

export type CustomerJourneyOrderStatus =
  "pending" | "preparing" | "ready" | "completed" | "cancelled";

export interface CustomerJourneyOrderItemAddon {
  name: string;
  quantity: number;
}

export interface CustomerJourneyOrderItem {
  productName: string;
  quantity: number;
  lineTotalRub: number;
  addons: CustomerJourneyOrderItemAddon[];
  size?: string;
}

export interface CustomerJourneyOrder {
  id: string;
  createdAt: string;
  status: CustomerJourneyOrderStatus;
  totalRub: number;
  slotDate: string;
  slotTimeFrom: string;
  slotTimeTo: string;
  items: CustomerJourneyOrderItem[];
}

export interface CustomerJourneyData {
  categories: PublicMenuCategory[];
  slots: CustomerJourneyTimeSlot[];
  orders: CustomerJourneyOrder[];
  statusLabels: Record<CustomerJourneyOrderStatus, string>;
}

export type CustomerJourneyScreen =
  | { id: "menu" }
  | { id: "group"; groupId: string }
  | { id: "product"; groupId: string; itemId: string; editId?: string }
  | { id: "cart" }
  | { id: "slot" }
  | { id: "orders" }
  | { id: "auth"; returnTo?: CustomerJourneyScreen };

export type CustomerJourneyAuthStep =
  "phone" | "otp" | "loading" | "register" | "success";

export interface CustomerJourneyAuthState {
  step: CustomerJourneyAuthStep;
  name: string;
  phone: string;
  errorMessage: string;
  verified: boolean;
}

export interface CustomerJourneySeed {
  currentScreen: CustomerJourneyScreen;
  navigationStack: CustomerJourneyScreen[];
  auth: CustomerJourneyAuthState;
  cartItems: CustomerJourneyCartItem[];
  selectedSlotId: string | null;
  data: CustomerJourneyData;
}

export interface CustomerJourneyHostProps {
  seed: CustomerJourneySeed;
}

export type CustomerJourneyProtectedScreen = Extract<
  CustomerJourneyScreen,
  { id: "cart" | "slot" | "orders" }
>;

export type CustomerJourneyNavigationDestination =
  "auth" | "cart" | "menu" | "orders";
import type {
  CartItem,
  ConfiguredCartItemDraft,
} from "../../../customer/shared/model/customer.types";
import type { PublicMenuCategory } from "../../../shared/api/public-menu.api";
