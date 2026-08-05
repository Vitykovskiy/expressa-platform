import {
  assertAvailableActivePosition,
  assertCurrentProduct,
  assertFullProductReorder,
  assertProductDetails,
  ProductAdminError,
} from "../domain/product-admin.policy";
import type { AdminProduct } from "../domain/product-admin.policy.types";
import type {
  ArchiveProductCommand,
  CreateProductCommand,
  ProductsUnitOfWork,
  ReorderProductsCommand,
  UpdateProductCommand,
} from "./products.repository.types";

export class ManageProductsUseCase {
  constructor(private readonly unitOfWork: ProductsUnitOfWork) {}
  async create(command: CreateProductCommand): Promise<AdminProduct> {
    assertProductDetails(command);
    return this.unitOfWork.run(
      async (repository) => {
        if (!(await repository.categoryExists(command.categoryId)))
          throw new ProductAdminError("PRODUCT_CATEGORY_NOT_FOUND");
        const products = await repository.findCurrentByCategory(
          command.categoryId,
        );
        assertAvailableActivePosition(products, null, command);
        return repository.create(command);
      },
      (repository, product) =>
        repository.writeAudit({
          actorId: command.actorId,
          requestId: command.requestId,
          action: "PRODUCT_CREATED",
          productId: product.id,
          before: null,
          after: product,
        }),
    );
  }
  async update(command: UpdateProductCommand): Promise<AdminProduct> {
    assertProductDetails(command);
    return this.unitOfWork
      .run(
        async (repository) => {
          const before = assertCurrentProduct(
            await repository.findById(command.productId),
          );
          if (before.type !== command.type)
            throw new ProductAdminError("PRODUCT_INVALID", [
              { path: "type", reason: "Product type cannot be changed" },
            ]);
          if (!(await repository.categoryExists(command.categoryId)))
            throw new ProductAdminError("PRODUCT_CATEGORY_NOT_FOUND");
          assertAvailableActivePosition(
            await repository.findCurrentByCategory(command.categoryId),
            before.id,
            command,
          );
          return { before, after: await repository.update(before.id, command) };
        },
        (repository, result) =>
          repository.writeAudit({
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
  async reorder(command: ReorderProductsCommand): Promise<AdminProduct[]> {
    return this.unitOfWork
      .run(
        async (repository) => {
          if (!(await repository.categoryExists(command.categoryId)))
            throw new ProductAdminError("PRODUCT_CATEGORY_NOT_FOUND");
          const before = await repository.findCurrentByCategory(
            command.categoryId,
          );
          assertFullProductReorder(
            before,
            command.categoryId,
            command.productIds,
          );
          return {
            before,
            after: await repository.reorder(before, command.productIds),
          };
        },
        async (repository, result) => {
          for (const after of result.after)
            await repository.writeAudit({
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
  async archive(command: ArchiveProductCommand): Promise<void> {
    await this.unitOfWork.run(
      async (repository) => ({
        before: assertCurrentProduct(
          await repository.findById(command.productId),
        ),
        after: await repository.archive(command.productId),
      }),
      (repository, result) =>
        repository.writeAudit({
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
