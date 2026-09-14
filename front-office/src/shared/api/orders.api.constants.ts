export const ordersPaths = {
  create: "../v3/orders",
  details: (orderId: string) => `../v3/orders/${orderId}`,
  list: "../v3/orders",
} as const;

export const ordersStatuses = {
  created: 201,
  success: 200,
} as const;

export const ordersStages = ["CREATED"] as const;
export const customerOrderStages = [
  "CREATED",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "ISSUED",
] as const;

export const ordersUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
