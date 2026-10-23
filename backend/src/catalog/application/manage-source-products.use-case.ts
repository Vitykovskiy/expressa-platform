import {
  assertV3ProductDetails,
  ProductAdminError,
} from "../domain/product-admin.policy";
import type {
  V3AdminProduct,
  V3ProductDetails,
} from "../domain/product-admin.policy.types";
import type { SourceProductsUnitOfWork } from "./products.repository.types";
import type {
  SourceActor,
  SourceProductWrite,
  SourceProductResult,
} from "./source-menu.types";

export class ManageSourceProductsUseCase {
  constructor(private readonly unitOfWork: SourceProductsUnitOfWork) {}

  save(
    input: SourceProductWrite,
    actor: SourceActor,
    productId: string | null,
  ): Promise<SourceProductResult> {
    return this.unitOfWork
      .runV3(
        async (repository) => {
          let before: V3AdminProduct | null = null;
          if (productId !== null) {
            before = await repository.findV3ById(productId);
          }
          if (productId !== null && before === null) {
            throw new ProductAdminError("PRODUCT_NOT_FOUND");
          }
          if (before?.archivedAt != null) {
            throw new ProductAdminError("PRODUCT_ARCHIVED");
          }
          if (!(await repository.categoryExists(input.categoryId))) {
            throw new ProductAdminError("PRODUCT_CATEGORY_NOT_FOUND");
          }

          let previousGroups: string[] = [];
          if (before !== null) {
            previousGroups = await repository.findModifierGroupIds(before.id);
          }
          // Отсутствующий список сохраняет даже не показанные формой связи.
          const modifierGroupIds = input.modifierGroupIds ?? previousGroups;
          if (
            input.modifierGroupIds !== undefined &&
            (new Set(modifierGroupIds).size !== modifierGroupIds.length ||
              !(await repository.currentModifierGroupsExist(modifierGroupIds)))
          ) {
            throw new ProductAdminError("PRODUCT_INVALID", [
              {
                path: "modifierGroupIds",
                reason: "Must reference distinct current modifier groups",
              },
            ]);
          }

          let categoryProducts: V3AdminProduct[] = [];
          if (before?.categoryId !== input.categoryId) {
            categoryProducts = await repository.findCurrentV3ByCategory(
              input.categoryId,
            );
          }
          const sortOrder =
            before?.categoryId === input.categoryId
              ? before.sortOrder
              : categoryProducts.reduce(
                  (order, product) => Math.max(order, product.sortOrder + 1),
                  0,
                );
          const details = this.toProductDetails(input, before, sortOrder);
          assertV3ProductDetails(details);
          let after: V3AdminProduct;
          if (before === null) {
            after = await repository.createV3(details);
          } else {
            after = await repository.updateV3(before.id, details);
          }
          if (input.modifierGroupIds !== undefined) {
            await repository.replaceModifierGroups(after.id, modifierGroupIds);
          }
          const savedModifierGroupIds = await repository.findModifierGroupIds(
            after.id,
          );
          return {
            before:
              before === null
                ? null
                : { ...before, modifierGroupIds: previousGroups },
            after: { ...after, modifierGroupIds: savedModifierGroupIds },
          };
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
