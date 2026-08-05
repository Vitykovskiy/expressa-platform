export const ordersPaths = {
  create: "/orders",
} as const;

export const ordersStatuses = {
  created: 201,
} as const;

export const ordersStages = ["CREATED"] as const;

export const ordersSizes = ["S", "M", "L"] as const;

export const ordersUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
