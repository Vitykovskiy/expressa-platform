import type { DeepReadonly } from "vue";
import type {
  Order,
  OrderOperation,
  OrderTransition,
} from "../../entities/order/order.types";

export interface OrderTransitionProps {
  order: DeepReadonly<Order> | null;
  operation: DeepReadonly<OrderOperation> | null;
  blocked: boolean;
  recoveryBlocked: boolean;
  retained: boolean;
  showBack: boolean;
}
export interface OrderTransitionEmits {
  transition: [context: OrderTransition];
  reconcile: [];
  back: [];
}
