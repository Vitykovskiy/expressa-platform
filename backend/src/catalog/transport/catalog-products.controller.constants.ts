export const catalogProductsApiTag = "backoffice";
export const catalogProductsControllerPath = "backoffice/catalog/products";
export const productErrorResponses = {
  invalid: {
    code: "PRODUCT_INVALID",
    details: null,
    message: "Invalid product command",
  },
  notFound: {
    code: "PRODUCT_NOT_FOUND",
    details: null,
    message: "Product not found",
  },
  archived: {
    code: "PRODUCT_ARCHIVED",
    details: null,
    message: "Product is archived",
  },
  categoryNotFound: {
    code: "PRODUCT_CATEGORY_NOT_FOUND",
    details: null,
    message: "Category not found",
  },
  positionConflict: {
    code: "PRODUCT_POSITION_CONFLICT",
    details: null,
    message: "Product position is occupied",
  },
  reorderInvalid: {
    code: "PRODUCT_REORDER_INVALID",
    details: null,
    message: "Product reorder must include all current category products",
  },
} as const;
