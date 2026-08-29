import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CatalogApiError } from "../../../shared/api/catalog.api";
import { setCatalogStoreDependencies } from "./catalog.dependencies";
import { useCatalogStore } from "./catalog.store";
import type {
  CatalogApiResult,
  CatalogStoreDependencies,
} from "./catalog.types";

describe("catalog store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("объединяет одновременные загрузки и сохраняет ответ сервера", async () => {
    const deferred = createDeferred<CatalogApiResult>();
    const dependencies = createDependencies({
      getCatalog: vi.fn(() => deferred.promise),
    });
    setCatalogStoreDependencies(dependencies);
    const store = useCatalogStore();

    const firstLoad = store.load(accessToken);
    const secondLoad = store.load(accessToken);

    expect(store.status).toBe("loading");
    expect(dependencies.catalogApi.getCatalog).toHaveBeenCalledTimes(1);

    deferred.resolve(catalog);
    await Promise.all([firstLoad, secondLoad]);

    expect(store).toMatchObject({
      categories: catalog.categories,
      error: null,
      fieldErrors: {},
      modifierGroups: catalog.modifierGroups,
      products: catalog.products,
      status: "ready",
    });
  });

  it("сохраняет подтвержденные данные при ошибке загрузки и разрешает повтор", async () => {
    const getCatalog = vi
      .fn<() => Promise<CatalogApiResult>>()
      .mockRejectedValueOnce(new Error("Сеть недоступна"))
      .mockResolvedValueOnce(catalog);
    setCatalogStoreDependencies(createDependencies({ getCatalog }));
    const store = useCatalogStore();
    store.categories = catalog.categories;

    await store.load(accessToken);

    expect(store).toMatchObject({
      categories: catalog.categories,
      error: {
        message: "Не удалось выполнить действие с каталогом.",
        requestId: null,
      },
      status: "error",
    });

    await store.load(accessToken);

    expect(store).toMatchObject({
      categories: catalog.categories,
      error: null,
      status: "ready",
    });
    expect(getCatalog).toHaveBeenCalledTimes(2);
  });

  it("сохраняет валидированные ошибки полей без изменения подтвержденных данных", async () => {
    const createCategory = vi.fn().mockRejectedValue(
      new CatalogApiError({
        code: "VALIDATION_ERROR",
        fields: [{ path: "name", reason: "Введите название категории" }],
        message: "Категория не сохранена.",
        requestId: "request-42",
        status: 400,
      }),
    );
    const dependencies = createDependencies({ createCategory });
    setCatalogStoreDependencies(dependencies);
    const store = useCatalogStore();
    store.categories = catalog.categories;
    store.categoryModifierGroupAssignments =
      catalog.categoryModifierGroupAssignments;
    store.modifierGroups = catalog.modifierGroups;
    store.products = catalog.products;

    await store.createCategory(accessToken, categoryInput);

    expect(store).toMatchObject({
      categories: catalog.categories,
      categoryModifierGroupAssignments:
        catalog.categoryModifierGroupAssignments,
      error: { message: "Категория не сохранена.", requestId: "request-42" },
      fieldErrors: { name: "Введите название категории" },
      modifierGroups: catalog.modifierGroups,
      products: catalog.products,
      status: "error",
    });
    expect(dependencies.catalogApi.getCatalog).not.toHaveBeenCalled();
  });

  it("последовательно блокирует команды до завершения текущей", async () => {
    const deferred = createDeferred<void>();
    const dependencies = createDependencies({
      archiveCategory: vi.fn(() => deferred.promise),
    });
    setCatalogStoreDependencies(dependencies);
    const store = useCatalogStore();

    const firstCommand = store.archiveCategory(accessToken, "category-1");
    const secondCommand = store.archiveProduct(accessToken, "product-1");

    expect(dependencies.catalogApi.archiveCategory).toHaveBeenCalledTimes(1);
    expect(dependencies.catalogApi.archiveProduct).not.toHaveBeenCalled();

    deferred.resolve();
    await Promise.all([firstCommand, secondCommand]);

    expect(dependencies.catalogApi.getCatalog).toHaveBeenCalledTimes(1);
  });

  it("обновляет подтвержденный каталог после каждой команды", async () => {
    const dependencies = createDependencies();
    setCatalogStoreDependencies(dependencies);
    const store = useCatalogStore();

    await store.createCategory(accessToken, categoryInput);
    await store.updateCategory(accessToken, "category-1", categoryInput);
    await store.reorderCategories(accessToken, ["category-1"]);
    await store.archiveCategory(accessToken, "category-1");
    await store.createProduct(accessToken, productInput);
    await store.updateProduct(accessToken, "product-1", productInput);
    await store.reorderProducts(accessToken, "category-1", ["product-1"]);
    await store.archiveProduct(accessToken, "product-1");
    await store.archiveModifierGroup(accessToken, "group-1");
    await store.createModifierOption(
      accessToken,
      "group-1",
      modifierOptionInput,
    );
    await store.updateModifierOption(
      accessToken,
      "option-1",
      modifierOptionInput,
    );
    await store.archiveModifierOption(accessToken, "option-1");
    await store.replaceCategoryModifierGroups(accessToken, "category-1", [
      { categoryId: "category-1", modifierGroupId: "group-1", sortOrder: 0 },
    ]);

    expect(dependencies.catalogApi.getCatalog).toHaveBeenCalledTimes(13);
    expect(store).toMatchObject({
      categories: catalog.categories,
      categoryModifierGroupAssignments:
        catalog.categoryModifierGroupAssignments,
      modifierGroups: catalog.modifierGroups,
      products: catalog.products,
      status: "ready",
    });
  });

  it("сохраняет aggregate группы и перезагружает каталог", async () => {
    const dependencies = createDependencies();
    setCatalogStoreDependencies(dependencies);
    const store = useCatalogStore();
    const aggregate = {
      isActive: true,
      maxSelect: 1,
      minSelect: 0,
      name: "Молоко",
      selectionType: "single" as const,
      options: [
        {
          isAvailable: true,
          isDefault: false,
          name: "Овсяное",
          priceDelta: 50,
          sortOrder: 0,
        },
      ],
    };

    await store.saveModifierGroup(accessToken, aggregate);

    expect(dependencies.catalogApi.saveModifierGroup).toHaveBeenCalledWith(
      accessToken,
      aggregate,
    );
    expect(dependencies.catalogApi.getCatalog).toHaveBeenCalledTimes(1);
    expect(store.status).toBe("ready");
  });

  it("не запускает aggregate повторно пока команда занята", async () => {
    const deferred =
      createDeferred<CatalogApiResult["modifierGroups"][number]>();
    const dependencies = createDependencies({
      saveModifierGroup: vi.fn(() => deferred.promise),
    });
    setCatalogStoreDependencies(dependencies);
    const store = useCatalogStore();
    const aggregate = {
      isActive: true,
      maxSelect: 1,
      minSelect: 0,
      name: "Молоко",
      selectionType: "single" as const,
      options: [],
    };
    const first = store.saveModifierGroup(accessToken, aggregate);
    const second = store.saveModifierGroup(accessToken, aggregate);
    expect(dependencies.catalogApi.saveModifierGroup).toHaveBeenCalledTimes(1);
    deferred.resolve(catalog.modifierGroups[0]);
    await Promise.all([first, second]);
  });

  it("сохраняет contextual error aggregate", async () => {
    const dependencies = createDependencies({
      saveModifierGroup: vi.fn().mockRejectedValue(
        new CatalogApiError({
          code: "VALIDATION_ERROR",
          fields: [{ path: "options.0.name", reason: "Обязательно" }],
          message: "Ошибка",
          requestId: null,
          status: 400,
        }),
      ),
    });
    setCatalogStoreDependencies(dependencies);
    const store = useCatalogStore();
    await store.saveModifierGroup(accessToken, {
      isActive: true,
      maxSelect: 1,
      minSelect: 0,
      name: "Молоко",
      selectionType: "single",
      options: [],
    });
    expect(store.fieldErrors).toMatchObject({
      "options.0.name": "Обязательно",
    });
  });
});

