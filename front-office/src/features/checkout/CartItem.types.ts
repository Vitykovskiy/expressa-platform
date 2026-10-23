import type { CartItem as CartItemModel } from "@/entities/customer/model/customer.types";

export interface CartItemProps {
  item: CartItemModel;
  disabled?: boolean;
  priceOutdated?: boolean;
  unavailable?: boolean;
}

export interface CartItemEmits {
  editItem: [itemId: string];
  removeItem: [itemId: string];
  updateQuantity: [itemId: string, nextQuantity: number];
}
