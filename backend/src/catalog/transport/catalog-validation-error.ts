import { HttpException, HttpStatus } from "@nestjs/common";
import { catalogValidationErrorMessage } from "./catalog-validation-error.constants";
import type {
  CatalogValidationErrorResponse,
  CatalogValidationField,
} from "./catalog-validation-error.types";

export function validationError(
  fields: readonly CatalogValidationField[],
): HttpException {
  const response: CatalogValidationErrorResponse = {
    code: "VALIDATION_ERROR",
    message: catalogValidationErrorMessage,
    details: { fields },
  };

  return new HttpException(response, HttpStatus.BAD_REQUEST);
}
