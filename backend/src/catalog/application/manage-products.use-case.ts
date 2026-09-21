import {
  assertV3ProductDetails,
  ProductAdminError,
} from "../domain/product-admin.policy";
import type {
  V3ProductsUnitOfWork,
  V3ArchiveProductCommand,
  V3ProductCommand,
  V3ReorderProductsCommand,
} from "./products.repository.types";
import type { V3AdminProduct } from "../domain/product-admin.policy.types";

export class ManageV3ProductsUseCase {
  constructor(private readonly unitOfWork: V3ProductsUnitOfWork) {}
  async create(command: V3ProductCommand): Promise<V3AdminProduct> {
    assertV3ProductDetails(command);
    return this.unitOfWork.runV3(
      async (repository) => {
        if (!(await repository.categoryExists(command.categoryId)))
          throw new ProductAdminError("PRODUCT_CATEGORY_NOT_FOUND");
        return repository.createV3(command);
      },
      (repository, after) =>
        repository.writeV3Audit({
          actorId: command.actorId,
          requestId: command.requestId,
          action: "PRODUCT_CREATED",
          productId: after.id,
          before: null,
          after,
        }),
    );
  }
  async update(
    command: V3ProductCommand & { productId: string },
  ): Promise<V3AdminProduct> {
    assertV3ProductDetails(command);
    return this.unitOfWork
      .runV3(
        async (repository) => {
          const before = assertCurrentV3Product(
            await repository.findV3ById(command.productId),
          );
          if (!(await repository.categoryExists(command.categoryId)))
            throw new ProductAdminError("PRODUCT_CATEGORY_NOT_FOUND");
          return {
            before,
            after: await repository.updateV3(command.productId, command),
          };
        },
        (repository, result) =>
          repository.writeV3Audit({
            actorId: command.actorId,
            requestId: command.requestId,
            action: "PRODUCT_UPDATED",
            productId: result.after.id,
            before: result.before,
            after: result.after,
          }),
      )
      .then((result) => result.after);
  }
  async reorder(command: V3ReorderProductsCommand): Promise<V3AdminProduct[]> {
    return this.unitOfWork
      .runV3(
        async (repository) => {
          if (!(await repository.categoryExists(command.categoryId)))
            throw new ProductAdminError("PRODUCT_CATEGORY_NOT_FOUND");
          const before = await repository.findCurrentV3ByCategory(
            command.categoryId,
          );
          assertFullV3ProductReorder(before, command.productIds);
          return {
            before,
            after: await repository.reorderV3(before, command.productIds),
          };
        },
        async (repository, result) => {
          for (const after of result.after)
            await repository.writeV3Audit({
              actorId: command.actorId,
              requestId: command.requestId,
              action: "PRODUCT_REORDERED",
              productId: after.id,
              before:
                result.before.find((product) => product.id === after.id) ??
                null,
              after,
            });
        },
      )
      .then((result) => result.after);
  }
  async archive(command: V3ArchiveProductCommand): Promise<void> {
    await this.unitOfWork.runV3(
      async (repository) => ({
        before: assertCurrentV3Product(
          await repository.findV3ById(command.productId),
        ),
        after: await repository.archiveV3(command.productId),
      }),
      (repository, result) =>
        repository.writeV3Audit({
          actorId: command.actorId,
          requestId: command.requestId,
          action: "PRODUCT_ARCHIVED",
          productId: result.after.id,
          before: result.before,
          after: result.after,
        }),
    );
  }
}

function assertCurrentV3Product(
  product: V3AdminProduct | null,
): V3AdminProduct {
  if (product === null) throw new ProductAdminError("PRODUCT_NOT_FOUND");
  if (product.archivedAt !== null)
    throw new ProductAdminError("PRODUCT_ARCHIVED");
  return product;
}

function assertFullV3ProductReorder(
  products: readonly V3AdminProduct[],
  productIds: readonly string[],
): void {
  if (
    products.length !== productIds.length ||
    new Set(productIds).size !== productIds.length ||
    products.some((product) => !productIds.includes(product.id))
  )
    throw new ProductAdminError("PRODUCT_INVALID", [
      {
        path: "productIds",
        reason: "Must contain every current category product exactly once",
      },
    ]);
}
