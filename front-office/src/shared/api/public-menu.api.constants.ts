export const publicMenuPaths = {
  getMenu: "../v3/public/menu",
} as const;

export const publicMenuStatuses = {
  success: 200,
} as const;

export const publicMenuUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
