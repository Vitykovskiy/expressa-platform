export type CheckoutDatabaseState = {
  acceptsNewOrders: boolean;
  modifierAvailable: boolean;
  productAvailable: boolean;
  variantAvailable: boolean;
  variantPrice: number;
};

export type OrderRow = {
  id: string;
  idempotencyKey: string;
  orderNumber: string;
  quantity: number;
  total: number;
};

export type OrderRowQuery = {
  id: unknown;
  idempotencyKey: unknown;
  orderNumber: unknown;
  quantity: unknown;
  total: unknown;
};

export type IssuedHistoryOrder = {
  id: string;
  orderNumber: string;
};

export type IssuedHistoryOrderQuery = {
  id: unknown;
  orderNumber: unknown;
};

export type CheckoutOrderStage = "CREATED" | "ISSUED";
