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

  it.each(["create", "update"] as const)(
    "разрешает %s категории после 400 с исправленными данными",
    async (command) => {
      const rejectedWrite = new CatalogApiError({
        code: "VALIDATION_ERROR",
        fields: [{ path: "name", reason: "Введите название категории" }],
        message: "Категория не сохранена.",
        requestId: "request-42",
        status: 400,
      });
      const write = vi
        .fn()
        .mockRejectedValueOnce(rejectedWrite)
        .mockResolvedValueOnce(catalog.categories[0]);
      const dependencies = createDependencies({
        createCategory: command === "create" ? write : vi.fn(),
        updateCategory: command === "update" ? write : vi.fn(),
      });
      setCatalogStoreDependencies(dependencies);
      const store = useCatalogStore();
      store.categories = catalog.categories;
      store.categoryModifierGroupAssignments =
        catalog.categoryModifierGroupAssignments;
      store.modifierGroups = catalog.modifierGroups;
      store.products = catalog.products;

      if (command === "create") {
        await store.createCategory(accessToken, categoryInput);
      } else {
        await store.updateCategory(accessToken, "category-1", categoryInput);
      }

      expect(store).toMatchObject({
        categories: catalog.categories,
        fieldErrors: { name: "Введите название категории" },
        formSaveOutcome: "rejected",
        status: "ready",
      });
      expect(dependencies.catalogApi.getCatalog).not.toHaveBeenCalled();

      const correctedInput = { ...categoryInput, name: "Чай" };
      if (command === "create") {
        await store.createCategory(accessToken, correctedInput);
      } else {
        await store.updateCategory(accessToken, "category-1", correctedInput);
      }

      expect(write).toHaveBeenCalledTimes(2);
      expect(write).toHaveBeenLastCalledWith(
        accessToken,
        ...(command === "update" ? ["category-1"] : []),
        correctedInput,
      );
      expect(dependencies.catalogApi.getCatalog).toHaveBeenCalledTimes(1);
      expect(store).toMatchObject({
        fieldErrors: {},
        formSaveOutcome: "saved",
        lastCommandSucceeded: true,
        status: "ready",
      });
    },
  );

  it("сохраняет guidance rejected категории до явного reset, который очищает feedback без HTTP или изменения каталога", async () => {
    const rejectedWrite = new CatalogApiError({
      code: "VALIDATION_ERROR",
      fields: [
        { path: "name", reason: "Имя занято" },
        { path: "description", reason: "Описание слишком длинное" },
        { path: "isActive", reason: "Статус недоступен" },
      ],
      message: "Категория не сохранена.",
      requestId: "request-42",
      status: 400,
    });
    const dependencies = createDependencies({
      createCategory: vi.fn().mockRejectedValue(rejectedWrite),
    });
    setCatalogStoreDependencies(dependencies);
    const store = useCatalogStore();
    store.categories = catalog.categories;
    const categoriesBeforeReset = store.categories;

    await store.createCategory(accessToken, categoryInput);

    expect(store).toMatchObject({
      fieldErrors: {
        description: "Описание слишком длинное",
        isActive: "Статус недоступен",
        name: "Имя занято",
      },
      formSaveOutcome: "rejected",
      status: "ready",
    });

    store.resetFormSaveOutcome();

    expect(store).toMatchObject({
      fieldErrors: {},
      formSaveError: null,
      formSaveOutcome: "idle",
    });
    expect(store.categories).toBe(categoriesBeforeReset);
    expect(dependencies.catalogApi.createCategory).toHaveBeenCalledTimes(1);
    expect(dependencies.catalogApi.getCatalog).not.toHaveBeenCalled();
  });

  it.each([
    [
      "create",
      "500",
      new CatalogApiError({
        code: "INTERNAL_ERROR",
        fields: [],
        message: "Ошибка",
        requestId: null,
        status: 500,
      }),
    ],
    ["create", "network", new Error("Сеть недоступна")],
    ["create", "invalid acknowledgement", new Error("Некорректный ответ")],
    [
      "update",
      "500",
      new CatalogApiError({
        code: "INTERNAL_ERROR",
        fields: [],
        message: "Ошибка",
        requestId: null,
        status: 500,
      }),
    ],
    ["update", "network", new Error("Сеть недоступна")],
    ["update", "invalid acknowledgement", new Error("Некорректный ответ")],
  ] as const)(
    "сохраняет неопределённый outcome категории при %s %s",
    async (command, _failure, error) => {
      const dependencies = createDependencies(
        command === "create"
          ? { createCategory: vi.fn().mockRejectedValue(error) }
          : { updateCategory: vi.fn().mockRejectedValue(error) },
      );
      setCatalogStoreDependencies(dependencies);
      const store = useCatalogStore();

      if (command === "create") {
        await store.createCategory(accessToken, categoryInput);
      } else {
        await store.updateCategory(accessToken, "category-1", categoryInput);
      }

      expect(store).toMatchObject({
        formSaveOutcome: "unconfirmed",
        status: "ready",
      });
      expect(dependencies.catalogApi.getCatalog).not.toHaveBeenCalled();
    },
  );

  it.each(["create", "update"] as const)(
    "сохраняет acknowledged %s категории при ошибке последующего чтения",
    async (command) => {
      const write = vi.fn().mockResolvedValue(catalog.categories[0]);
      const dependencies = createDependencies({
        createCategory: command === "create" ? write : vi.fn(),
        getCatalog: vi.fn().mockRejectedValue(new Error("Сеть недоступна")),
        updateCategory: command === "update" ? write : vi.fn(),
      });
      setCatalogStoreDependencies(dependencies);
      const store = useCatalogStore();

      if (command === "create") {
        await store.createCategory(accessToken, categoryInput);
      } else {
        await store.updateCategory(accessToken, "category-1", categoryInput);
      }

      expect(store).toMatchObject({
        formSaveOutcome: "saved",
        lastCommandSucceeded: true,
        status: "error",
      });
      expect(write).toHaveBeenCalledTimes(1);
      expect(dependencies.catalogApi.getCatalog).toHaveBeenCalledTimes(1);
    },
  );

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

  it("держит DELETE группы единственной операцией до подтверждения и чтения", async () => {
    const deferredDelete = createDeferred<void>();
    const dependencies = createDependencies({
      archiveModifierGroup: vi.fn(() => deferredDelete.promise),
    });
    setCatalogStoreDependencies(dependencies);
    const store = useCatalogStore();

    const firstArchive = store.archiveModifierGroup(accessToken, "group-1");
    const secondArchive = store.archiveModifierGroup(accessToken, "group-1");

    expect(dependencies.catalogApi.archiveModifierGroup).toHaveBeenCalledTimes(
      1,
    );
    expect(dependencies.catalogApi.getCatalog).not.toHaveBeenCalled();
    expect(store.status).toBe("loading");

    deferredDelete.resolve();
    await Promise.all([firstArchive, secondArchive]);

    expect(dependencies.catalogApi.getCatalog).toHaveBeenCalledTimes(1);
    expect(store).toMatchObject({
      formSaveOutcome: "saved",
      lastCommandSucceeded: true,
      status: "ready",
    });
  });

  it.each([
    [
      "отказе DELETE",
      new CatalogApiError({
        code: "VALIDATION_ERROR",
        fields: [],
        message: "Группа не архивирована.",
        requestId: "request-42",
        status: 400,
      }),
      "rejected",
    ],
    [
      "ошибке 500 DELETE",
      new CatalogApiError({
        code: "INTERNAL_ERROR",
        fields: [],
        message: "Ошибка сервера.",
        requestId: "request-500",
        status: 500,
      }),
      "unconfirmed",
    ],
    [
      "неизвестном результате DELETE",
      new Error("Сеть недоступна"),
      "unconfirmed",
    ],
  ] as const)(
    "не читает каталог после %s",
    async (_caseName, archiveError, formSaveOutcome) => {
      const dependencies = createDependencies({
        archiveModifierGroup: vi.fn().mockRejectedValue(archiveError),
      });
      setCatalogStoreDependencies(dependencies);
      const store = useCatalogStore();

      await store.archiveModifierGroup(accessToken, "group-1");

      expect(
        dependencies.catalogApi.archiveModifierGroup,
      ).toHaveBeenCalledTimes(1);
      expect(dependencies.catalogApi.getCatalog).not.toHaveBeenCalled();
      expect(store).toMatchObject({
        formSaveOutcome,
        lastCommandSucceeded: false,
        status: "ready",
      });
    },
  );

  it.each([
    ["обновлённом меню", vi.fn().mockResolvedValue(catalog), "ready"],
    [
      "ошибке GET",
      vi.fn().mockRejectedValue(new Error("Меню не обновлено")),
      "error",
    ],
  ] as const)(
    "сохраняет acknowledgement DELETE при %s",
    async (_caseName, getCatalog, status) => {
      const dependencies = createDependencies({ getCatalog });
      setCatalogStoreDependencies(dependencies);
      const store = useCatalogStore();

      await store.archiveModifierGroup(accessToken, "group-1");

      expect(
        dependencies.catalogApi.archiveModifierGroup,
      ).toHaveBeenCalledTimes(1);
      expect(getCatalog).toHaveBeenCalledTimes(1);
      expect(store).toMatchObject({
        formSaveOutcome: "saved",
        lastCommandSucceeded: true,
        status,
      });
    },
  );

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

  it.each(["saved", "unconfirmed"] as const)(
    "различает %s aggregate группы без повторной записи при GET recovery",
    async (outcome) => {
      const saveModifierGroup = vi
        .fn()
        .mockImplementation(() =>
          outcome === "saved"
            ? Promise.resolve(undefined)
            : Promise.reject(new Error("Сеть недоступна")),
        );
      const dependencies = createDependencies({
        getCatalog:
          outcome === "saved"
            ? vi.fn().mockRejectedValue(new Error("Меню не обновлено"))
            : vi.fn().mockResolvedValue(catalog),
        saveModifierGroup,
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

      await store.saveModifierGroup(accessToken, aggregate);
      expect(store.formSaveOutcome).toBe(outcome);
      expect(saveModifierGroup).toHaveBeenCalledTimes(1);
      expect(dependencies.catalogApi.getCatalog).toHaveBeenCalledTimes(
        outcome === "saved" ? 1 : 0,
      );

      if (outcome === "unconfirmed") {
        await store.refresh(accessToken);
        expect(dependencies.catalogApi.getCatalog).toHaveBeenCalledTimes(1);
        expect(saveModifierGroup).toHaveBeenCalledTimes(1);
      }
    },
  );

  it("сохраняет acknowledged товар при ошибке последующего чтения", async () => {
    const dependencies = createDependencies({
      getCatalog: vi.fn().mockRejectedValue(new Error("Сеть недоступна")),
    });
    setCatalogStoreDependencies(dependencies);
    const store = useCatalogStore();

    await store.createProduct(accessToken, productInput);

    expect(store).toMatchObject({
      lastCommandSucceeded: true,
      formSaveOutcome: "saved",
      status: "error",
    });
    expect(dependencies.catalogApi.createProduct).toHaveBeenCalledTimes(1);
    expect(dependencies.catalogApi.getCatalog).toHaveBeenCalledTimes(1);
  });

  it("не разрешает повторную запись после uncertain ошибки товара", async () => {
    const dependencies = createDependencies({
      createProduct: vi.fn().mockRejectedValue(new Error("Сеть недоступна")),
    });
    setCatalogStoreDependencies(dependencies);
    const store = useCatalogStore();

    await store.createProduct(accessToken, productInput);

    expect(store).toMatchObject({
      lastCommandSucceeded: false,
      formSaveOutcome: "unconfirmed",
      status: "ready",
    });
    expect(dependencies.catalogApi.getCatalog).not.toHaveBeenCalled();
  });

  it("сбрасывает product outcome перед несвязанной командой каталога", async () => {
    const archiveCategory = vi
      .fn()
      .mockRejectedValue(new Error("Сеть недоступна"));
    setCatalogStoreDependencies(createDependencies({ archiveCategory }));
    const store = useCatalogStore();

    await store.createProduct(accessToken, productInput);
    expect(store.formSaveOutcome).toBe("saved");

    await store.archiveCategory(accessToken, "category-1");

    expect(store).toMatchObject({
      formSaveError: null,
      formSaveOutcome: "idle",
      status: "error",
    });
  });

  it("сбрасывает unconfirmed product outcome при GET-only recovery", async () => {
    const dependencies = createDependencies({
      createProduct: vi.fn().mockRejectedValue(new Error("Сеть недоступна")),
    });
    setCatalogStoreDependencies(dependencies);
    const store = useCatalogStore();

    await store.createProduct(accessToken, productInput);
    await store.refresh(accessToken);

    expect(store).toMatchObject({
      formSaveError: null,
      formSaveOutcome: "idle",
      status: "ready",
    });
    expect(dependencies.catalogApi.createProduct).toHaveBeenCalledTimes(1);
    expect(dependencies.catalogApi.getCatalog).toHaveBeenCalledTimes(1);
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
