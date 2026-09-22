import { defineStore } from "pinia";

import {
  getOperationPort,
  type OperationContext,
  type OperationResult,
} from "../../../shared/lib/operations/operation-port";
import {
  catalogStatuses,
  catalogStoreId,
  initialCatalogStoreState,
} from "./catalog.constants";
import { getCatalogStoreDependencies } from "./catalog.dependencies";
import type {
  CatalogApiResult,
  CatalogFieldErrors,
  CatalogStoreActions,
  CatalogStoreState,
  Category,
  CategoryModifierGroupAssignment,
  ModifierGroup,
  ModifierOption,
  Product,
  ProductPriceChoice,
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

    refresh(accessToken: string): Promise<void> {
      if (this.activeOperation !== null) return this.activeOperation;
      return this.execute(accessToken, () =>
        getCatalogStoreDependencies().catalogApi.getCatalog(accessToken),
      );
    },

    resetFormSaveOutcome(): void {
      this.fieldErrors = {};
      this.formSaveError = null;
      this.formSaveOutcome = "idle";
    },

    createCategory(
      accessToken: string,
      category: Parameters<CatalogStoreActions["createCategory"]>[1],
    ): Promise<void> {
      return this.saveCatalogForm(accessToken, () =>
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
      return this.saveCatalogForm(accessToken, () =>
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
      return this.saveCatalogForm(accessToken, () =>
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
      return this.saveCatalogForm(accessToken, () =>
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
      return this.saveCatalogForm(accessToken, () =>
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
      return this.saveCatalogForm(accessToken, () =>
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

    saveCatalogForm(
      accessToken: string,
      mutation: () => Promise<unknown>,
    ): Promise<void> {
      if (this.activeOperation !== null) return this.activeOperation;

      this.status = catalogStatuses.loading;
      this.error = null;
      this.fieldErrors = {};
      this.lastCommandSucceeded = false;
      this.formSaveError = null;
      this.formSaveOutcome = "idle";
      const activeOperation = operationPort
        .run(
          catalogContext("catalog.form.save", "catalog", "mutation"),
          mutation,
        )
        .then(async (result) => {
          if (result.status !== "success") {
            this.fieldErrors = fieldErrors(result);
            this.formSaveOutcome =
              result.status === "fieldValidation" ? "rejected" : "unconfirmed";
            this.status = catalogStatuses.ready;
            return;
          }
          this.formSaveOutcome = "saved";
          this.lastCommandSucceeded = true;
          operationPort.publishOutcome(
            "catalog.saved",
            catalogContext("catalog.form.save", "catalog", "mutation"),
          );
          const catalogResult = await operationPort.run(
            catalogContext("catalog.reconcile", "catalog", "read"),
            () =>
              getCatalogStoreDependencies().catalogApi.getCatalog(accessToken),
          );
          if (catalogResult.status === "success") {
            const catalog = catalogResult.value;
            replaceCatalogState(this, catalog);
            this.status = catalogStatuses.ready;
          } else {
            this.status = catalogStatuses.ready;
          }
        })
        .finally(() => {
          this.activeOperation = null;
        });
      this.activeOperation = activeOperation;
      return activeOperation;
    },

    execute(
      accessToken: string,
      operation: () => Promise<CatalogApiResult>,
    ): Promise<void> {
      this.status = catalogStatuses.loading;
      this.error = null;
      this.fieldErrors = {};
      this.lastCommandSucceeded = false;
      this.resetFormSaveOutcome();

      const activeOperation = operationPort
        .run(catalogContext("catalog.read", "catalog", "read"), operation)
        .then((result) => {
          if (result.status !== "success") {
            this.fieldErrors = fieldErrors(result);
            this.status = hasCatalog(this)
              ? catalogStatuses.ready
              : catalogStatuses.idle;
            return;
          }
          const catalog = result.value;
          replaceCatalogState(this, catalog);
          this.status = catalogStatuses.ready;
          this.lastCommandSucceeded = true;
        })
        .finally(() => {
          this.activeOperation = null;
        });

      this.activeOperation = activeOperation;

      return activeOperation;
    },
  },
});

const operationPort = getOperationPort();
const catalogEpoch = crypto.randomUUID();
const catalogFieldTargets: NonNullable<OperationContext["fieldTargets"]> = {
  categoryId: { path: "categoryId" },
  description: { path: "description" },
  isActive: { path: "isActive" },
  maxSelect: { path: "maxSelect" },
  minSelect: { path: "minSelect" },
  name: { path: "name" },
  price: { path: "price" },
  selectionType: { path: "selectionType" },
};

function catalogContext(
  operationKey: string,
  resourceKey: string,
  kind: OperationContext["kind"],
): OperationContext {
  return {
    attemptId: crypto.randomUUID(),
    epoch: catalogEpoch,
    fieldTargets: kind === "mutation" ? catalogFieldTargets : undefined,
    kind,
    operationKey,
    origin: "user",
    resourceKey,
  };
}

function fieldErrors(result: OperationResult<unknown>): CatalogFieldErrors {
  return result.status === "fieldValidation"
    ? Object.fromEntries(
        result.fields.map((field) => [field.path, field.message]),
      )
    : {};
}

function hasCatalog(store: CatalogStoreState): boolean {
  return (
    store.categories.length > 0 ||
    store.products.length > 0 ||
    store.modifierGroups.length > 0
  );
}

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
  return {
    ...product,
    portionLabel: product.portionLabel ?? null,
    priceChoices: (product.priceChoices ?? []).map(toProductPriceChoice),
  };
}

function toProductPriceChoice(choice: ProductPriceChoice): ProductPriceChoice {
  return { ...choice };
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
