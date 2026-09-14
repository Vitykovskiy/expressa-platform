import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { describe, expect, it } from "vitest";

import EditProductDialog from "./EditProductDialog.vue";

const stubs = {
  ConfirmDialog: true,
  VDialog: { template: "<div><slot /></div>" },
  "v-card": { template: "<div><slot /></div>" },
  "v-card-actions": { template: "<div><slot /></div>" },
  "v-card-text": { template: "<div><slot /></div>" },
  "v-card-title": { template: "<div><slot /></div>" },
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
const product = {
  id: "product-1",
  categoryId: "category-1",
  type: "OTHER" as const,
  name: "Капучино",
  description: "",
  price: null,
  portionLabel: null,
  priceChoices: [
    {
      id: "choice-1",
      portionLabel: "250 мл",
      price: 250,
      sortOrder: 0,
      isAvailable: true,
    },
    {
      id: "choice-2",
      portionLabel: "350 мл",
      price: 300,
      sortOrder: 1,
      isAvailable: true,
    },
  ],
  sortOrder: 0,
  isActive: true,
  isAvailable: true,
  variants: [],
};

describe("EditProductDialog", () => {
  it("reopens ordered v3 choices and saves a custom label", async () => {
    const wrapper = mount(EditProductDialog, {
      props: { open: true, disabled: false, categories, product },
      global: { stubs },
    });
    await nextTick();
    expect(wrapper.findAll(".edit-dialog-choice")).toHaveLength(2);
    expect(wrapper.get('[role="group"][aria-label="Вариант 1"]')).toBeTruthy();
    expect(wrapper.get('[role="group"][aria-label="Вариант 2"]')).toBeTruthy();
    await wrapper
      .findAll(".edit-dialog-choice")[1]!
      .find("select")
      .setValue("Свой вариант…");
    await wrapper
      .get(".edit-dialog-choice .price-fields input:not([type])")
      .setValue("Большой стакан");
    await wrapper.get(".edit-dialog-actions button").trigger("click");
    expect(wrapper.emitted("save")?.[0]?.[0]).toMatchObject({
      priceChoices: [
        { id: "choice-1", portionLabel: "250 мл", sortOrder: 0 },
        { id: "choice-2", portionLabel: "Большой стакан", sortOrder: 1 },
      ],
    });
  });

  it("returns to compact pricing after removing a choice", async () => {
    const wrapper = mount(EditProductDialog, {
      props: { open: true, disabled: false, categories, product },
      global: { stubs },
    });
    await nextTick();
    await wrapper
      .findAll(".edit-dialog-choice button")
      .find((button) => button.text() === "Удалить")!
      .trigger("click");
    expect(wrapper.findAll(".edit-dialog-choice")).toHaveLength(0);
    expect(wrapper.text()).toContain("Порция (необязательно)");
  });
});
