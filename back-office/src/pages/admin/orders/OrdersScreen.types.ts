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
  accessRecoveryPending: boolean;
  requiresAccessRecovery: boolean;
  selectedOrderId: string | null;
  details: OrderDetails | null;
  detailsError: OrderApiError | null;
  detailsLoading: boolean;
  transitionLoading: boolean;
  transitionRecoveryPending: boolean;
  requiresTransitionRecovery: boolean;
  actionError: OrderApiError | null;
};

export type OrdersScreenEmits = {
  refresh: [];
  "restore-access": [];
  "update:search": [search: string];
  "update:stage": [stage: QueueFilter];
  open: [orderId: string];
  transition: [];
  "recover-transition": [];
};
