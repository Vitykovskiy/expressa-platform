import { mount } from "@vue/test-utils";
import { defineComponent, nextTick, ref } from "vue";
import { describe, expect, it } from "vitest";

import AddProductDialog from "./AddProductDialog.vue";

const stubs = {
  "v-card": { template: "<div><slot /></div>" },
  "v-card-actions": { template: "<div><slot /></div>" },
  "v-card-text": { template: "<div><slot /></div>" },
  "v-dialog": { template: "<div><slot /></div>" },
};

describe("AddProductDialog", () => {
  const categories = [
    {
      id: "category-1",
      name: "Кофе",
      description: "",
      sortOrder: 0,
      isActive: true,
    },
  ];

  it("не объявляет pristine обязательные поля ошибочными и блокирует сохранение", () => {
    const wrapper = mount(AddProductDialog, {
      props: { open: true, disabled: false, categories: [] },
      global: { stubs },
    });

    expect(wrapper.findAll('[role="alert"]')).toHaveLength(0);
    expect(
      wrapper.get(".add-dialog-actions button").attributes("disabled"),
    ).toBeDefined();
  });

  it("оставляет один GET-only recovery для uncertain сохранения", () => {
    const wrapper = mount(AddProductDialog, {
      props: {
        open: true,
        disabled: false,
        categories: [],
        saveOutcome: "unconfirmed",
      },
      global: { stubs },
    });

    expect(wrapper.text()).toContain(
      "Не удалось подтвердить сохранение товара",
    );
    expect(
      wrapper
        .findAll("button")
        .filter((button) => button.text() === "Обновить меню"),
    ).toHaveLength(1);
  });

  it("после проверенного чтения показывает только понятное закрытие", () => {
    const wrapper = mount(AddProductDialog, {
      props: {
        open: true,
        disabled: false,
        categories: [],
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

  it("показывает сворачиваемые технические сведения об ошибке сохранения", () => {
    const wrapper = mount(AddProductDialog, {
      props: {
        open: true,
        disabled: false,
        categories: [],
        saveError: { message: "Ошибка сервера", requestId: "request-42" },
        saveOutcome: "rejected",
      },
      global: { stubs },
    });

    expect(wrapper.get("details").text()).toContain("Ошибка сервера");
    expect(wrapper.get("details").text()).toContain("request-42");
    expect(wrapper.findAll(".add-dialog-outcome")).toHaveLength(1);
  });

  it("снимает серверную ошибку названия после исправления поля", async () => {
    const wrapper = mount(AddProductDialog, {
      props: {
        open: true,
        disabled: false,
        categories,
        fieldErrors: { name: "Название уже используется" },
      },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Название уже используется");
    await wrapper
      .get('select[id^="add-product-category-"]')
      .setValue("category-1");
    await wrapper.get('input[id^="add-product-name-"]').setValue("Раф");
    await wrapper.get('input[id^="add-product-price-"]').setValue("180");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Добавить товар")!
      .trigger("click");

    expect(wrapper.text()).not.toContain("Название уже используется");
    expect(wrapper.emitted("confirm")).toEqual([
      [
        {
          categoryId: "category-1",
          type: "OTHER",
          name: "Раф",
          description: "",
          isActive: true,
          isAvailable: true,
          price: 180,
          variants: [],
        },
      ],
    ]);
  });

  it("передаёт изменённые active и варианты напитка одним сохранением", async () => {
    const wrapper = mount(AddProductDialog, {
      props: { open: true, disabled: false, categories },
      global: { stubs },
    });

    await wrapper
      .get('select[id^="add-product-category-"]')
      .setValue("category-1");
    await wrapper.get('select[id^="add-product-type-"]').setValue("DRINK");
    await wrapper.get('input[id^="add-product-name-"]').setValue("Раф");
    for (const input of wrapper.findAll('input[id^="add-product-price-"]'))
      await input.setValue("180");
    await wrapper
      .get('[role="switch"][aria-labelledby^="add-product-active-"]')
      .trigger("click");
    await wrapper
      .get('[role="switch"][aria-label^="Размер S доступен"]')
      .trigger("click");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Добавить товар")!
      .trigger("click");

    expect(wrapper.emitted("confirm")).toEqual([
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
      components: { AddProductDialog },
      setup() {
        return { categories, open: ref(false) };
      },
      template:
        '<AddProductDialog v-model:open="open" :disabled="false" :categories="categories" />',
    });
    const wrapper = mount(FocusHost, {
      attachTo: document.body,
      global: { stubs },
    });
    const dialog = wrapper.getComponent(AddProductDialog);

    (wrapper.vm as { open: boolean }).open = true;
    await nextTick();
    await dialog.getComponent({ name: "AdminDialog" }).vm.$emit("after-enter");
    await nextTick();
    await nextTick();

    expect(document.activeElement).toBe(
      dialog.get('select[id^="add-product-category-"]').element,
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
    const wrapper = mount(AddProductDialog, {
      props: { open: true, disabled: false, categories: [] },
      global: { stubs },
    });

    await wrapper.get('input[id^="add-product-price-"]').trigger("blur");

    expect(wrapper.text()).toContain("Укажите цену в целых рублях");
  });

  it("блокирует все controls, пока черновик сохраняется", () => {
    const wrapper = mount(AddProductDialog, {
      props: { open: true, disabled: true, categories: [] },
      global: { stubs },
    });

    expect(wrapper.findAll("button, input, select")).not.toHaveLength(0);
    expect(
      wrapper
        .findAll("button, input, select")
        .every((control) => control.attributes("disabled") !== undefined),
    ).toBe(true);
  });

  it("не показывает raw DRINK validity до касания ветки", async () => {
    const wrapper = mount(AddProductDialog, {
      props: { open: true, disabled: false, categories: [] },
      global: { stubs },
    });

    await wrapper.get('select[id^="add-product-type-"]').setValue("DRINK");

    expect(wrapper.findAll('[role="alert"]')).toHaveLength(0);
    expect(
      wrapper.get(".add-dialog-actions button").attributes("disabled"),
    ).toBeDefined();
  });

  it("показывает ошибку выбранного размера после blur пустой цены", async () => {
    const wrapper = mount(AddProductDialog, {
      props: { open: true, disabled: false, categories: [] },
      global: { stubs },
    });

    await wrapper.get('select[id^="add-product-type-"]').setValue("DRINK");
    await wrapper.get('input[id^="add-product-price-"]').trigger("blur");

    expect(wrapper.text()).toContain(
      "Укажите цену для каждого выбранного размера",
    );
  });

  it("показывает ошибку выбранного размера при первом неверном вводе", async () => {
    const wrapper = mount(AddProductDialog, {
      props: { open: true, disabled: false, categories: [] },
      global: { stubs },
    });

    await wrapper.get('select[id^="add-product-type-"]').setValue("DRINK");
    await wrapper.get('input[id^="add-product-price-"]').setValue("-1");

    expect(wrapper.text()).toContain(
      "Укажите цену для каждого выбранного размера",
    );
  });
});