function createDependencies(
  overrides: Partial<CatalogStoreDependencies["catalogApi"]> = {},
): CatalogStoreDependencies {
  return {
    catalogApi: {
      archiveCategory: vi.fn().mockResolvedValue(undefined),
      archiveModifierGroup: vi.fn().mockResolvedValue(undefined),
      archiveModifierOption: vi.fn().mockResolvedValue(undefined),
      archiveProduct: vi.fn().mockResolvedValue(undefined),
      createCategory: vi.fn().mockResolvedValue(catalog.categories[0]),
      createModifierOption: vi
        .fn()
        .mockResolvedValue(catalog.modifierGroups[0].options[0]),
      createProduct: vi.fn().mockResolvedValue(catalog.products[0]),
      getCatalog: vi.fn().mockResolvedValue(catalog),
      reorderCategories: vi.fn().mockResolvedValue(catalog.categories),
      reorderProducts: vi.fn().mockResolvedValue(catalog.products),
      saveModifierGroup: vi.fn().mockResolvedValue(undefined),
      replaceCategoryModifierGroups: vi
        .fn()
        .mockResolvedValue(catalog.categoryModifierGroupAssignments),
      updateCategory: vi.fn().mockResolvedValue(catalog.categories[0]),
      updateModifierOption: vi
        .fn()
        .mockResolvedValue(catalog.modifierGroups[0].options[0]),
      updateProduct: vi.fn().mockResolvedValue(catalog.products[0]),
      ...overrides,
    },
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

const accessToken = "access-token";

const categoryInput = {
  description: "Напитки",
  isActive: true,
  name: "Кофе",
  sortOrder: 0,
};

const productInput = {
  categoryId: "category-1",
  description: "Кофе с молоком",
  isActive: true,
  isAvailable: true,
  name: "Латте",
  price: 250,
  sortOrder: 0,
  type: "OTHER" as const,
  variants: [],
};

const modifierGroupInput = {
  isActive: true,
  maxSelect: 1,
  minSelect: 0,
  name: "Молоко",
  selectionType: "single" as const,
};

const modifierOptionInput = {
  isAvailable: true,
  isDefault: false,
  name: "Овсяное",
  priceDelta: 50,
  sortOrder: 0,
};

const catalog = {
  categories: [{ ...categoryInput, id: "category-1" }],
  categoryModifierGroupAssignments: [
    { categoryId: "category-1", modifierGroupId: "group-1", sortOrder: 0 },
  ],
  modifierGroups: [
    {
      ...modifierGroupInput,
      id: "group-1",
      options: [{ ...modifierOptionInput, groupId: "group-1", id: "option-1" }],
    },
  ],
  products: [{ ...productInput, id: "product-1" }],
} satisfies CatalogApiResult;
