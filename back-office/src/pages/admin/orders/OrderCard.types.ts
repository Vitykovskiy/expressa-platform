import type {
  OrderApiError,
  OrderDetails,
  OrderListItem,
  OrderStage,
} from "../../../shared/api/orders.api.types";

export type OrderCardProps = {
  order: OrderListItem;
  details: OrderDetails | null;
  detailsError: OrderApiError | null;
  detailsLoading: boolean;
  transitionLoading: boolean;
};

export type OrderCardEmits = {
  open: [orderId: string];
  transition: [];
};

export type OrderActionPresentation = {
  label: string;
};

export type OrderStagePresentation = {
  label: string;
  tone: "info" | "success" | "warning";
};

export type OrderStagePresentationMap = Record<
  OrderStage,
  OrderStagePresentation
>;
