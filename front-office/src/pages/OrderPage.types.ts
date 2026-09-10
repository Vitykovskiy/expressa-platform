import type { CustomerOrder, OrderItem } from "../shared/api/orders.api";
import type { CartItem } from "@/entities/customer/model/customer.types";
import type {
  RepeatResult,
  RepeatWarning,
} from "@/entities/customer/model/cart.store.types";

export type OrderPageOrder = CustomerOrder;
export type OrderPageItem = OrderItem;
export type OrderRepeatPreparation = {
  items: CartItem[];
  result: RepeatResult;
  warnings: RepeatWarning[];
};
