import type {
  OrderApiError,
  OrderDetails,
  OrderListItem,
  OrderStage,
} from "../../../shared/api/orders.api.types";

export type QueueFilter = "ALL" | OrderStage;

export type OrdersScreenProps = {
  orders: readonly OrderListItem[];
  search: string;
  stage: QueueFilter;
  status: "error" | "loading" | "ready";
  error: OrderApiError | null;
  selectedOrderId: string | null;
  details: OrderDetails | null;
  detailsLoading: boolean;
  transitionLoading: boolean;
  actionError: OrderApiError | null;
};

export type OrdersScreenEmits = {
  refresh: [];
  "update:search": [search: string];
  "update:stage": [stage: QueueFilter];
  open: [orderId: string];
  transition: [];
};
