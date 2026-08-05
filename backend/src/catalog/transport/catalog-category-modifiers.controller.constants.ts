export const catalogCategoryModifiersApiTag = 'backoffice';

export const catalogCategoryModifiersControllerPath = 'backoffice/catalog/categories';

export const categoryModifierGroupsErrorResponses = {
  invalid: { code: 'CATEGORY_MODIFIER_GROUPS_INVALID', details: null, message: 'Invalid category modifier groups command' },
  categoryNotFound: { code: 'CATEGORY_NOT_FOUND', details: null, message: 'Category not found' },
} as const;
