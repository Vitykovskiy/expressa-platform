import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import AddProductDialog from "./AddProductDialog.vue";

const stubs = {
  VDialog: { template: "<div><slot /></div>" },
  "v-card": { template: "<div><slot /></div>" },
  "v-card-actions": { template: "<div><slot /></div>" },
  "v-card-text": { template: "<div><slot /></div>" },
};
const categories = [
  {
    id: "category-1",
    name: "Кофе",
    description: "",
    sortOrder: 0,
    isActive: true,
  },
];

describe("AddProductDialog", () => {
  it("saves one price with a custom portion label as plain text", async () => {
    const wrapper = mount(AddProductDialog, {
      props: { open: true, disabled: false, categories },
      global: { stubs },
    });
    await wrapper
      .get('select[id^="add-product-category-"]')
      .setValue("category-1");
    await wrapper.get('input[id^="add-product-name-"]').setValue("Капучино");
    await wrapper.findAll('input[type="number"]')[0]!.setValue("250");
    await wrapper.findAll("select")[1]!.setValue("Свой вариант…");
    await wrapper
      .get(".price-fields input:not([type])")
      .setValue("Большой стакан");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Добавить товар")!
      .trigger("click");
    expect(wrapper.emitted("confirm")?.[0]?.[0]).toMatchObject({
      price: 250,
      portionLabel: "Большой стакан",
      priceChoices: [],
    });
  });

  it("preserves the first row when multiple prices are enabled", async () => {
    const wrapper = mount(AddProductDialog, {
      props: { open: true, disabled: false, categories },
      global: { stubs },
    });
    await wrapper
      .get('select[id^="add-product-category-"]')
      .setValue("category-1");
    await wrapper.get('input[id^="add-product-name-"]').setValue("Капучино");
    await wrapper.findAll('input[type="number"]')[0]!.setValue("250");
    await wrapper.findAll("select")[1]!.setValue("250 мл");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Несколько цен")!
      .trigger("click");
    expect(wrapper.get('[role="group"][aria-label="Вариант 1"]')).toBeTruthy();
    expect(wrapper.get('[role="group"][aria-label="Вариант 2"]')).toBeTruthy();
    const rows = wrapper.findAll(".add-dialog__choice");
    await rows[1]!.find('input[type="number"]').setValue("300");
    await rows[1]!.find("select").setValue("350 мл");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Добавить товар")!
      .trigger("click");
    expect(wrapper.emitted("confirm")?.[0]?.[0]).toMatchObject({
      price: null,
      portionLabel: null,
      priceChoices: [
        { portionLabel: "250 мл", price: 250, sortOrder: 0 },
        { portionLabel: "350 мл", price: 300, sortOrder: 1 },
      ],
    });
  });
});
