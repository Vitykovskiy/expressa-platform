export const publicMenuPaths = {
  getMenu: "/public/menu",
} as const;

export const publicMenuStatuses = {
  success: 200,
} as const;

export const publicMenuProductTypes = ["DRINK", "OTHER"] as const;

export const publicMenuVariantSizes = ["S", "M", "L"] as const;

export const publicMenuSelectionTypes = ["single", "multiple"] as const;

export const publicMenuUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
