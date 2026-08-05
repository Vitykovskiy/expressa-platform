export const catalogModifiersApiTag = 'backoffice';
export const catalogModifiersControllerPath = 'backoffice/catalog/modifier-groups';
export const modifierErrorResponses = {
  invalid: { code: 'MODIFIER_INVALID', details: null, message: 'Invalid modifier command' },
  groupNotFound: { code: 'MODIFIER_GROUP_NOT_FOUND', details: null, message: 'Modifier group not found' },
  groupArchived: { code: 'MODIFIER_GROUP_ARCHIVED', details: null, message: 'Modifier group is archived' },
  optionNotFound: { code: 'MODIFIER_OPTION_NOT_FOUND', details: null, message: 'Modifier option not found' },
  optionArchived: { code: 'MODIFIER_OPTION_ARCHIVED', details: null, message: 'Modifier option is archived' },
  reorderInvalid: { code: 'MODIFIER_REORDER_INVALID', details: null, message: 'Modifier option reorder must include all current group options' },
} as const;
