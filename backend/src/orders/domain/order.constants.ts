export const minimumOrderItemQuantity = 1;
export const maximumOrderItemQuantity = 20;

export const orderErrorCodes = [
  "VALIDATION_ERROR",
  "MENU_ITEM_UNAVAILABLE",
  "ORDER_TOTAL_CHANGED",
  "ORDER_INTAKE_CLOSED",
  "IDEMPOTENCY_KEY_REUSED",
] as const;
