import { createPinia, setActivePinia } from "pinia";
import { mount, type DOMWrapper, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const session = { accessToken: "access-token" };

vi.mock("../app/session.store", () => ({ useSessionStore: () => session }));

import MenuPage from "./MenuPage.vue";
import { setCatalogStoreDependencies } from "../admin/pages/menu/catalog.dependencies";
import { useCatalogStore } from "../admin/pages/menu/catalog.store";
import type { ProductFormData } from "../admin/pages/menu/AddProductDialog.types";

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

    await clickButton(wrapper, "Новая группа добавок");
    expect(
      wrapper.getComponent({ name: "ModifierGroupEditor" }).props("group"),
    ).toBeNull();

    await clickButton(wrapper, "Отмена");
    await clickButton(wrapper, "Молоко");
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
    const trigger = buttonByText(wrapper, "Новая группа добавок");
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

    await clickButton(wrapper, "Новая группа добавок");
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

    await clickButton(wrapper, "Новая группа добавок");
    const input = wrapper.get('.modifier-group-editor input[type="text"]');
    await input.setValue("Сиропы");
    await clickButton(wrapper, "Сохранить группу");

    expect(wrapper.find(".modifier-group-editor").exists()).toBe(true);
    expect((input.element as HTMLInputElement).value).toBe("Сиропы");
  });

  it("повторяет загрузку после ошибки по нажатию кнопки", async () => {
    const store = useCatalogStore();
    store.$patch({
      error: { message: "Сеть недоступна", requestId: null },
      status: "error",
    });
    const load = vi.spyOn(store, "load").mockResolvedValue();
    const wrapper = mountPage();

    await clickButton(wrapper, "Повторить");

    expect(load).toHaveBeenCalledWith("access-token");
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
          priceMinor: 30000,
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
          priceMinor: 20000,
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

  it("собирает каталог в адаптивную сетку и показывает счётчик категорий", () => {
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

    expect(wrapper.get(".menu-page__categories").classes()).toContain(
      "menu-page__categories",
    );
    expect(wrapper.get(".menu-page__catalog-heading").text()).toContain(
      "2 категорий",
    );
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

    await clickButton(wrapper, "Молоко");
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
              priceDeltaMinor: 5000,
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

    await clickButton(wrapper, "Молоко");
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

    await clickButton(wrapper, "Добавить категорию");
    await clickButton(wrapper, "Редактировать");
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
          priceMinor: 20000,
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
  priceMinor: 30000,
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
    priceMinor: 30000,
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

async function clickButton(
  wrapper: ButtonContainer,
  text: string,
): Promise<void> {
  await buttonByText(wrapper, text).trigger("click");
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
