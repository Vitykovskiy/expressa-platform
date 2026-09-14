export const apiPrefix = "api/v2";
export const apiPrefixExclusions = [
  "health/live",
  "health/ready",
  "metrics",
  "api/v3/public/menu",
  "api/v3/backoffice/catalog",
  "api/v3/backoffice/catalog/products",
  "api/v3/backoffice/catalog/products/:productId",
  "api/v3/backoffice/availability/price-choice/:id",
  "api/v3/backoffice/orders",
  "api/v3/backoffice/orders/:orderId",
  "api/v3/orders",
  "api/v3/orders/:orderId",
  "api/v3/orders/:orderId/repeat",
];
export const bearerSecuritySchemeName = "bearer";
export const refreshCookieSecuritySchemeName = "expressa_refresh";
