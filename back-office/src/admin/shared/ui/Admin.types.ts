export type UserRole = "barista" | "administrator";

export type AdminSection =
  "orders" | "availability" | "menu" | "users" | "settings";

export type AuthResult = "ok" | "no_role" | "not_found";

export type OrderStatus =
  "Created" | "Confirmed" | "Ready for pickup" | "Rejected" | "Closed";

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  items: string;
  total: number;
  status: OrderStatus;
  slotTime: string;
  createdAt: Date;
}

export interface MenuSize {
  size: string;
  price: number;
}

export interface MenuOption {
  id: string;
  name: string;
  available: boolean;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  available: boolean;
  price?: number;
  sizes?: MenuSize[];
  options?: MenuOption[];
  isOptionGroup?: boolean;
}

export interface CreateMenuCategoryData {
  categoryName: string;
  isOptionGroup: boolean;
  parentGroupId?: string;
}

export interface EditMenuCategoryData {
  newName: string;
  isOptionGroup: boolean;
  parentGroupId?: string;
}

export interface UpdateMenuCategoryEvent {
  categoryName: string;
  newName: string;
  isOptionGroup: boolean;
  parentGroupId?: string;
}

export interface DeleteMenuCategoryEvent {
  categoryName: string;
}

export interface CreateMenuProductData {
  name: string;
  category: string;
  price?: number;
  sizes?: MenuSize[];
}

export interface EditMenuProductData {
  name: string;
  category: string;
  price?: number;
  sizes?: MenuSize[];
}

export interface UpdateMenuProductEvent {
  productId: string;
  name: string;
  category: string;
  price?: number;
  sizes?: MenuSize[];
}

export interface DeleteMenuProductEvent {
  productId: string;
}

export type UserStatus = "active" | "blocked";

export interface User {
  id: string;
  name: string;
  role: UserRole | null;
  status: UserStatus;
  phone?: string;
}

export interface Settings {
  workingHoursOpen: string;
  workingHoursClose: string;
  slotCapacity: number;
}

export type OrderAction = "confirm" | "reject" | "ready" | "close";

export type OrderActionEvent =
  | { orderId: string; action: "confirm" | "ready" | "close" }
  | { orderId: string; action: "reject"; reason?: string };

export interface AvailabilityChangeEvent {
  id: string;
  checked: boolean;
}

export type UserAction = "change_role" | "block" | "unblock";

export interface AddUserData {
  name: string;
  phone: string;
  role: UserRole | null;
}

export interface UpdateUserRoleEvent {
  userId: string;
  role: UserRole | null;
}

export interface ToggleUserBlockEvent {
  userId: string;
}
