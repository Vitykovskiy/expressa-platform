import { createPinia, setActivePinia } from "pinia";
import { mount, type DOMWrapper, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const session = { accessToken: "access-token" };

vi.mock("../app/session.store", () => ({ useSessionStore: () => session }));

import MenuPage from "./MenuPage.vue";
import { CatalogApiError } from "../shared/api/catalog.api";
import { setCatalogStoreDependencies } from "./admin/menu/catalog.dependencies";
import { useCatalogStore } from "./admin/menu/catalog.store";
import type { ProductFormData } from "./admin/menu/AddProductDialog.types";
import AdminDialog from "../shared/ui/admin/admin-dialog/AdminDialog.vue";

const catalog = {
  categories: [
    {
      id: "category-coffee",
      name: "Кофе",
      description: "",
      sortOrder: 1,
      isActive: true,
    },
  ],
  products: [],
  modifierGroups: [],
  categoryModifierGroupAssignments: [],
};
const mountedWrappers: VueWrapper[] = [];

describe("MenuPage", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    setCatalogStoreDependencies({
      catalogApi: {
        getCatalog: vi.fn().mockResolvedValue(catalog),
        createCategory: vi.fn(),
        updateCategory: vi.fn(),
        reorderCategories: vi.fn(),
        archiveCategory: vi.fn(),
        createProduct: vi.fn(),
        updateProduct: vi.fn(),
        reorderProducts: vi.fn(),
        archiveProduct: vi.fn(),
        archiveModifierGroup: vi.fn(),
        createModifierOption: vi.fn(),
        updateModifierOption: vi.fn(),
        archiveModifierOption: vi.fn(),
        replaceCategoryModifierGroups: vi.fn(),
        saveModifierGroup: vi.fn(),
      },
    });
  });

  afterEach(() => {
    for (const wrapper of mountedWrappers.splice(0)) wrapper.unmount();
  });

  it("рендерит готовый каталог до монтирования страницы", () => {
    const store = useCatalogStore();
    store.$patch({ ...catalog, status: "ready" });
    vi.spyOn(store, "load").mockResolvedValue();

    const wrapper = mountPage();

    expect(wrapper.text()).toContain("Кофе");
    expect(wrapper.find(".modifier-group-editor").exists()).toBe(false);
  });

  it("открывает редактор для новой и существующей группы", async () => {
    const store = useCatalogStore();
    store.$patch({
      ...catalog,
      modifierGroups: [modifierGroup()],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const wrapper = mountPage();

    await openManagement(wrapper);
    await clickButton(wrapper, "Новая группа опций");
    expect(
      wrapper.getComponent({ name: "ModifierGroupEditor" }).props("group"),
    ).toBeNull();

    await clickButton(wrapper, "Отмена");
    await wrapper
      .get('button[aria-label="Редактировать группу опций Молоко"]')
      .trigger("click");
    expect(
      wrapper.getComponent({ name: "ModifierGroupEditor" }).props("group"),
    ).toMatchObject({
      id: "group-milk",
    });
  });

  it("закрывает редактор по отмене и возвращает фокус кнопке открытия", async () => {
    const store = useCatalogStore();
    store.$patch({ ...catalog, status: "ready" });
    vi.spyOn(store, "load").mockResolvedValue();
    const wrapper = mountPage();
    await openManagement(wrapper);
    const trigger = buttonByText(wrapper, "Новая группа опций");
    const focus = vi.spyOn(trigger.element, "focus");

    trigger.element.focus();
    await trigger.trigger("click");
    await clickButton(wrapper, "Отмена");
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".modifier-group-editor").exists()).toBe(false);
    expect(focus).toHaveBeenCalled();
  });

  it("сохраняет группу и закрывает редактор только после успешного ответа", async () => {
    const store = useCatalogStore();
    store.$patch({ ...catalog, status: "ready" });
    vi.spyOn(store, "load").mockResolvedValue();
    const saveGroup = vi
      .spyOn(store, "saveModifierGroup")
      .mockImplementation(async () => {
        store.lastCommandSucceeded = true;
      });
    const wrapper = mountPage();

    await openManagement(wrapper);
    await clickButton(wrapper, "Новая группа опций");
    await wrapper
      .get('.modifier-group-editor input[type="text"]')
      .setValue("Сиропы");
    await clickButton(wrapper, "Сохранить группу");

    expect(saveGroup).toHaveBeenCalledWith(
      "access-token",
      expect.objectContaining({ name: "Сиропы" }),
    );
    expect(wrapper.find(".modifier-group-editor").exists()).toBe(false);
  });

  it("оставляет редактор и черновик открытыми при серверной ошибке", async () => {
    const store = useCatalogStore();
    store.$patch({ ...catalog, status: "ready" });
    vi.spyOn(store, "load").mockResolvedValue();
    vi.spyOn(store, "saveModifierGroup").mockImplementation(async () => {
      store.fieldErrors = { name: "Группа уже существует" };
    });
    const wrapper = mountPage();

    await openManagement(wrapper);
    await clickButton(wrapper, "Новая группа опций");
    const input = wrapper.get('.modifier-group-editor input[type="text"]');
    await input.setValue("Сиропы");
    await clickButton(wrapper, "Сохранить группу");

    expect(wrapper.find(".modifier-group-editor").exists()).toBe(true);
    expect((input.element as HTMLInputElement).value).toBe("Сиропы");
  });

  it.each(["create", "edit"] as const)(
    "повторно отправляет исправленную %s группу после 400 и показывает новый rejection",
    async (mode) => {
      const rejectedWrite = new CatalogApiError({
        code: "VALIDATION_ERROR",
        fields: [{ path: "name", reason: "Название уже используется" }],
        message: "Группа не сохранена.",
        requestId: "request-42",
        status: 400,
      });
      const saveModifierGroup = vi
        .fn()
        .mockRejectedValueOnce(rejectedWrite)
        .mockRejectedValueOnce(rejectedWrite);
      setCatalogStoreDependencies({
        catalogApi: {
          archiveCategory: vi.fn(),
          archiveModifierGroup: vi.fn(),
          archiveModifierOption: vi.fn(),
          archiveProduct: vi.fn(),
          createCategory: vi.fn(),
          createModifierOption: vi.fn(),
          createProduct: vi.fn(),
          getCatalog: vi.fn().mockResolvedValue(catalog),
          reorderCategories: vi.fn(),
          reorderProducts: vi.fn(),
          replaceCategoryModifierGroups: vi.fn(),
          saveModifierGroup,
          updateCategory: vi.fn(),
          updateModifierOption: vi.fn(),
          updateProduct: vi.fn(),
        },
      });
      const store = useCatalogStore();
      store.$patch({
        ...catalog,
        modifierGroups: mode === "edit" ? [modifierGroup()] : [],
        status: "ready",
      });
      vi.spyOn(store, "load").mockResolvedValue();
      const wrapper = mountPage();

      if (mode === "create") {
        await openManagement(wrapper);
        await clickButton(wrapper, "Новая группа опций");
      } else {
        await wrapper
          .get('button[aria-label="Редактировать группу опций Молоко"]')
          .trigger("click");
      }
      const input = wrapper.get('.modifier-group-editor input[type="text"]');
      await input.setValue("Сиропы");
      await clickButton(wrapper, "Сохранить группу");
      await vi.waitFor(() =>
        expect(saveModifierGroup).toHaveBeenCalledTimes(1),
      );
      expect(wrapper.text()).toContain("Название уже используется");

      await input.setValue("Исправленные сиропы");
      await clickButton(wrapper, "Сохранить группу");
      await vi.waitFor(() =>
        expect(saveModifierGroup).toHaveBeenCalledTimes(2),
      );

      expect(saveModifierGroup).toHaveBeenLastCalledWith(
        "access-token",
        expect.objectContaining({
          id: mode === "edit" ? "group-milk" : undefined,
          name: "Исправленные сиропы",
          options: [],
        }),
      );
      expect(store.formSaveOutcome).toBe("rejected");
      expect(wrapper.text()).toContain("Название уже используется");
    },
  );

  it.each(["unconfirmed", "checked", "saved"] as const)(
    "не повторяет группу при outcome %s",
    async (outcome) => {
      const catalogApi = {
        archiveCategory: vi.fn(),
        archiveModifierGroup: vi.fn(),
        archiveModifierOption: vi.fn(),
        archiveProduct: vi.fn(),
        createCategory: vi.fn(),
        createModifierOption: vi.fn(),
        createProduct: vi.fn(),
        getCatalog: vi.fn().mockResolvedValue(catalog),
        reorderCategories: vi.fn(),
        reorderProducts: vi.fn(),
        replaceCategoryModifierGroups: vi.fn(),
        saveModifierGroup: vi.fn(),
        updateCategory: vi.fn(),
        updateModifierOption: vi.fn(),
        updateProduct: vi.fn(),
      };
      setCatalogStoreDependencies({ catalogApi });
      const store = useCatalogStore();
      store.$patch({ ...catalog, status: "ready" });
      vi.spyOn(store, "load").mockResolvedValue();
      const wrapper = mountPage();

      await openManagement(wrapper);
      await clickButton(wrapper, "Новая группа опций");
      store.$patch({ formSaveOutcome: outcome });
      await wrapper.vm.$nextTick();
      wrapper.getComponent({ name: "ModifierGroupEditor" }).vm.$emit("save", {
        isActive: true,
        maxSelect: 1,
        minSelect: 0,
        name: "Сиропы",
        options: [],
        selectionType: "single",
      });
      await wrapper.vm.$nextTick();

      expect(catalogApi.saveModifierGroup).not.toHaveBeenCalled();
    },
  );

  it("оставляет uncertain группу в форме для GET-only recovery без повтора сохранения", async () => {
    const store = useCatalogStore();
    store.$patch({ ...catalog, status: "ready" });
    vi.spyOn(store, "load").mockResolvedValue();
    const saveGroup = vi
      .spyOn(store, "saveModifierGroup")
      .mockImplementation(async () => {
        store.$patch({
          formSaveError: { message: "Ответ не получен", requestId: null },
          formSaveOutcome: "unconfirmed",
          status: "ready",
        });
      });
    const refresh = vi.spyOn(store, "refresh").mockImplementation(async () => {
      store.$patch({ formSaveOutcome: "idle", status: "ready" });
    });
    const wrapper = mountPage();

    await openManagement(wrapper);
    await clickButton(wrapper, "Новая группа опций");
    await wrapper
      .get('.modifier-group-editor input[type="text"]')
      .setValue("Сиропы");
    await clickButton(wrapper, "Сохранить группу");
    await vi.waitFor(() => expect(saveGroup).toHaveBeenCalledTimes(1));
    expect(wrapper.text()).toContain("не повторяя сохранение");
    expect(
      wrapper.get(".modifier-group-editor fieldset").attributes("disabled"),
    ).toBeDefined();

    await clickButton(wrapper, "Обновить меню");
    await vi.waitFor(() =>
      expect(refresh).toHaveBeenCalledWith("access-token"),
    );
    expect(saveGroup).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain("Меню обновлено. Закройте форму");
  });

  it("показывает pending modifier save и acknowledged refetch только внутри формы", async () => {
    const store = useCatalogStore();
    store.$patch({ ...catalog, status: "ready" });
    vi.spyOn(store, "load").mockResolvedValue();
    const pendingSave = createDeferred<void>();
    vi.spyOn(store, "saveModifierGroup").mockImplementation(async () => {
      store.$patch({ status: "loading" });
      await pendingSave.promise;
      store.$patch({ formSaveOutcome: "saved", status: "ready" });
    });
    const wrapper = mountPage();

    await openManagement(wrapper);
    await clickButton(wrapper, "Новая группа опций");
    await wrapper
      .get('.modifier-group-editor input[type="text"]')
      .setValue("Сиропы");
    await clickButton(wrapper, "Сохранить группу");
    await vi.waitFor(() =>
      expect(store.saveModifierGroup).toHaveBeenCalledTimes(1),
    );

    expect(wrapper.get('[role="status"]').text()).toContain(
      "Сохраняем группу…",
    );
    expect(wrapper.text()).not.toContain("Загружаем меню…");
    expect(wrapper.text()).not.toContain("Загрузка группы добавок…");
    expect(
      wrapper.get(".modifier-group-editor fieldset").attributes("disabled"),
    ).toBeDefined();

    store.$patch({ formSaveOutcome: "saved" });
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[role="status"]').text()).toContain(
      "Группа сохранена. Обновляем меню…",
    );

    pendingSave.resolve();
    await vi.waitFor(() =>
      expect(wrapper.get('[role="status"]').text()).toBe("Группа сохранена."),
    );
    expect(wrapper.text()).not.toContain("Обновляем меню…");
  });

  it("сохраняет edit draft и показывает pending фазы aggregate save", async () => {
    const store = useCatalogStore();
    store.$patch({
      ...catalog,
      modifierGroups: [modifierGroup()],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const pendingSave = createDeferred<void>();
    vi.spyOn(store, "saveModifierGroup").mockImplementation(async () => {
      store.$patch({ status: "loading" });
      await pendingSave.promise;
      store.$patch({ formSaveOutcome: "saved", status: "ready" });
    });
    const wrapper = mountPage();

    await wrapper
      .get('button[aria-label="Редактировать группу опций Молоко"]')
      .trigger("click");
    const input = wrapper.get('.modifier-group-editor input[type="text"]');
    await input.setValue("Овсяное молоко");
    await clickButton(wrapper, "Сохранить группу");
    await vi.waitFor(() =>
      expect(store.saveModifierGroup).toHaveBeenCalledWith(
        "access-token",
        expect.objectContaining({ id: "group-milk", name: "Овсяное молоко" }),
      ),
    );

    expect(wrapper.get('[role="status"]').text()).toContain(
      "Сохраняем группу…",
    );
    expect((input.element as HTMLInputElement).value).toBe("Овсяное молоко");
    expect(
      wrapper.get(".modifier-group-editor fieldset").attributes("disabled"),
    ).toBeDefined();

    store.$patch({ formSaveOutcome: "saved" });
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[role="status"]').text()).toContain(
      "Группа сохранена. Обновляем меню…",
    );

    pendingSave.resolve();
    await vi.waitFor(() =>
      expect(wrapper.get('[role="status"]').text()).toBe("Группа сохранена."),
    );
  });

  it("отдаёт checking feedback приоритет над uncertain recovery", async () => {
    const store = useCatalogStore();
    store.$patch({ ...catalog, status: "ready" });
    vi.spyOn(store, "load").mockResolvedValue();
    vi.spyOn(store, "saveModifierGroup").mockImplementation(async () => {
      store.$patch({ formSaveOutcome: "unconfirmed", status: "ready" });
    });
    const pendingRefresh = createDeferred<void>();
    vi.spyOn(store, "refresh").mockImplementation(async () => {
      store.$patch({ status: "loading" });
      await pendingRefresh.promise;
      store.$patch({ status: "ready" });
    });
    const wrapper = mountPage();

    await openManagement(wrapper);
    await clickButton(wrapper, "Новая группа опций");
    await wrapper
      .get('.modifier-group-editor input[type="text"]')
      .setValue("Сиропы");
    await clickButton(wrapper, "Сохранить группу");
    await vi.waitFor(() =>
      expect(store.saveModifierGroup).toHaveBeenCalledTimes(1),
    );
    await clickButton(wrapper, "Обновить меню");
    await vi.waitFor(() => expect(store.refresh).toHaveBeenCalledTimes(1));

    expect(wrapper.get('[role="status"]').text()).toContain(
      "Проверяем актуальное меню…",
    );
    expect(wrapper.text()).not.toContain("Не удалось подтвердить сохранение");
    expect(wrapper.text()).not.toContain("Загружаем меню…");

    pendingRefresh.resolve();
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain("Меню обновлено. Закройте форму"),
    );
  });

  it("показывает checking feedback для edit draft без повторного write", async () => {
    const store = useCatalogStore();
    store.$patch({
      ...catalog,
      modifierGroups: [modifierGroup()],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const saveGroup = vi
      .spyOn(store, "saveModifierGroup")
      .mockImplementation(async () => {
        store.$patch({ formSaveOutcome: "unconfirmed", status: "ready" });
      });
    const pendingRefresh = createDeferred<void>();
    vi.spyOn(store, "refresh").mockImplementation(async () => {
      store.$patch({ status: "loading" });
      await pendingRefresh.promise;
      store.$patch({ status: "ready" });
    });
    const wrapper = mountPage();

    await wrapper
      .get('button[aria-label="Редактировать группу опций Молоко"]')
      .trigger("click");
    const input = wrapper.get('.modifier-group-editor input[type="text"]');
    await input.setValue("Овсяное молоко");
    await clickButton(wrapper, "Сохранить группу");
    await vi.waitFor(() => expect(saveGroup).toHaveBeenCalledTimes(1));
    await clickButton(wrapper, "Обновить меню");
    await vi.waitFor(() => expect(store.refresh).toHaveBeenCalledTimes(1));

    expect(wrapper.get('[role="status"]').text()).toContain(
      "Проверяем актуальное меню…",
    );
    expect((input.element as HTMLInputElement).value).toBe("Овсяное молоко");
    expect(saveGroup).toHaveBeenCalledTimes(1);

    pendingRefresh.resolve();
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain("Меню обновлено. Закройте форму"),
    );
  });

  it("показывает archive pending copy вместо фоновой загрузки меню", async () => {
    const store = useCatalogStore();
    store.$patch({
      ...catalog,
      modifierGroups: [modifierGroup()],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const pendingArchive = createDeferred<void>();
    vi.spyOn(store, "archiveModifierGroup").mockImplementation(async () => {
      store.$patch({ status: "loading" });
      await pendingArchive.promise;
      store.$patch({ status: "ready" });
    });
    const wrapper = mountPage();

    await wrapper
      .get('button[aria-label="Редактировать группу опций Молоко"]')
      .trigger("click");
    await clickButton(wrapper, "Архивировать группу");
    await clickButton(
      wrapper.find(".confirm-dialog").getComponent({ name: "AdminButton" }),
      "Архивировать",
    );
    await vi.waitFor(() =>
      expect(store.archiveModifierGroup).toHaveBeenCalledTimes(1),
    );

    expect(wrapper.text()).toContain("Архивируем группу…");
    expect(wrapper.text()).not.toContain("Загружаем меню…");
    expect(wrapper.text()).not.toContain("Сохраняем группу…");
    expect(wrapper.text()).not.toContain("Проверяем актуальное меню…");

    pendingArchive.resolve();
    await pendingArchive.promise;
  });

  it("сохраняет archive draft и locks между acknowledged DELETE и pending GET", async () => {
    const deferredDelete = createDeferred<void>();
    const deferredGet = createDeferred<typeof catalog>();
    const archiveModifierGroup = vi.fn(() => deferredDelete.promise);
    const getCatalog = vi.fn(() => deferredGet.promise);
    setCatalogStoreDependencies({
      catalogApi: {
        archiveCategory: vi.fn(),
        archiveModifierGroup,
        archiveModifierOption: vi.fn(),
        archiveProduct: vi.fn(),
        createCategory: vi.fn(),
        createModifierOption: vi.fn(),
        createProduct: vi.fn(),
        getCatalog,
        reorderCategories: vi.fn(),
        reorderProducts: vi.fn(),
        replaceCategoryModifierGroups: vi.fn(),
        saveModifierGroup: vi.fn(),
        updateCategory: vi.fn(),
        updateModifierOption: vi.fn(),
        updateProduct: vi.fn(),
      },
    });
    const store = useCatalogStore();
    store.$patch({
      ...catalog,
      modifierGroups: [modifierGroup()],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const wrapper = mountPage();

    await wrapper
      .get('button[aria-label="Редактировать группу опций Молоко"]')
      .trigger("click");
    const editor = wrapper.getComponent({ name: "ModifierGroupEditor" });
    const name = editor.get('input[type="text"]');
    await name.setValue("Овсяное молоко");
    await clickButton(editor, "Архивировать группу");
    await clickButton(
      wrapper.find(".confirm-dialog").getComponent({ name: "AdminButton" }),
      "Архивировать",
    );
    await vi.waitFor(() =>
      expect(archiveModifierGroup).toHaveBeenCalledTimes(1),
    );

    expect(getCatalog).not.toHaveBeenCalled();
    expect(editor.get('[role="status"]').text()).toBe("Архивируем группу…");
    expect((name.element as HTMLInputElement).value).toBe("Овсяное молоко");
    for (const label of ["Сохранить группу", "Архивировать группу", "Отмена"]) {
      expect(buttonByText(editor, label).attributes("disabled")).toBeDefined();
    }

    deferredDelete.resolve();
    await vi.waitFor(() => expect(getCatalog).toHaveBeenCalledTimes(1));

    expect(editor.get('[role="status"]').text()).toBe(
      "Группа архивирована. Обновляем меню…",
    );
    expect((name.element as HTMLInputElement).value).toBe("Овсяное молоко");
    for (const label of ["Сохранить группу", "Архивировать группу", "Отмена"]) {
      expect(buttonByText(editor, label).attributes("disabled")).toBeDefined();
    }
    expect(archiveModifierGroup).toHaveBeenCalledTimes(1);

    deferredGet.resolve(catalog);
    await vi.waitFor(() =>
      expect(wrapper.find(".modifier-group-editor").exists()).toBe(false),
    );
    expect(getCatalog).toHaveBeenCalledTimes(1);
    expect(archiveModifierGroup).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      "отказ DELETE",
      new CatalogApiError({
        code: "VALIDATION_ERROR",
        fields: [],
        message: "Группа не архивирована.",
        requestId: "request-42",
        status: 400,
      }),
      "Архивирование группы отклонено.",
    ],
    [
      "неизвестный DELETE",
      new Error("Сеть недоступна"),
      "Не удалось подтвердить архивирование группы.",
    ],
  ] as const)(
    "не повторяет DELETE после %s и открывает новую session только после discard",
    async (_caseName, archiveError, feedback) => {
      const archiveModifierGroup = vi.fn().mockRejectedValue(archiveError);
      const getCatalog = vi.fn().mockResolvedValue({
        ...catalog,
        modifierGroups: [modifierGroup()],
      });
      setCatalogStoreDependencies({
        catalogApi: {
          archiveCategory: vi.fn(),
          archiveModifierGroup,
          archiveModifierOption: vi.fn(),
          archiveProduct: vi.fn(),
          createCategory: vi.fn(),
          createModifierOption: vi.fn(),
          createProduct: vi.fn(),
          getCatalog,
          reorderCategories: vi.fn(),
          reorderProducts: vi.fn(),
          replaceCategoryModifierGroups: vi.fn(),
          saveModifierGroup: vi.fn(),
          updateCategory: vi.fn(),
          updateModifierOption: vi.fn(),
          updateProduct: vi.fn(),
        },
      });
      const store = useCatalogStore();
      store.$patch({
        ...catalog,
        modifierGroups: [modifierGroup()],
        status: "ready",
      });
      vi.spyOn(store, "load").mockResolvedValue();
      const wrapper = mountPage();

      await wrapper
        .get('button[aria-label="Редактировать группу опций Молоко"]')
        .trigger("click");
      await clickButton(wrapper, "Архивировать группу");
      await clickButton(
        wrapper.find(".confirm-dialog").getComponent({ name: "AdminButton" }),
        "Архивировать",
      );
      await vi.waitFor(() =>
        expect(archiveModifierGroup).toHaveBeenCalledTimes(1),
      );

      const editor = wrapper.getComponent({ name: "ModifierGroupEditor" });
      await vi.waitFor(() => expect(editor.text()).toContain(feedback));
      expect(
        buttonByText(editor, "Сохранить группу").attributes("disabled"),
      ).toBeDefined();
      expect(
        buttonByText(editor, "Архивировать группу").attributes("disabled"),
      ).toBeDefined();

      await clickButton(editor, "Обновить меню");
      await vi.waitFor(() => expect(getCatalog).toHaveBeenCalledTimes(1));
      expect(archiveModifierGroup).toHaveBeenCalledTimes(1);
      await vi.waitFor(() =>
        expect(editor.text()).toContain("Меню обновлено. Закройте форму"),
      );

      await clickButton(editor, "Отмена");
      await wrapper
        .get('button[aria-label="Редактировать группу опций Молоко"]')
        .trigger("click");
      expect(
        wrapper
          .getComponent({ name: "ModifierGroupEditor" })
          .props("saveOutcome"),
      ).toBe("idle");
    },
  );

  it("закрывает редактор после acknowledged DELETE и сообщает о failed GET", async () => {
    const archiveModifierGroup = vi.fn().mockResolvedValue(undefined);
    const getCatalog = vi
      .fn()
      .mockRejectedValue(new Error("Меню не обновлено"));
    setCatalogStoreDependencies({
      catalogApi: {
        archiveCategory: vi.fn(),
        archiveModifierGroup,
        archiveModifierOption: vi.fn(),
        archiveProduct: vi.fn(),
        createCategory: vi.fn(),
        createModifierOption: vi.fn(),
        createProduct: vi.fn(),
        getCatalog,
        reorderCategories: vi.fn(),
        reorderProducts: vi.fn(),
        replaceCategoryModifierGroups: vi.fn(),
        saveModifierGroup: vi.fn(),
        updateCategory: vi.fn(),
        updateModifierOption: vi.fn(),
        updateProduct: vi.fn(),
      },
    });
    const store = useCatalogStore();
    store.$patch({
      ...catalog,
      modifierGroups: [modifierGroup()],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const wrapper = mountPage();

    await wrapper
      .get('button[aria-label="Редактировать группу опций Молоко"]')
      .trigger("click");
    await clickButton(wrapper, "Архивировать группу");
    await clickButton(
      wrapper.find(".confirm-dialog").getComponent({ name: "AdminButton" }),
      "Архивировать",
    );
    await vi.waitFor(() =>
      expect(archiveModifierGroup).toHaveBeenCalledTimes(1),
    );

    await vi.waitFor(() => expect(getCatalog).toHaveBeenCalledTimes(1));
    await vi.waitFor(() =>
      expect(wrapper.find(".modifier-group-editor").exists()).toBe(false),
    );
    expect(wrapper.text()).toContain(
      "Группа добавок архивирована, но меню не удалось обновить.",
    );
  });

  it("повторяет только GET при recovery неизвестного DELETE", async () => {
    const archiveModifierGroup = vi
      .fn()
      .mockRejectedValue(new Error("Сеть недоступна"));
    const getCatalog = vi
      .fn()
      .mockRejectedValueOnce(new Error("Меню не обновлено"))
      .mockResolvedValueOnce({
        ...catalog,
        modifierGroups: [modifierGroup()],
      });
    setCatalogStoreDependencies({
      catalogApi: {
        archiveCategory: vi.fn(),
        archiveModifierGroup,
        archiveModifierOption: vi.fn(),
        archiveProduct: vi.fn(),
        createCategory: vi.fn(),
        createModifierOption: vi.fn(),
        createProduct: vi.fn(),
        getCatalog,
        reorderCategories: vi.fn(),
        reorderProducts: vi.fn(),
        replaceCategoryModifierGroups: vi.fn(),
        saveModifierGroup: vi.fn(),
        updateCategory: vi.fn(),
        updateModifierOption: vi.fn(),
        updateProduct: vi.fn(),
      },
    });
    const store = useCatalogStore();
    store.$patch({
      ...catalog,
      modifierGroups: [modifierGroup()],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const wrapper = mountPage();

    await wrapper
      .get('button[aria-label="Редактировать группу опций Молоко"]')
      .trigger("click");
    await clickButton(wrapper, "Архивировать группу");
    await clickButton(
      wrapper.find(".confirm-dialog").getComponent({ name: "AdminButton" }),
      "Архивировать",
    );
    const editor = wrapper.getComponent({ name: "ModifierGroupEditor" });
    await vi.waitFor(() =>
      expect(editor.text()).toContain("Не удалось подтвердить архивирование"),
    );

    await clickButton(editor, "Обновить меню");
    await vi.waitFor(() => expect(getCatalog).toHaveBeenCalledTimes(1));
    await vi.waitFor(() =>
      expect(editor.text()).toContain("Не удалось подтвердить архивирование"),
    );
    await clickButton(editor, "Обновить меню");
    await vi.waitFor(() => expect(getCatalog).toHaveBeenCalledTimes(2));
    await vi.waitFor(() =>
      expect(editor.text()).toContain("Меню обновлено. Закройте форму"),
    );

    expect(archiveModifierGroup).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["500", "Internal server error"],
    ["network", "Сеть недоступна"],
    ["invalid DTO", "Некорректный ответ сервера"],
  ])(
    "показывает cold %s понятным текстом, скрывает диагностику и один раз загружает меню",
    async (_failure, diagnostic) => {
      const catalogApi = {
        archiveCategory: vi.fn(),
        archiveModifierGroup: vi.fn(),
        archiveModifierOption: vi.fn(),
        archiveProduct: vi.fn(),
        createCategory: vi.fn(),
        createModifierOption: vi.fn(),
        createProduct: vi.fn(),
        getCatalog: vi
          .fn()
          .mockRejectedValueOnce(new Error("initial"))
          .mockResolvedValue(catalog),
        reorderCategories: vi.fn(),
        reorderProducts: vi.fn(),
        replaceCategoryModifierGroups: vi.fn(),
        saveModifierGroup: vi.fn(),
        updateCategory: vi.fn(),
        updateModifierOption: vi.fn(),
        updateProduct: vi.fn(),
      };
      setCatalogStoreDependencies({ catalogApi });
      const store = useCatalogStore();
      store.$patch({
        error: { message: diagnostic, requestId: "request-42" },
        status: "error",
      });
      const wrapper = mountPage();

      await vi.waitFor(() =>
        expect(catalogApi.getCatalog).toHaveBeenCalledTimes(1),
      );
      await vi.waitFor(() => expect(store.status).toBe("error"));
      store.$patch({
        error: { message: diagnostic, requestId: "request-42" },
        status: "error",
      });
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("Не удалось загрузить меню.");
      expect(wrapper.text()).toContain(
        "Загрузите актуальное меню, чтобы проверить текущее состояние.",
      );
      expect(wrapper.get("details").attributes("open")).toBeUndefined();
      expect(wrapper.get("details").text()).toContain(diagnostic);
      expect(wrapper.get("details").text()).toContain("request-42");
      catalogApi.getCatalog.mockClear();
      await clickButton(wrapper, "Загрузить меню");

      await vi.waitFor(() =>
        expect(catalogApi.getCatalog).toHaveBeenCalledWith("access-token"),
      );
      expect(catalogApi.getCatalog).toHaveBeenCalledTimes(1);
      for (const method of [
        catalogApi.archiveCategory,
        catalogApi.archiveModifierGroup,
        catalogApi.archiveModifierOption,
        catalogApi.archiveProduct,
        catalogApi.createCategory,
        catalogApi.createModifierOption,
        catalogApi.createProduct,
        catalogApi.reorderCategories,
        catalogApi.reorderProducts,
        catalogApi.replaceCategoryModifierGroups,
        catalogApi.saveModifierGroup,
        catalogApi.updateCategory,
        catalogApi.updateModifierOption,
        catalogApi.updateProduct,
      ])
        expect(method).not.toHaveBeenCalled();
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain("Кофе");
    },
  );

  it("показывает warm error честно, сохраняет каталог и скрывает page feedback при active form", async () => {
    const store = useCatalogStore();
    store.$patch({ ...catalog, status: "ready" });
    vi.spyOn(store, "load").mockResolvedValue();
    const wrapper = mountPage();

    store.$patch({
      error: { message: "Internal server error", requestId: null },
      status: "error",
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Не удалось завершить операцию с меню.");
    expect(wrapper.text()).toContain("Кофе");
    expect(wrapper.get(".menu-page__error > p").text()).not.toContain(
      "Internal server error",
    );

    await clickButton(wrapper, "Добавить группу");
    expect(wrapper.find(".menu-page__error").exists()).toBe(false);
    await clickButton(
      wrapper.getComponent({ name: "AddCategoryDialog" }),
      "Отмена",
    );
    await clickButton(wrapper, "Добавить товар");
    expect(wrapper.find(".menu-page__error").exists()).toBe(false);
  });

  it("закрывает product editor после acknowledged refetch failure и сохраняет GET-only recovery", async () => {
    const store = useCatalogStore();
    const product = productWithSortOrder("product-latte", 0);
    const getCatalog = vi
      .fn()
      .mockRejectedValueOnce(new Error("Меню не обновлено"))
      .mockResolvedValueOnce({ ...catalog, products: [product] });
    const updateProduct = vi.fn().mockResolvedValue(undefined);
    setCatalogStoreDependencies({
      catalogApi: {
        getCatalog,
        createCategory: vi.fn(),
        updateCategory: vi.fn(),
        reorderCategories: vi.fn(),
        archiveCategory: vi.fn(),
        createProduct: vi.fn(),
        updateProduct,
        reorderProducts: vi.fn(),
        archiveProduct: vi.fn(),
        archiveModifierGroup: vi.fn(),
        createModifierOption: vi.fn(),
        updateModifierOption: vi.fn(),
        archiveModifierOption: vi.fn(),
        replaceCategoryModifierGroups: vi.fn(),
        saveModifierGroup: vi.fn(),
      },
    });
    store.$patch({ ...catalog, products: [product], status: "ready" });
    const wrapper = mountPage();
    await wrapper.get(".menu-category__toggle").trigger("click");
    await wrapper.get(".menu-product-row__edit").trigger("click");
    const dialog = wrapper.getComponent({ name: "EditProductDialog" });

    dialog.vm.$emit("save", productFormData);
    await vi.waitFor(() => expect(updateProduct).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(dialog.props("open")).toBe(false));
    expect(wrapper.text()).toContain(
      "Товар сохранён, но меню не удалось обновить.",
    );
    getCatalog.mockClear();
    await clickButton(wrapper, "Загрузить меню");
    await vi.waitFor(() =>
      expect(getCatalog).toHaveBeenCalledWith("access-token"),
    );
    expect(getCatalog).toHaveBeenCalledTimes(1);
    expect(updateProduct).toHaveBeenCalledTimes(1);

    await wrapper.get(".menu-product-row__edit").trigger("click");
    const reopenedDialog = wrapper.getComponent({ name: "EditProductDialog" });
    expect(reopenedDialog.props("open")).toBe(true);
    reopenedDialog.vm.$emit("cancel");
    await vi.waitFor(() => expect(reopenedDialog.props("open")).toBe(false));
  });

  it("показывает отсортированные категории и товары после раскрытия", async () => {
    const store = useCatalogStore();
    store.$patch({
      categories: [
        {
          ...catalog.categories[0],
          id: "category-tea",
          name: "Чай",
          sortOrder: 2,
        },
        { ...catalog.categories[0], sortOrder: 1 },
      ],
      products: [
        {
          id: "product-latte",
          categoryId: "category-coffee",
          type: "OTHER",
          name: "Латте",
          description: "",
          price: 300,
          sortOrder: 2,
          isActive: true,
          isAvailable: true,
          variants: [],
        },
        {
          id: "product-espresso",
          categoryId: "category-coffee",
          type: "OTHER",
          name: "Эспрессо",
          description: "",
          price: 200,
          sortOrder: 1,
          isActive: true,
          isAvailable: true,
          variants: [],
        },
      ],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const wrapper = mountPage();

    expect(categoryNames(wrapper)).toEqual(["Кофе", "Чай"]);
    await wrapper.get(".menu-category__toggle").trigger("click");

    expect(productNames(wrapper)).toEqual(["Эспрессо", "Латте"]);
  });

  it("собирает каталог в таблицу и скрывает управление до явного открытия", () => {
    const store = useCatalogStore();
    store.$patch({
      categories: [
        ...catalog.categories,
        { ...catalog.categories[0], id: "category-tea", name: "Чай" },
      ],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();

    const wrapper = mountPage();

    expect(wrapper.findAll(".menu-page__table")).toHaveLength(1);
    expect(wrapper.text()).toContain("Основное меню");
    expect(wrapper.findAll(".menu-page__management")).toHaveLength(0);
  });

  it("сохраняет порядок групп опций из каталога и показывает фигмовские формы счётчиков", () => {
    const store = useCatalogStore();
    store.$patch({
      ...catalog,
      products: [
        productWithSortOrder("product-cappuccino", 0),
        productWithSortOrder("product-latte", 1),
        productWithSortOrder("product-espresso", 2),
      ],
      modifierGroups: [
        {
          ...modifierGroup(),
          id: "group-milk",
          name: "Тип молока",
          options: [
            { id: "milk", name: "Молоко" },
            { id: "soy", name: "Соевое молоко" },
            { id: "almond", name: "Миндальное молоко" },
          ].map((option, sortOrder) => ({
            ...option,
            groupId: "group-milk",
            priceDelta: 0,
            sortOrder,
            isAvailable: true,
            isDefault: false,
          })),
        },
        { ...modifierGroup(), id: "group-additions", name: "Добавки" },
      ],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();

    const wrapper = mountPage();

    expect(wrapper.get(".menu-category__count").text()).toBe("3 товара");
    expect(
      wrapper
        .findAll(".menu-page__option-name")
        .map((element) => element.text()),
    ).toEqual(["Тип молока", "Добавки"]);
    expect(wrapper.get(".menu-page__option-count").text()).toBe("3 опции");
  });

  it("перемещает категорию полным списком идентификаторов", async () => {
    const store = useCatalogStore();
    store.$patch({
      categories: [
        { ...catalog.categories[0], id: "category-coffee", sortOrder: 0 },
        {
          ...catalog.categories[0],
          id: "category-tea",
          name: "Чай",
          sortOrder: 1,
        },
        {
          ...catalog.categories[0],
          id: "category-food",
          name: "Еда",
          sortOrder: 2,
        },
      ],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const reorder = vi.spyOn(store, "reorderCategories").mockResolvedValue();
    const wrapper = mountPage();
    await openManagement(wrapper);

    await wrapper
      .get('button[aria-label="Переместить категорию Чай вверх"]')
      .trigger("click");

    expect(reorder).toHaveBeenCalledWith("access-token", [
      "category-tea",
      "category-coffee",
      "category-food",
    ]);
    expect(categoryNames(wrapper)).toEqual(["Кофе", "Чай", "Еда"]);
  });

  it("перемещает товар полным списком товаров категории", async () => {
    const store = useCatalogStore();
    store.$patch({
      ...catalog,
      products: [
        productWithSortOrder("product-espresso", 0),
        productWithSortOrder("product-latte", 1),
        productWithSortOrder("product-cocoa", 2),
      ],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const reorder = vi.spyOn(store, "reorderProducts").mockResolvedValue();
    const wrapper = mountPage();
    await openManagement(wrapper);
    await wrapper.get(".menu-category__toggle").trigger("click");

    await wrapper
      .get('button[aria-label="Переместить товар product-latte вниз"]')
      .trigger("click");

    expect(reorder).toHaveBeenCalledWith("access-token", "category-coffee", [
      "product-espresso",
      "product-cocoa",
      "product-latte",
    ]);
    expect(productNames(wrapper)).toEqual([
      "product-espresso",
      "product-latte",
      "product-cocoa",
    ]);
  });

  it("блокирует перемещение крайних строк", async () => {
    const store = useCatalogStore();
    store.$patch({
      categories: [
        { ...catalog.categories[0], sortOrder: 0 },
        {
          ...catalog.categories[0],
          id: "category-tea",
          name: "Чай",
          sortOrder: 1,
        },
      ],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const wrapper = mountPage();
    await openManagement(wrapper);

    expect(
      wrapper
        .get('button[aria-label="Переместить категорию Кофе вверх"]')
        .attributes("disabled"),
    ).toBeDefined();
    expect(
      wrapper
        .get('button[aria-label="Переместить категорию Чай вниз"]')
        .attributes("disabled"),
    ).toBeDefined();
  });

  it("добавляет категорию в конец и сохраняет её порядок при редактировании", async () => {
    const store = useCatalogStore();
    store.$patch({
      categories: [
        { ...catalog.categories[0], sortOrder: 2 },
        { ...catalog.categories[0], id: "category-tea", sortOrder: 7 },
      ],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const create = vi.spyOn(store, "createCategory").mockResolvedValue();
    const update = vi.spyOn(store, "updateCategory").mockResolvedValue();
    const wrapper = mountPage();

    wrapper
      .getComponent({ name: "AddCategoryDialog" })
      .vm.$emit("confirm", categoryFormData);
    await vi.waitFor(() =>
      expect(create).toHaveBeenCalledWith("access-token", {
        ...categoryFormData,
        sortOrder: 8,
      }),
    );

    await wrapper
      .get('button[aria-label="Редактировать категорию Кофе"]')
      .trigger("click");
    wrapper
      .getComponent({ name: "EditCategoryDialog" })
      .vm.$emit("save", categoryFormData);
    await vi.waitFor(() =>
      expect(update).toHaveBeenCalledWith("access-token", "category-coffee", {
        ...categoryFormData,
        sortOrder: 2,
      }),
    );
  });

  it("очищает server field errors только между category/product/edit sessions", async () => {
    const rejectedWrite = new CatalogApiError({
      code: "VALIDATION_ERROR",
      fields: [
        { path: "name", reason: "Имя предыдущей категории" },
        { path: "description", reason: "Описание предыдущей категории" },
        { path: "isActive", reason: "Статус предыдущей категории" },
      ],
      message: "Категория не сохранена.",
      requestId: "request-42",
      status: 400,
    });
    const catalogApi = {
      archiveCategory: vi.fn(),
      archiveModifierGroup: vi.fn(),
      archiveModifierOption: vi.fn(),
      archiveProduct: vi.fn(),
      createCategory: vi.fn().mockRejectedValue(rejectedWrite),
      createModifierOption: vi.fn(),
      createProduct: vi.fn(),
      getCatalog: vi.fn().mockResolvedValue(catalog),
      reorderCategories: vi.fn(),
      reorderProducts: vi.fn(),
      replaceCategoryModifierGroups: vi.fn(),
      saveModifierGroup: vi.fn(),
      updateCategory: vi.fn(),
      updateModifierOption: vi.fn(),
      updateProduct: vi.fn(),
    };
    setCatalogStoreDependencies({
      catalogApi,
    });
    const store = useCatalogStore();
    store.$patch({
      ...catalog,
      categories: [
        ...catalog.categories,
        {
          ...catalog.categories[0],
          id: "category-tea",
          name: "Чай",
          sortOrder: 2,
        },
      ],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const wrapper = mountPage();

    await clickButton(wrapper, "Добавить группу");
    const rejectedDialog = wrapper.getComponent({ name: "AddCategoryDialog" });
    rejectedDialog.vm.$emit("confirm", categoryFormData);
    await vi.waitFor(() =>
      expect(catalogApi.createCategory).toHaveBeenCalledTimes(1),
    );
    await vi.waitFor(() =>
      expect(rejectedDialog.props("saveOutcome")).toBe("rejected"),
    );
    const name = rejectedDialog.get('input[id^="add-category-name-"]');
    const description = rejectedDialog.get(
      'input[id^="add-category-description-"]',
    );
    const active = rejectedDialog.get('[role="switch"]');

    for (const field of [name, description, active]) {
      expect(field.attributes("aria-invalid")).toBe("true");
    }
    await name.setValue("Исправленное имя");
    expect(name.attributes("aria-invalid")).toBe("false");
    expect(description.attributes("aria-invalid")).toBe("true");
    expect(active.attributes("aria-invalid")).toBe("true");

    await clickButton(rejectedDialog, "Отмена");
    await vi.waitFor(() => expect(store.fieldErrors).toEqual({}));
    await clickButton(wrapper, "Добавить группу");
    const freshCategory = wrapper.getComponent({ name: "AddCategoryDialog" });
    expect(
      freshCategory
        .get('input[id^="add-category-name-"]')
        .attributes("aria-invalid"),
    ).toBe("false");
    expect(freshCategory.find('[role="alert"]').exists()).toBe(false);

    await clickButton(freshCategory, "Отмена");
    await clickButton(wrapper, "Добавить товар");
    const freshProduct = wrapper.getComponent({ name: "AddProductDialog" });
    expect(
      freshProduct
        .get('input[id^="add-product-name-"]')
        .attributes("aria-invalid"),
    ).toBe("false");
    expect(freshProduct.find('[role="alert"]').exists()).toBe(false);

    await clickButton(freshProduct, "Отмена");
    await wrapper
      .get('button[aria-label="Редактировать категорию Кофе"]')
      .trigger("click");
    const firstEditor = wrapper.getComponent({ name: "EditCategoryDialog" });
    expect(
      firstEditor
        .get('input[id^="edit-category-name-"]')
        .attributes("aria-invalid"),
    ).toBe("false");
    expect(firstEditor.find('[role="alert"]').exists()).toBe(false);
    await clickButton(firstEditor, "Отмена");
    await wrapper
      .get('button[aria-label="Редактировать категорию Чай"]')
      .trigger("click");
    const secondEditor = wrapper.getComponent({ name: "EditCategoryDialog" });
    expect(
      secondEditor
        .get('input[id^="edit-category-name-"]')
        .attributes("aria-invalid"),
    ).toBe("false");
    expect(secondEditor.find('[role="alert"]').exists()).toBe(false);
    expect(catalogApi.createCategory).toHaveBeenCalledTimes(1);
    for (const method of [
      catalogApi.archiveCategory,
      catalogApi.archiveModifierGroup,
      catalogApi.archiveModifierOption,
      catalogApi.archiveProduct,
      catalogApi.createModifierOption,
      catalogApi.createProduct,
      catalogApi.getCatalog,
      catalogApi.reorderCategories,
      catalogApi.reorderProducts,
      catalogApi.replaceCategoryModifierGroups,
      catalogApi.saveModifierGroup,
      catalogApi.updateCategory,
      catalogApi.updateModifierOption,
      catalogApi.updateProduct,
    ]) {
      expect(method).not.toHaveBeenCalled();
    }
  });

  it("при переносе товара в другую категорию ставит его в конец", async () => {
    const store = useCatalogStore();
    const product = productWithSortOrder("product-latte", 1);
    store.$patch({
      categories: [
        ...catalog.categories,
        {
          ...catalog.categories[0],
          id: "category-tea",
          name: "Чай",
          sortOrder: 2,
        },
      ],
      products: [
        product,
        {
          ...productWithSortOrder("product-tea", 4),
          categoryId: "category-tea",
        },
      ],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const update = vi.spyOn(store, "updateProduct").mockResolvedValue();
    const wrapper = mountPage();
    await wrapper.get(".menu-category__toggle").trigger("click");
    await wrapper.get(".menu-product-row__edit").trigger("click");

    wrapper
      .getComponent({ name: "EditProductDialog" })
      .vm.$emit("save", { ...productFormData, categoryId: "category-tea" });
    await vi.waitFor(() =>
      expect(update).toHaveBeenCalledWith("access-token", "product-latte", {
        ...productFormData,
        categoryId: "category-tea",
        sortOrder: 5,
      }),
    );
  });

  it("добавляет новый товар в конец категории", async () => {
    const store = useCatalogStore();
    store.$patch({
      ...catalog,
      products: [
        productWithSortOrder("product-espresso", 0),
        productWithSortOrder("product-latte", 7),
      ],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const createProduct = vi.spyOn(store, "createProduct").mockResolvedValue();
    const wrapper = mountPage();

    await clickButton(wrapper, "Добавить товар");
    wrapper
      .getComponent({ name: "AddProductDialog" })
      .vm.$emit("confirm", productFormData);
    await vi.waitFor(() => expect(createProduct).toHaveBeenCalledTimes(1));

    expect(createProduct).toHaveBeenCalledWith("access-token", {
      ...productFormData,
      sortOrder: 8,
    });
  });

  it("после успешной GET-only проверки create оставляет черновик открытым без повторного recovery", async () => {
    const store = useCatalogStore();
    store.$patch({ ...catalog, status: "ready" });
    vi.spyOn(store, "load").mockResolvedValue();
    const refresh = vi.spyOn(store, "refresh").mockImplementation(async () => {
      store.$patch({ formSaveOutcome: "idle", status: "ready" });
    });
    const wrapper = mountPage();

    await clickButton(wrapper, "Добавить товар");
    wrapper.getComponent({ name: "AddProductDialog" }).vm.$emit("refresh");
    await vi.waitFor(() =>
      expect(refresh).toHaveBeenCalledWith("access-token"),
    );
    await vi.waitFor(() =>
      expect(
        wrapper.getComponent({ name: "AddProductDialog" }).props("saveOutcome"),
      ).toBe("saved"),
    );

    expect(
      wrapper.getComponent({ name: "AddProductDialog" }).props("open"),
    ).toBe(true);
    expect(wrapper.text()).toContain("Меню обновлено. Закройте форму");
    expect(
      dialogButtons(wrapper, "add-dialog", ["Обновить меню"]),
    ).toHaveLength(0);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("после неудачной GET-only проверки edit сохраняет единственный recovery и черновик", async () => {
    const store = useCatalogStore();
    const product = productWithSortOrder("product-latte", 0);
    store.$patch({
      ...catalog,
      formSaveOutcome: "unconfirmed",
      products: [product],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const refresh = vi
      .spyOn(store, "refresh")
      .mockImplementationOnce(async () => {
        store.$patch({ formSaveOutcome: "idle", status: "error" });
      })
      .mockImplementationOnce(async () => {
        store.$patch({ formSaveOutcome: "idle", status: "ready" });
      });
    const wrapper = mountPage();

    await wrapper.get(".menu-category__toggle").trigger("click");
    await wrapper.get(".menu-product-row__edit").trigger("click");
    const dialog = wrapper.getComponent({ name: "EditProductDialog" });
    const name = dialog.get('input[id^="edit-product-name-"]');
    await name.setValue("Новый латте");
    dialog.vm.$emit("refresh");

    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    await vi.waitFor(() =>
      expect(dialog.props("saveOutcome")).toBe("unconfirmed"),
    );

    expect((name.element as HTMLInputElement).value).toBe("Новый латте");
    expect(
      dialogButtons(wrapper, "edit-dialog", ["Обновить меню"]),
    ).toHaveLength(1);

    dialog.vm.$emit("refresh");

    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(dialog.props("saveOutcome")).toBe("saved"));

    expect((name.element as HTMLInputElement).value).toBe("Новый латте");
    expect(
      dialogButtons(wrapper, "edit-dialog", ["Обновить меню"]),
    ).toHaveLength(0);
  });

  it("после неудачной GET-only проверки create выполняет второй GET без повтора записи", async () => {
    const store = useCatalogStore();
    store.$patch({ ...catalog, status: "ready" });
    vi.spyOn(store, "load").mockResolvedValue();
    const refresh = vi
      .spyOn(store, "refresh")
      .mockImplementationOnce(async () => {
        store.$patch({ formSaveOutcome: "idle", status: "error" });
      })
      .mockImplementationOnce(async () => {
        store.$patch({ formSaveOutcome: "idle", status: "ready" });
      });
    const createProduct = vi.spyOn(store, "createProduct").mockResolvedValue();
    const wrapper = mountPage();

    await clickButton(wrapper, "Добавить товар");
    const dialog = wrapper.getComponent({ name: "AddProductDialog" });
    const name = dialog.get('input[id^="add-product-name-"]');
    await name.setValue("Черновик create");
    dialog.vm.$emit("refresh");
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));

    expect(dialog.props("saveOutcome")).toBe("unconfirmed");
    dialog.vm.$emit("refresh");
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(dialog.props("saveOutcome")).toBe("saved"));

    expect((name.element as HTMLInputElement).value).toBe("Черновик create");
    expect(createProduct).not.toHaveBeenCalled();
    expect(
      dialogButtons(wrapper, "add-dialog", ["Обновить меню"]),
    ).toHaveLength(0);
  });

  it("оставляет AdminDialog закрываемым по умолчанию", () => {
    const wrapper = mount(AdminDialog, {
      global: {
        stubs: {
          VDialog: {
            props: ["modelValue", "persistent"],
            template: "<div><slot /></div>",
          },
        },
      },
    });

    expect(wrapper.attributes("persistent")).toBeUndefined();
  });

  it("сохраняет назначения только выбранной категории с точным порядком", async () => {
    const store = useCatalogStore();
    store.$patch({
      categories: [
        {
          ...catalog.categories[0],
          id: "category-tea",
          name: "Чай",
          sortOrder: 2,
        },
        { ...catalog.categories[0], sortOrder: 1 },
      ],
      modifierGroups: [
        {
          id: "group-milk",
          name: "Молоко",
          selectionType: "single",
          minSelect: 0,
          maxSelect: 1,
          isActive: true,
          options: [],
        },
      ],
      categoryModifierGroupAssignments: [
        {
          categoryId: "category-tea",
          modifierGroupId: "group-milk",
          sortOrder: 7,
        },
      ],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const replaceAssignments = vi
      .spyOn(store, "replaceCategoryModifierGroups")
      .mockResolvedValue();
    const wrapper = mountPage();

    await openManagement(wrapper);
    await clickButton(wrapper, "Кофе");
    const checkbox = wrapper.get('input[type="checkbox"]');
    await checkbox.setValue(true);
    await wrapper
      .get('.category-modifier-assignments input[type="number"]')
      .setValue("3");
    expect(
      buttonByText(wrapper, "Сохранить назначения").attributes("disabled"),
    ).toBeUndefined();
    await clickButton(wrapper, "Сохранить назначения");
    await wrapper.get(".category-modifier-assignments form").trigger("submit");

    expect(replaceAssignments).toHaveBeenCalledWith(
      "access-token",
      "category-coffee",
      [
        {
          categoryId: "category-coffee",
          modifierGroupId: "group-milk",
          sortOrder: 3,
        },
      ],
    );
  });

  it("возвращает keyboard focus к opener назначений и сохраняет normal tab order", async () => {
    const store = useCatalogStore();
    store.$patch({
      ...catalog,
      categories: [
        { ...catalog.categories[0], name: "Кофе", sortOrder: 1 },
        {
          ...catalog.categories[0],
          id: "category-tea",
          name: "Чай",
          sortOrder: 2,
        },
      ],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const replaceAssignments = vi.spyOn(store, "replaceCategoryModifierGroups");
    const wrapper = mountPage();

    await openManagement(wrapper);
    const openers = wrapper.findAll(".menu-page__group-button");
    const firstOpener = openers[0]!.element as HTMLButtonElement;
    firstOpener.focus();
    await openers[0]!.trigger("keydown", { key: "Enter" });
    firstOpener.click();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".category-modifier-assignments").exists()).toBe(true);

    await clickButton(wrapper, "Отмена");
    await wrapper.vm.$nextTick();

    expect(document.activeElement).toBe(firstOpener);
    expect(
      openers[0]!.element.compareDocumentPosition(openers[1]!.element),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(replaceAssignments).not.toHaveBeenCalled();
  });

  it("возвращает focus к latest opener и переоткрывает persisted назначения", async () => {
    const store = useCatalogStore();
    store.$patch({
      ...catalog,
      categories: [
        { ...catalog.categories[0], name: "Кофе", sortOrder: 1 },
        {
          ...catalog.categories[0],
          id: "category-tea",
          name: "Чай",
          sortOrder: 2,
        },
      ],
      modifierGroups: [{ ...modifierGroup(), id: "group-milk" }],
      categoryModifierGroupAssignments: [
        {
          categoryId: "category-coffee",
          modifierGroupId: "group-milk",
          sortOrder: 3,
        },
      ],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const wrapper = mountPage();

    await openManagement(wrapper);
    const coffee = buttonByText(wrapper, "Кофе");
    const tea = buttonByText(wrapper, "Чай");
    await coffee.trigger("click");
    await tea.trigger("click");
    await clickButton(wrapper, "Отмена");
    await wrapper.vm.$nextTick();

    expect(document.activeElement).toBe(tea.element);
    await coffee.trigger("click");
    expect(wrapper.get('input[type="checkbox"]').element).toHaveProperty(
      "checked",
      true,
    );
  });

  it("не отменяет pending назначения и не выполняет write", async () => {
    const store = useCatalogStore();
    store.$patch({ ...catalog, status: "ready" });
    vi.spyOn(store, "load").mockResolvedValue();
    const replaceAssignments = vi.spyOn(store, "replaceCategoryModifierGroups");
    const wrapper = mountPage();

    await openManagement(wrapper);
    await clickButton(wrapper, "Кофе");
    store.$patch({ status: "loading" });
    await wrapper.vm.$nextTick();
    const assignments = wrapper.getComponent({
      name: "CategoryModifierAssignments",
    });

    expect(
      buttonByText(wrapper, "Отмена").attributes("disabled"),
    ).toBeDefined();
    assignments.vm.$emit("cancel");
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".category-modifier-assignments").exists()).toBe(true);
    expect(replaceAssignments).not.toHaveBeenCalled();
  });

  it("архивирует группу добавок только после подтверждения и закрывает редактор", async () => {
    const store = useCatalogStore();
    store.$patch({
      modifierGroups: [
        {
          id: "group-milk",
          name: "Молоко",
          selectionType: "single",
          minSelect: 0,
          maxSelect: 1,
          isActive: true,
          options: [],
        },
      ],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const archiveGroup = vi
      .spyOn(store, "archiveModifierGroup")
      .mockImplementation(async () => {
        store.lastCommandSucceeded = true;
      });
    const wrapper = mountPage();

    await wrapper
      .get('button[aria-label="Редактировать группу опций Молоко"]')
      .trigger("click");
    await clickButton(wrapper, "Архивировать группу");
    expect(archiveGroup).not.toHaveBeenCalled();

    await clickButton(
      wrapper.find(".confirm-dialog").getComponent({ name: "AdminButton" }),
      "Архивировать",
    );
    await wrapper.vm.$nextTick();

    expect(archiveGroup).toHaveBeenCalledWith("access-token", "group-milk");
    expect(wrapper.find(".modifier-group-editor").exists()).toBe(false);
  });

  it("удаляет вариант после подтверждения и сохраняет группу без него", async () => {
    const store = useCatalogStore();
    store.$patch({
      modifierGroups: [
        {
          id: "group-milk",
          name: "Молоко",
          selectionType: "single",
          minSelect: 0,
          maxSelect: 1,
          isActive: true,
          options: [
            {
              id: "option-oat",
              groupId: "group-milk",
              name: "Овсяное",
              priceDelta: 50,
              sortOrder: 0,
              isDefault: false,
              isAvailable: true,
            },
          ],
        },
      ],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const saveGroup = vi.spyOn(store, "saveModifierGroup").mockResolvedValue();
    const wrapper = mountPage();

    await wrapper
      .get('button[aria-label="Редактировать группу опций Молоко"]')
      .trigger("click");
    await clickButton(wrapper, "Удалить вариант");
    expect(wrapper.text()).toContain("Удалить вариант добавки?");
    const optionEditor = wrapper.getComponent({ name: "ModifierOptionEditor" });
    await clickButton(optionEditor.find(".confirm-dialog"), "Удалить");
    expect(
      buttonByText(wrapper, "Сохранить группу").attributes("disabled"),
    ).toBeUndefined();
    await clickButton(wrapper, "Сохранить группу");
    await wrapper.get(".modifier-group-editor__form").trigger("submit");

    expect(saveGroup).toHaveBeenCalledWith("access-token", {
      id: "group-milk",
      name: "Молоко",
      selectionType: "single",
      minSelect: 0,
      maxSelect: 1,
      isActive: true,
      options: [],
    });
  });

  it("блокирует открытые диалоги добавления и редактирования при загрузке", async () => {
    const store = useCatalogStore();
    store.$patch({ ...catalog, status: "ready" });
    vi.spyOn(store, "load").mockResolvedValue();
    const wrapper = mountPage();

    await clickButton(wrapper, "Добавить группу");
    await wrapper
      .get('button[aria-label="Редактировать категорию Кофе"]')
      .trigger("click");
    store.status = "loading";
    await wrapper.vm.$nextTick();

    expect(
      dialogButtons(wrapper, "add-dialog", ["Отмена", "Добавить"]),
    ).not.toHaveLength(0);
    expect(
      dialogButtons(wrapper, "add-dialog", ["Отмена", "Добавить"]).every(
        (button) => button.attributes("disabled") !== undefined,
      ),
    ).toBe(true);
    expect(
      dialogButtons(wrapper, "edit-dialog", ["Отмена", "Сохранить изменения"]),
    ).not.toHaveLength(0);
    expect(
      dialogButtons(wrapper, "edit-dialog", [
        "Отмена",
        "Сохранить изменения",
      ]).every((button) => button.attributes("disabled") !== undefined),
    ).toBe(true);
  });

  it("блокирует действия открытых товарных и категорийного диалогов при загрузке", async () => {
    const store = useCatalogStore();
    store.$patch({
      ...catalog,
      products: [
        {
          id: "product-espresso",
          categoryId: "category-coffee",
          type: "OTHER",
          name: "Эспрессо",
          description: "",
          price: 200,
          sortOrder: 1,
          isActive: true,
          isAvailable: true,
          variants: [],
        },
      ],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const wrapper = mountPage();

    await clickButton(wrapper, "Добавить товар");
    await wrapper
      .get('button[aria-label="Редактировать категорию Кофе"]')
      .trigger("click");
    await wrapper.get(".menu-category__toggle").trigger("click");
    await wrapper
      .get('button[aria-label="Редактировать товар Эспрессо"]')
      .trigger("click");
    store.status = "loading";
    await wrapper.vm.$nextTick();

    expectButtonsDisabled(wrapper.getComponent({ name: "AddProductDialog" }), [
      "Добавить товар",
      "Отмена",
    ]);
    expectButtonsDisabled(wrapper.getComponent({ name: "EditProductDialog" }), [
      "Сохранить изменения",
      "Удалить товар",
      "Отмена",
    ]);
    expect(
      buttonByText(
        wrapper.getComponent({ name: "EditCategoryDialog" }),
        "Архивировать категорию",
      ).attributes("disabled"),
    ).not.toBeUndefined();
  });

  it("не повторяет create после неудачной и успешной проверки, но разрешает новую форму", async () => {
    const store = useCatalogStore();
    store.$patch({
      ...catalog,
      formSaveOutcome: "unconfirmed",
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const refresh = vi
      .spyOn(store, "refresh")
      .mockImplementationOnce(async () => {
        store.$patch({ formSaveOutcome: "idle", status: "error" });
      })
      .mockImplementationOnce(async () => {
        store.$patch({ formSaveOutcome: "idle", status: "ready" });
      });
    const createProduct = vi.spyOn(store, "createProduct").mockResolvedValue();
    const wrapper = mountPage();

    await clickButton(wrapper, "Добавить товар");
    const dialog = wrapper.getComponent({ name: "AddProductDialog" });
    dialog.vm.$emit("refresh");
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(dialog.props("saveOutcome")).toBe("unconfirmed");

    dialog.vm.$emit("refresh");
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(dialog.props("saveOutcome")).toBe("saved"));

    dialog.vm.$emit("confirm", productFormData);
    await wrapper.vm.$nextTick();
    expect(createProduct).not.toHaveBeenCalled();

    await clickButton(dialog, "Закрыть форму");
    expect(dialog.props("open")).toBe(false);
    await clickButton(wrapper, "Добавить товар");
    wrapper
      .getComponent({ name: "AddProductDialog" })
      .vm.$emit("confirm", productFormData);
    await vi.waitFor(() => expect(createProduct).toHaveBeenCalledTimes(1));
  });

  it("не повторяет edit после проверки и сохраняет исправление rejected400", async () => {
    const store = useCatalogStore();
    const product = productWithSortOrder("product-latte", 0);
    store.$patch({
      ...catalog,
      formSaveOutcome: "unconfirmed",
      products: [product],
      status: "ready",
    });
    vi.spyOn(store, "load").mockResolvedValue();
    const refresh = vi
      .spyOn(store, "refresh")
      .mockImplementationOnce(async () => {
        store.$patch({ formSaveOutcome: "idle", status: "error" });
      })
      .mockImplementationOnce(async () => {
        store.$patch({ formSaveOutcome: "idle", status: "ready" });
      });
    const updateProduct = vi.spyOn(store, "updateProduct").mockResolvedValue();
    const wrapper = mountPage();

    await wrapper.get(".menu-category__toggle").trigger("click");
    await wrapper.get(".menu-product-row__edit").trigger("click");
    const dialog = wrapper.getComponent({ name: "EditProductDialog" });
    dialog.vm.$emit("refresh");
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    dialog.vm.$emit("refresh");
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(dialog.props("saveOutcome")).toBe("saved"));

    dialog.vm.$emit("save", productFormData);
    await wrapper.vm.$nextTick();
    expect(updateProduct).not.toHaveBeenCalled();

    await clickButton(dialog, "Закрыть форму");
    expect(dialog.props("open")).toBe(false);
    await wrapper.get(".menu-product-row__edit").trigger("click");
    wrapper
      .getComponent({ name: "EditProductDialog" })
      .vm.$emit("save", productFormData);
    await vi.waitFor(() => expect(updateProduct).toHaveBeenCalledTimes(1));

    store.$patch({
      fieldErrors: { name: "Товар уже существует" },
      formSaveOutcome: "rejected",
    });
    await wrapper.vm.$nextTick();
    wrapper
      .getComponent({ name: "EditProductDialog" })
      .vm.$emit("save", { ...productFormData, name: "Исправленный латте" });
    await vi.waitFor(() => expect(updateProduct).toHaveBeenCalledTimes(2));
  });

  it.each(["create", "update"] as const)(
    "не повторяет %s категории в unconfirmed, checking, retry и checked после GET recovery",
    async (command) => {
      const pendingCatalog = createDeferred<typeof catalog>();
      const getCatalog = vi
        .fn()
        .mockImplementationOnce(() => pendingCatalog.promise)
        .mockResolvedValueOnce(catalog);
      const write = vi.fn().mockRejectedValue(new Error("Ответ не получен"));
      setCatalogStoreDependencies({
        catalogApi: {
          getCatalog,
          createCategory: command === "create" ? write : vi.fn(),
          updateCategory: command === "update" ? write : vi.fn(),
          reorderCategories: vi.fn(),
          archiveCategory: vi.fn(),
          createProduct: vi.fn(),
          updateProduct: vi.fn(),
          reorderProducts: vi.fn(),
          archiveProduct: vi.fn(),
          archiveModifierGroup: vi.fn(),
          createModifierOption: vi.fn(),
          updateModifierOption: vi.fn(),
          archiveModifierOption: vi.fn(),
          replaceCategoryModifierGroups: vi.fn(),
          saveModifierGroup: vi.fn(),
        },
      });
      const store = useCatalogStore();
      store.$patch({ ...catalog, status: "ready" });
      vi.spyOn(store, "load").mockResolvedValue();
      const wrapper = mountPage();

      const dialog = await openCategoryDialog(wrapper, command);
      emitCategorySave(dialog, command);
      await vi.waitFor(() => expect(write).toHaveBeenCalledTimes(1));
      await vi.waitFor(() => expect(store.formSaveOutcome).toBe("unconfirmed"));

      emitCategorySave(dialog, command);
      await wrapper.vm.$nextTick();
      expect(write).toHaveBeenCalledTimes(1);

      dialog.vm.$emit("refresh");
      await vi.waitFor(() => expect(getCatalog).toHaveBeenCalledTimes(1));
      expect(store.status).toBe("loading");
      emitCategorySave(dialog, command);
      await wrapper.vm.$nextTick();
      expect(write).toHaveBeenCalledTimes(1);

      pendingCatalog.reject(new Error("Сеть недоступна"));
      await vi.waitFor(() => expect(store.status).toBe("error"));
      emitCategorySave(dialog, command);
      await wrapper.vm.$nextTick();
      expect(write).toHaveBeenCalledTimes(1);

      dialog.vm.$emit("refresh");
      await vi.waitFor(() => expect(getCatalog).toHaveBeenCalledTimes(2));
      await vi.waitFor(() => expect(dialog.props("saveOutcome")).toBe("saved"));
      emitCategorySave(dialog, command);
      await wrapper.vm.$nextTick();

      expect(write).toHaveBeenCalledTimes(1);
      expect(getCatalog).toHaveBeenCalledTimes(2);
    },
  );

  it.each(["create", "update"] as const)(
    "закрывает %s категории с truthful copy после failed refetch",
    async (command) => {
      const getCatalog = vi
        .fn()
        .mockRejectedValue(new Error("Сеть недоступна"));
      const write = vi.fn().mockResolvedValue(catalog.categories[0]);
      setCatalogStoreDependencies({
        catalogApi: {
          getCatalog,
          createCategory: command === "create" ? write : vi.fn(),
          updateCategory: command === "update" ? write : vi.fn(),
          reorderCategories: vi.fn(),
          archiveCategory: vi.fn(),
          createProduct: vi.fn(),
          updateProduct: vi.fn(),
          reorderProducts: vi.fn(),
          archiveProduct: vi.fn(),
          archiveModifierGroup: vi.fn(),
          createModifierOption: vi.fn(),
          updateModifierOption: vi.fn(),
          archiveModifierOption: vi.fn(),
          replaceCategoryModifierGroups: vi.fn(),
          saveModifierGroup: vi.fn(),
        },
      });
      const store = useCatalogStore();
      store.$patch({ ...catalog, status: "ready" });
      vi.spyOn(store, "load").mockResolvedValue();
      const wrapper = mountPage();
      const dialog = await openCategoryDialog(wrapper, command);

      emitCategorySave(dialog, command);

      await vi.waitFor(() =>
        expect(wrapper.text()).toContain(
          "Категория сохранена, но меню не удалось обновить.",
        ),
      );
      expect(dialog.props("open")).toBe(false);
      expect(write).toHaveBeenCalledTimes(1);
      expect(getCatalog).toHaveBeenCalledTimes(1);
    },
  );

  it("изолирует ownership ошибки refetch при переходе категории к товару", async () => {
    const store = useCatalogStore();
    store.$patch({ ...catalog, status: "ready" });
    vi.spyOn(store, "load").mockResolvedValue();
    vi.spyOn(store, "createCategory").mockImplementation(async () => {
      store.$patch({
        formSaveOutcome: "saved",
        lastCommandSucceeded: true,
        status: "error",
      });
    });
    vi.spyOn(store, "createProduct").mockImplementation(async () => {
      store.$patch({
        formSaveOutcome: "saved",
        lastCommandSucceeded: true,
        status: "error",
      });
    });
    const wrapper = mountPage();

    await clickButton(wrapper, "Добавить группу");
    wrapper
      .getComponent({ name: "AddCategoryDialog" })
      .vm.$emit("confirm", categoryFormData);
    await wrapper.vm.$nextTick();
    await clickButton(wrapper, "Добавить товар");
    wrapper
      .getComponent({ name: "AddProductDialog" })
      .vm.$emit("confirm", productFormData);
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain(
        "Товар сохранён, но меню не удалось обновить.",
      ),
    );
  });

  it("изолирует ownership ошибки refetch при переходе товара к категории", async () => {
    const store = useCatalogStore();
    store.$patch({ ...catalog, status: "ready" });
    vi.spyOn(store, "load").mockResolvedValue();
    vi.spyOn(store, "createProduct").mockImplementation(async () => {
      store.$patch({
        formSaveOutcome: "saved",
        lastCommandSucceeded: true,
        status: "error",
      });
    });
    vi.spyOn(store, "createCategory").mockImplementation(async () => {
      store.$patch({
        formSaveOutcome: "saved",
        lastCommandSucceeded: true,
        status: "error",
      });
    });
    const wrapper = mountPage();

    await clickButton(wrapper, "Добавить товар");
    wrapper
      .getComponent({ name: "AddProductDialog" })
      .vm.$emit("confirm", productFormData);
    await wrapper.vm.$nextTick();
    await clickButton(wrapper, "Добавить группу");
    wrapper
      .getComponent({ name: "AddCategoryDialog" })
      .vm.$emit("confirm", categoryFormData);
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain(
        "Категория сохранена, но меню не удалось обновить.",
      ),
    );
  });
});

function mountPage(): VueWrapper {
  const wrapper = mount(MenuPage, {
    attachTo: document.body,
    global: {
      stubs: {
        PageShell: { template: "<div><slot /></div>" },
        VCard: { template: "<div><slot /></div>" },
        VCardActions: { template: "<div><slot /></div>" },
        VCardText: { template: "<div><slot /></div>" },
        VCardTitle: { template: "<div><slot /></div>" },
        VDialog: {
          props: ["modelValue"],
          template: '<div v-if="modelValue"><slot /></div>',
        },
        VSwitch: { template: "<div />" },
        VTextField: { template: "<div />" },
      },
    },
  });
  mountedWrappers.push(wrapper);
  return wrapper;
}

const productFormData: ProductFormData = {
  categoryId: "category-coffee",
  description: "",
  isActive: true,
  isAvailable: true,
  name: "Флэт уайт",
  price: 300,
  type: "OTHER",
  variants: [],
};

const categoryFormData = {
  name: "Десерты",
  description: "",
  isActive: true,
};

function productWithSortOrder(id: string, sortOrder: number) {
  return {
    id,
    categoryId: "category-coffee",
    type: "OTHER" as const,
    name: id,
    description: "",
    price: 300,
    sortOrder,
    isActive: true,
    isAvailable: true,
    variants: [],
  };
}

function modifierGroup() {
  return {
    id: "group-milk",
    name: "Молоко",
    selectionType: "single" as const,
    minSelect: 0,
    maxSelect: 1,
    isActive: true,
    options: [],
  };
}

async function openCategoryDialog(
  wrapper: VueWrapper,
  command: "create" | "update",
): Promise<CategoryDialog> {
  if (command === "create") {
    await clickButton(wrapper, "Добавить группу");
    return wrapper.getComponent({
      name: "AddCategoryDialog",
    }) as unknown as CategoryDialog;
  }

  await wrapper
    .get('button[aria-label="Редактировать категорию Кофе"]')
    .trigger("click");
  return wrapper.getComponent({
    name: "EditCategoryDialog",
  }) as unknown as CategoryDialog;
}

function emitCategorySave(
  dialog: CategoryDialog,
  command: "create" | "update",
): void {
  dialog.vm.$emit(command === "create" ? "confirm" : "save", categoryFormData);
}

type CategoryDialog = {
  vm: { $emit: (event: string, ...args: unknown[]) => void };
  props: (name: string) => unknown;
};

function createDeferred<T>() {
  let reject!: (reason?: unknown) => void;
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, reject, resolve };
}

async function clickButton(
  wrapper: ButtonContainer,
  text: string,
): Promise<void> {
  await buttonByText(wrapper, text).trigger("click");
}

async function openManagement(wrapper: ButtonContainer): Promise<void> {
  await wrapper.get('button[aria-label="Управление меню"]').trigger("click");
}

function buttonByText(wrapper: ButtonContainer, text: string) {
  const button = wrapper
    .findAll("button")
    .find((element) => element.text().trim() === text);

  if (!button) throw new Error(`Кнопка «${text}» не найдена`);
  return button;
}

type ButtonContainer =
  DOMWrapper<Element> | Omit<VueWrapper, "exists"> | VueWrapper;

function expectButtonsDisabled(
  wrapper: ButtonContainer,
  labels: readonly string[],
): void {
  for (const label of labels) {
    expect(
      buttonByText(wrapper, label).attributes("disabled"),
    ).not.toBeUndefined();
  }
}

function categoryNames(wrapper: VueWrapper): string[] {
  return wrapper
    .findAll(".menu-category__name")
    .map((element) => element.text());
}

function productNames(wrapper: VueWrapper): string[] {
  return wrapper
    .findAll(".menu-product-row__name")
    .map((element) => element.text());
}

function dialogButtons(
  wrapper: VueWrapper,
  className: string,
  labels: readonly string[],
) {
  return wrapper
    .findAll(`.${className} .admin-button`)
    .filter((button) => labels.includes(button.text().trim()));
}
