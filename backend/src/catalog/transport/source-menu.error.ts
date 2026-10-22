import { HttpException } from "@nestjs/common";
import { CategoryAdminError } from "../domain/category-admin.policy";
import { ProductAdminError } from "../domain/product-admin.policy";
import { ModifierAdminError } from "../domain/modifier-admin.policy";
import { validationError } from "./catalog-validation-error";

export async function executeSourceCommand<Result>(
  command: () => Promise<Result>,
): Promise<Result> {
  try {
    return await command();
  } catch (error) {
    if (!(
      error instanceof CategoryAdminError ||
      error instanceof ProductAdminError ||
      error instanceof ModifierAdminError
    )) {
      throw error;
    }
    if (
      error.code === "CATEGORY_INVALID" ||
      error.code === "PRODUCT_INVALID" ||
      error.code === "MODIFIER_INVALID"
    ) {
      throw validationError(error.fields);
    }
    throw new HttpException(
      { code: error.code, message: "Catalog command refused" },
      error.code.endsWith("_NOT_FOUND") ? 404 : 409,
    );
  }
}
