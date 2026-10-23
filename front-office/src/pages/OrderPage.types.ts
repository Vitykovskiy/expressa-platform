import type { CustomerOrder, OrderItem } from "../shared/api/orders.api";
import type { CartItem } from "@/entities/customer/model/customer.types";

export type OrderPageOrder = CustomerOrder;
export type OrderPageItem = OrderItem;
export type OrderRepeatPreparation = {
  items: CartItem[];
};
