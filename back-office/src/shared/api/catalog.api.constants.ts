export const catalogApiPaths = {
  catalog: "/backoffice/catalog",
  categories: "/backoffice/catalog/categories",
  modifierGroups: "/backoffice/catalog/modifier-groups",
  products: "/backoffice/catalog/products",
} as const;

export const catalogProductTypes = ["DRINK", "OTHER"] as const;

export const catalogProductSizes = ["S", "M", "L"] as const;

export const catalogModifierSelectionTypes = ["single", "multiple"] as const;

export const catalogUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
