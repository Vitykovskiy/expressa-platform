import type { CustomerOrder, OrderItem } from "../shared/api/orders.api";
import type { PushSubscriptionRequest } from "../shared/api/push.api";
import type { CartItem } from "@/entities/customer/model/customer.types";
import type { RepeatWarning } from "@/entities/customer/model/cart.store.types";

export type OrderPageOrder = CustomerOrder;
export type OrderPageItem = OrderItem;
export type OrderPagePushSubscription = PushSubscriptionRequest;
export type OrderRepeatPreparation = {
  items: CartItem[];
  warnings: RepeatWarning[];
};
