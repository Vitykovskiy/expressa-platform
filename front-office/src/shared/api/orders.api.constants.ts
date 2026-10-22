export const ordersPaths = {
  create: "../v3/orders",
  details: (orderId: string) => `../v3/orders/${orderId}`,
  list: "../v3/orders",
} as const;

export const ordersStatuses = {
  created: 201,
  success: 200,
} as const;

export const customerOrderStages = [
  "CREATED",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "ISSUED",
] as const;

export const ordersPickupSlotDurationMs = 10 * 60 * 1000;

export const ordersTimestampPattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export const ordersUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
