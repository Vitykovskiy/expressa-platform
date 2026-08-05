export type CheckoutDatabaseState = {
  acceptsNewOrders: boolean;
  modifierAvailable: boolean;
  productAvailable: boolean;
  variantAvailable: boolean;
  variantPriceMinor: number;
};

export type OrderRow = {
  id: string;
  idempotencyKey: string;
  orderNumber: string;
  quantity: number;
  totalMinor: number;
};

export type OrderRowQuery = {
  id: unknown;
  idempotencyKey: unknown;
  orderNumber: unknown;
  quantity: unknown;
  totalMinor: unknown;
};
