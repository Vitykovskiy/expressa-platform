import { defineStore } from "pinia";

import { CatalogApiError } from "../../../shared/api/catalog.api";
import {
  catalogStatuses,
  catalogStoreId,
  catalogStoreMessages,
  initialCatalogStoreState,
} from "./catalog.constants";
import { getCatalogStoreDependencies } from "./catalog.dependencies";
import type {
  CatalogApiResult,
  CatalogFieldErrors,
  CatalogStoreError,
  CatalogStoreActions,
  CatalogStoreState,
  Category,
  CategoryModifierGroupAssignment,
  ModifierGroup,
  ModifierOption,
  Product,
  ProductVariant,
} from "./catalog.types";

export const useCatalogStore = defineStore(catalogStoreId, {
  state: (): CatalogStoreState => ({ ...initialCatalogStoreState }),
  actions: {
    load(accessToken: string): Promise<void> {
      if (this.activeOperation !== null) {
        this.lastCommandSucceeded = false;
        return this.activeOperation;
      }

      if (this.status === catalogStatuses.ready) {
        return Promise.resolve();
      }

      return this.execute(accessToken, () =>
        getCatalogStoreDependencies().catalogApi.getCatalog(accessToken),
      );
    },

    createCategory(
      accessToken: string,
      category: Parameters<CatalogStoreActions["createCategory"]>[1],
    ): Promise<void> {
      return this.mutate(accessToken, () =>
        getCatalogStoreDependencies().catalogApi.createCategory(
          accessToken,
          category,
        ),
      );
    },

    updateCategory(
      accessToken: string,
      categoryId: string,
      category: Parameters<CatalogStoreActions["updateCategory"]>[2],
    ): Promise<void> {
      return this.mutate(accessToken, () =>
        getCatalogStoreDependencies().catalogApi.updateCategory(
          accessToken,
          categoryId,
          category,
        ),
      );
    },

    reorderCategories(
      accessToken: string,
      categoryIds: readonly string[],
    ): Promise<void> {
      return this.mutate(accessToken, () =>
        getCatalogStoreDependencies().catalogApi.reorderCategories(
          accessToken,
          categoryIds,
        ),
      );
    },

    archiveCategory(accessToken: string, categoryId: string): Promise<void> {
      return this.mutate(accessToken, () =>
        getCatalogStoreDependencies().catalogApi.archiveCategory(
          accessToken,
          categoryId,
        ),
      );
    },

    createProduct(
      accessToken: string,
      product: Parameters<CatalogStoreActions["createProduct"]>[1],
    ): Promise<void> {
      return this.mutate(accessToken, () =>
        getCatalogStoreDependencies().catalogApi.createProduct(
          accessToken,
          product,
        ),
      );
    },

    updateProduct(
      accessToken: string,
      productId: string,
      product: Parameters<CatalogStoreActions["updateProduct"]>[2],
    ): Promise<void> {
      return this.mutate(accessToken, () =>
        getCatalogStoreDependencies().catalogApi.updateProduct(
          accessToken,
          productId,
          product,
        ),
      );
    },

    reorderProducts(
      accessToken: string,
      categoryId: string,
      productIds: readonly string[],
    ): Promise<void> {
      return this.mutate(accessToken, () =>
        getCatalogStoreDependencies().catalogApi.reorderProducts(
          accessToken,
          categoryId,
          productIds,
        ),
      );
    },

    archiveProduct(accessToken: string, productId: string): Promise<void> {
      return this.mutate(accessToken, () =>
        getCatalogStoreDependencies().catalogApi.archiveProduct(
          accessToken,
          productId,
        ),
      );
    },

    archiveModifierGroup(accessToken: string, groupId: string): Promise<void> {
      return this.mutate(accessToken, () =>
        getCatalogStoreDependencies().catalogApi.archiveModifierGroup(
          accessToken,
          groupId,
        ),
      );
    },

    createModifierOption(
      accessToken: string,
      groupId: string,
      option: Parameters<CatalogStoreActions["createModifierOption"]>[2],
    ): Promise<void> {
      return this.mutate(accessToken, () =>
        getCatalogStoreDependencies().catalogApi.createModifierOption(
          accessToken,
          groupId,
          option,
        ),
      );
    },

    updateModifierOption(
      accessToken: string,
      optionId: string,
      option: Parameters<CatalogStoreActions["updateModifierOption"]>[2],
    ): Promise<void> {
      return this.mutate(accessToken, () =>
        getCatalogStoreDependencies().catalogApi.updateModifierOption(
          accessToken,
          optionId,
          option,
        ),
      );
    },

    archiveModifierOption(
      accessToken: string,
      optionId: string,
    ): Promise<void> {
      return this.mutate(accessToken, () =>
        getCatalogStoreDependencies().catalogApi.archiveModifierOption(
          accessToken,
          optionId,
        ),
      );
    },

    replaceCategoryModifierGroups(
      accessToken: string,
      categoryId: string,
      assignments: readonly CategoryModifierGroupAssignment[],
    ): Promise<void> {
      return this.mutate(accessToken, () =>
        getCatalogStoreDependencies().catalogApi.replaceCategoryModifierGroups(
          accessToken,
          categoryId,
          assignments,
        ),
      );
    },

    saveModifierGroup(
      accessToken: string,
      group: Parameters<CatalogStoreActions["saveModifierGroup"]>[1],
    ): Promise<void> {
      return this.mutate(accessToken, () =>
        getCatalogStoreDependencies().catalogApi.saveModifierGroup(
          accessToken,
          group,
        ),
      );
    },

    mutate(
      accessToken: string,
      mutation: () => Promise<unknown>,
    ): Promise<void> {
      if (this.activeOperation !== null) {
        this.lastCommandSucceeded = false;
        return this.activeOperation;
      }

      return this.execute(accessToken, async () => {
        await mutation();
        return getCatalogStoreDependencies().catalogApi.getCatalog(accessToken);
      });
    },

    execute(
      accessToken: string,
      operation: () => Promise<CatalogApiResult>,
    ): Promise<void> {
      this.status = catalogStatuses.loading;
      this.error = null;
      this.fieldErrors = {};
      this.lastCommandSucceeded = false;

      const activeOperation = operation()
        .then((catalog) => {
          replaceCatalogState(this, catalog);
          this.status = catalogStatuses.ready;
          this.lastCommandSucceeded = true;
        })
        .catch((error: unknown) => {
          this.error = toCatalogStoreError(error);
          this.fieldErrors = toFieldErrors(error);
          this.status = catalogStatuses.error;
        })
        .finally(() => {
          this.activeOperation = null;
        });

      this.activeOperation = activeOperation;

      return activeOperation;
    },
  },
});

