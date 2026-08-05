export type CatalogValidationField = {
  path: string;
  reason: string;
};

export type CatalogValidationFields = readonly [
  CatalogValidationField,
  ...CatalogValidationField[],
];
