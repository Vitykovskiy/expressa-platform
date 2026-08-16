import type { CustomerOrder, OrderItem } from "../shared/api/orders.api";
import type { PushSubscriptionRequest } from "../shared/api/push.api";

export type OrderPageOrder = CustomerOrder;
export type OrderPageItem = OrderItem;
export type OrderPagePushSubscription = PushSubscriptionRequest;
