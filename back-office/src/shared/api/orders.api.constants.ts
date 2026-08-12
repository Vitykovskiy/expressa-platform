export const ordersApiPaths = {
  orders: "/backoffice/orders",
} as const;

export const orderStages = [
  "CREATED",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "ISSUED",
] as const;

export const orderTransitions = {
  ACCEPTED: "start-preparing",
  CREATED: "accept",
  PREPARING: "mark-ready",
  READY: "issue",
} as const;