function replaceCatalogState(
  store: CatalogStoreState,
  catalog: CatalogApiResult,
): void {
  store.categories = catalog.categories.map(toCategory);
  store.categoryModifierGroupAssignments =
    catalog.categoryModifierGroupAssignments.map(
      toCategoryModifierGroupAssignment,
    );
  store.modifierGroups = catalog.modifierGroups.map(toModifierGroup);
  store.products = catalog.products.map(toProduct);
}

function toCategory(
  category: CatalogApiResult["categories"][number],
): Category {
  return { ...category };
}

function toProduct(product: CatalogApiResult["products"][number]): Product {
  return { ...product, variants: product.variants.map(toProductVariant) };
}

function toProductVariant(
  variant: CatalogApiResult["products"][number]["variants"][number],
): ProductVariant {
  return { ...variant };
}

function toModifierGroup(
  group: CatalogApiResult["modifierGroups"][number],
): ModifierGroup {
  return { ...group, options: group.options.map(toModifierOption) };
}

function toModifierOption(
  option: CatalogApiResult["modifierGroups"][number]["options"][number],
): ModifierOption {
  return { ...option };
}

function toCategoryModifierGroupAssignment(
  assignment: CatalogApiResult["categoryModifierGroupAssignments"][number],
): CategoryModifierGroupAssignment {
  return { ...assignment };
}

function toCatalogStoreError(error: unknown): CatalogStoreError {
  if (error instanceof CatalogApiError) {
    return { message: error.message, requestId: error.requestId };
  }

  return { message: catalogStoreMessages.requestFailed, requestId: null };
}

function toFieldErrors(error: unknown): CatalogFieldErrors {
  if (!(error instanceof CatalogApiError)) {
    return {};
  }

  return Object.fromEntries(
    error.fields.map((field) => [field.path, field.reason]),
  );
}
