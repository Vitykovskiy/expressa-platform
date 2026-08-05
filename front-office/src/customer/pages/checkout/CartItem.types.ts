import type { CartItem as CartItemModel } from "../../shared/model/customer.types";

export interface CartItemProps {
  item: CartItemModel;
  disabled?: boolean;
  priceOutdated?: boolean;
  unavailable?: boolean;
}

export interface CartItemEmits {
  removeItem: [itemId: string];
  updateQuantity: [itemId: string, nextQuantity: number];
}
