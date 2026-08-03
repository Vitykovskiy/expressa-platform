import type { CartItem as CartItemModel } from "../../shared/model/customer.types";

export interface CartItemProps {
  item: CartItemModel;
}

export interface CartItemEmits {
  removeItem: [itemId: string];
  updateQuantity: [itemId: string, nextQuantity: number];
}
