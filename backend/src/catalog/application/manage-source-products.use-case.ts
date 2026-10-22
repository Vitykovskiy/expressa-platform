import {
  assertV3ProductDetails,
  ProductAdminError,
} from "../domain/product-admin.policy";
import type {
  V3AdminProduct,
  V3ProductDetails,
} from "../domain/product-admin.policy.types";
import type { V3ProductsUnitOfWork } from "./products.repository.types";
import type { SourceActor, SourceProductWrite } from "./source-menu.types";

export class ManageSourceProductsUseCase {
  constructor(private readonly unitOfWork: V3ProductsUnitOfWork) {}

  save(
    input: SourceProductWrite,
    actor: SourceActor,
    productId: string | null,
  ): Promise<V3AdminProduct> {
    return this.unitOfWork
      .runV3(
        async (repository) => {
          const before =
            productId === null ? null : await repository.findV3ById(productId);
          if (productId !== null && before === null) {
            throw new ProductAdminError("PRODUCT_NOT_FOUND");
          }
          if (before?.archivedAt != null) {
            throw new ProductAdminError("PRODUCT_ARCHIVED");
          }
          if (!(await repository.categoryExists(input.categoryId))) {
            throw new ProductAdminError("PRODUCT_CATEGORY_NOT_FOUND");
          }

          const categoryProducts =
            before?.categoryId === input.categoryId
              ? []
              : await repository.findCurrentV3ByCategory(input.categoryId);
          const sortOrder =
            before?.categoryId === input.categoryId
              ? before.sortOrder
              : categoryProducts.reduce(
                  (order, product) => Math.max(order, product.sortOrder + 1),
                  0,
                );
          const details = this.toProductDetails(input, before, sortOrder);
          assertV3ProductDetails(details);
          const after =
            before === null
              ? await repository.createV3(details)
              : await repository.updateV3(before.id, details);
          return { before, after };
        },
        (repository, { before, after }) =>
          repository.writeV3Audit({
            ...actor,
            productId: after.id,
            action: before === null ? "PRODUCT_CREATED" : "PRODUCT_UPDATED",
            before,
            after,
          }),
      )
      .then(({ after }) => after);
  }
  private toProductDetails(
    input: SourceProductWrite,
    before: V3AdminProduct | null,
    sortOrder: number,
  ): V3ProductDetails {
    const usedIds = new Set<string>();
    const priceChoices = input.priceChoices.map((choice, index) => {
      const current =
        choice.id === undefined
          ? undefined
          : before?.priceChoices.find((item) => item.id === choice.id);
      if (
        choice.id !== undefined &&
        (current === undefined || usedIds.has(choice.id))
      ) {
        throw new ProductAdminError("PRODUCT_INVALID", [
          {
            path: `priceChoices.${index}.id`,
            reason: "Must identify a distinct current choice of this product",
          },
        ]);
      }
      if (choice.id !== undefined) {
        usedIds.add(choice.id);
      }
      return {
        ...choice,
        sortOrder: index,
        isAvailable: current?.isAvailable ?? true,
      };
    });
    return {
      categoryId: input.categoryId,
      name: input.name,
      description: before?.description ?? "",
      price: input.price,
      portionLabel:
        priceChoices.length === 0 ? (before?.portionLabel ?? null) : null,
      priceChoices,
      sortOrder,
      isActive: before?.isActive ?? true,
      isAvailable: before?.isAvailable ?? true,
    };
  }
}
