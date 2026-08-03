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

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  type: ProductType;
  addons: Addon[];
  quantity: number;
  lineTotalRub: number;
  size?: string;
  sizePrice?: number;
}

export type CartItemDraft = Omit<CartItem, "id">;

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
