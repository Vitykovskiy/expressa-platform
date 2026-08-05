import type { CatalogValidationField } from "../domain/catalog-validation.types";

export type { CatalogValidationField } from "../domain/catalog-validation.types";

export type CatalogValidationErrorResponse = {
  code: "VALIDATION_ERROR";
  message: string;
  details: { fields: readonly CatalogValidationField[] };
};
