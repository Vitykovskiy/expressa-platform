import { mount } from "@vue/test-utils";
import { defineComponent, nextTick, ref } from "vue";
import { describe, expect, it } from "vitest";

import EditProductDialog from "./EditProductDialog.vue";

const stubs = {
  ConfirmDialog: true,
  "v-card": { template: "<div><slot /></div>" },
  "v-card-actions": { template: "<div><slot /></div>" },
  "v-card-text": { template: "<div><slot /></div>" },
  "v-card-title": { template: "<div><slot /></div>" },
  "v-dialog": { template: "<div><slot /></div>" },
};

const product = {
  id: "product-1",
  categoryId: "category-1",
  type: "OTHER" as const,
  name: "Кофе",
  description: "",
  price: 100,
  sortOrder: 0,
  isActive: true,
  isAvailable: true,
  variants: [],
};

const drinkProduct = {
  ...product,
  type: "DRINK" as const,
  price: null,
  variants: [
    {
      id: "variant-s",
      productId: "product-1",
      size: "S" as const,
      price: 150,
      sortOrder: 0,
      isAvailable: true,
    },
  ],
};

describe("EditProductDialog", () => {
  const categories = [
    {
      id: "category-1",
      name: "Кофе",
      description: "",
      sortOrder: 0,
      isActive: true,
    },
  ];

  it("не объявляет pristine обязательные поля ошибочными", () => {
    const wrapper = mount(EditProductDialog, {
      props: { open: true, disabled: false, categories: [], product },
      global: { stubs },
    });

    expect(wrapper.findAll('[role="alert"]')).toHaveLength(0);
  });

  it("показывает pending статус и persistent modal", () => {
    const wrapper = mount(EditProductDialog, {
      props: { open: true, disabled: true, categories: [], product },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Сохраняем товар…");
    expect(
      wrapper.getComponent({ name: "AdminDialog" }).props("persistent"),
    ).toBe(true);
  });

  it("после проверенного чтения предлагает закрыть форму без повторного recovery", () => {
    const wrapper = mount(EditProductDialog, {
      props: {
        open: false,
        disabled: false,
        categories: [],
        product,
        saveOutcome: "saved",
      },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Меню обновлено. Закройте форму");
    expect(
      wrapper
        .findAll("button")
        .filter((button) => button.text() === "Обновить меню"),
    ).toHaveLength(0);
  });

  it("блокирует все controls, пока черновик сохраняется", () => {
    const wrapper = mount(EditProductDialog, {
      props: { open: true, disabled: true, categories: [], product },
      global: { stubs },
    });

    expect(wrapper.findAll("button, input, select")).not.toHaveLength(0);
    expect(
      wrapper
        .findAll("button, input, select")
        .every((control) => control.attributes("disabled") !== undefined),
    ).toBe(true);
  });

  it("показывает сворачиваемые технические сведения об ошибке сохранения", () => {
    const wrapper = mount(EditProductDialog, {
      props: {
        open: true,
        disabled: false,
        categories: [],
        product,
        saveError: { message: "Ошибка сервера", requestId: "request-42" },
        saveOutcome: "rejected",
      },
      global: { stubs },
    });

    expect(wrapper.get("details").text()).toContain("Ошибка сервера");
    expect(wrapper.get("details").text()).toContain("request-42");
    expect(wrapper.findAll(".edit-dialog-outcome")).toHaveLength(1);
  });

  it("снимает серверную ошибку названия после исправления поля", async () => {
    const wrapper = mount(EditProductDialog, {
      props: {
        open: false,
        disabled: false,
        categories,
        fieldErrors: { name: "Название уже используется" },
        product,
      },
      global: { stubs },
    });

    await wrapper.setProps({ open: true });
    expect(wrapper.text()).toContain("Название уже используется");
    await wrapper.get('input[id^="edit-product-name-"]').setValue("Раф");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Сохранить изменения")!
      .trigger("click");

    expect(wrapper.text()).not.toContain("Название уже используется");
    expect(wrapper.emitted("save")).toEqual([
      [
        {
          categoryId: "category-1",
          type: "OTHER",
          name: "Раф",
          description: "",
          isActive: true,
          isAvailable: true,
          price: 100,
          variants: [],
        },
      ],
    ]);
  });

  it("передаёт изменённые active и варианты напитка одним сохранением", async () => {
    const wrapper = mount(EditProductDialog, {
      props: {
        open: false,
        disabled: false,
        categories,
        product: drinkProduct,
      },
      global: { stubs },
    });

    await wrapper.setProps({ open: true });
    for (const input of wrapper.findAll('input[id^="edit-product-price-"]'))
      await input.setValue("180");
    await wrapper
      .get('[role="switch"][aria-labelledby^="edit-product-active-"]')
      .trigger("click");
    await wrapper
      .get('[role="switch"][aria-label^="Размер S доступен"]')
      .trigger("click");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Сохранить изменения")!
      .trigger("click");

    expect(wrapper.emitted("save")).toEqual([
      [
        expect.objectContaining({
          type: "DRINK",
          isActive: false,
          variants: expect.arrayContaining([
            expect.objectContaining({
              size: "S",
              price: 180,
              isAvailable: false,
            }),
          ]),
        }),
      ],
    ]);
  });

  it("возвращает фокус на команду, открывшую форму", async () => {
    const opener = document.createElement("button");
    document.body.append(opener);
    opener.focus();
    const FocusHost = defineComponent({
      components: { EditProductDialog },
      setup() {
        return { categories, open: ref(false), product };
      },
      template:
        '<EditProductDialog v-model:open="open" :disabled="false" :categories="categories" :product="product" />',
    });
    const wrapper = mount(FocusHost, {
      attachTo: document.body,
      global: { stubs },
    });
    const dialog = wrapper.getComponent(EditProductDialog);

    (wrapper.vm as { open: boolean }).open = true;
    await nextTick();
    await dialog.getComponent({ name: "AdminDialog" }).vm.$emit("after-enter");
    await nextTick();
    await nextTick();

    expect(document.activeElement).toBe(
      dialog.get('input[id^="edit-product-name-"]').element,
    );
    await dialog
      .getComponent({ name: "AdminDialog" })
      .vm.$emit("update:modelValue", false);
    await nextTick();
    await nextTick();

    expect(document.activeElement).toBe(opener);
    wrapper.unmount();
    opener.remove();
  });

  it("показывает ошибку цены OTHER после потери фокуса", async () => {
    const wrapper = mount(EditProductDialog, {
      props: { open: true, disabled: false, categories: [], product },
      global: { stubs },
    });

    await wrapper.get('input[id^="edit-product-price-"]').trigger("blur");

    expect(wrapper.text()).toContain("Укажите цену в целых рублях");
  });

  it("не показывает raw DRINK validity до касания ветки", async () => {
    const wrapper = mount(EditProductDialog, {
      props: { open: true, disabled: false, categories: [], product },
      global: { stubs },
    });

    await wrapper.get('select[id^="edit-product-type-"]').setValue("DRINK");

    expect(wrapper.findAll('[role="alert"]')).toHaveLength(0);
    expect(
      wrapper.get(".edit-dialog-actions button").attributes("disabled"),
    ).toBeDefined();
  });

  it("показывает ошибку выбранного размера после blur пустой цены", async () => {
    const wrapper = mount(EditProductDialog, {
      props: {
        open: false,
        disabled: false,
        categories,
        product: drinkProduct,
      },
      global: { stubs },
    });

    await wrapper.setProps({ open: true });
    const price = wrapper.get('input[id^="edit-product-price-"]');
    await price.setValue("");
    await price.trigger("blur");

    expect(wrapper.text()).toContain(
      "Укажите цену для каждого выбранного размера",
    );
  });

  it("показывает ошибку выбранного размера при первом неверном вводе", async () => {
    const wrapper = mount(EditProductDialog, {
      props: {
        open: false,
        disabled: false,
        categories,
        product: drinkProduct,
      },
      global: { stubs },
    });

    await wrapper.setProps({ open: true });
    await wrapper.get('input[id^="edit-product-price-"]').setValue("-1");

    expect(wrapper.text()).toContain(
      "Укажите цену для каждого выбранного размера",
    );
  });
});
