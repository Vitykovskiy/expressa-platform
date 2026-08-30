export const catalogCategoriesApiTag = "backoffice";

export const catalogCategoriesControllerPath = "backoffice/catalog/categories";

export const categoryErrorResponses = {
  invalid: {
    code: "CATEGORY_INVALID",
    details: null,
    message: "Invalid category command",
  },
  notFound: {
    code: "CATEGORY_NOT_FOUND",
    details: null,
    message: "Category not found",
  },
  archived: {
    code: "CATEGORY_ARCHIVED",
    details: null,
    message: "Category is archived",
  },
  positionConflict: {
    code: "CATEGORY_POSITION_CONFLICT",
    details: null,
    message: "Category position is occupied",
  },
  reorderInvalid: {
    code: "CATEGORY_REORDER_INVALID",
    details: null,
    message: "Category reorder must include all current categories",
  },
} as const;
