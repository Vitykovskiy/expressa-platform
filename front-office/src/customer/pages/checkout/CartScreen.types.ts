import type { CartItem } from "../../shared/model/customer.types";

export interface CartScreenProps {
  items: CartItem[];
}

export type CartScreenEmits = {
  removeItem: [itemId: string];
  updateQuantity: [itemId: string, nextQuantity: number];
  continueShopping: [];
  checkout: [];
};
