import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import { vuetify } from "@/app/plugins";
import type { PublicMenuProduct } from "@/shared/api/public-menu.api";
import { PRODUCT_CARD_UNAVAILABLE_STATUS } from "./ProductCard.constants";
import ProductCard from "./ProductCard.vue";

describe("ProductCard", () => {
  it("показывает недоступный напиток с доступным статусом и не выбирает его", async () => {
    const wrapper = mountProductCard(createDrink({ isAvailable: false }));
    const button = wrapper.get("button");
    const status = wrapper.get('[role="status"]');

    expect(button.attributes("disabled")).toBeDefined();
    expect(button.attributes("aria-describedby")).toBe(status.attributes("id"));
    expect(status.text()).toBe(PRODUCT_CARD_UNAVAILABLE_STATUS);
    expect(button.text()).not.toContain(">");
    expect(wrapper.text()).toContain("Очень длинное название напитка");
    expect(wrapper.text()).toContain(PRODUCT_CARD_UNAVAILABLE_STATUS);
    expect(wrapper.text()).toContain("S · 180 ₽");
    expect(wrapper.text()).toContain("M · 220 ₽");
    expect(wrapper.findAll(".product-card__price--unavailable")).toHaveLength(
      1,
    );

    button.element.click();
    await button.trigger("keydown", { key: "Enter" });
    await button.trigger("keyup", { key: "Enter" });
    await button.trigger("keydown", { key: " " });
    await button.trigger("keyup", { key: " " });

    expect(wrapper.emitted("select")).toBeUndefined();
  });

  it("сохраняет цену и статус недоступной карточки OTHER", () => {
    const wrapper = mountProductCard(createOther({ isAvailable: false }));

    expect(wrapper.get("button").attributes("disabled")).toBeDefined();
    expect(wrapper.get('[role="status"]').text()).toBe(
      PRODUCT_CARD_UNAVAILABLE_STATUS,
    );
    expect(wrapper.text()).toContain("Печенье");
    expect(wrapper.text()).toContain(PRODUCT_CARD_UNAVAILABLE_STATUS);
    expect(wrapper.text()).toContain("120 ₽");
  });

  it("выбирает доступный товар один раз без статуса недоступности", () => {
    const product = createOther();
    const wrapper = mountProductCard(product);
    const button = wrapper.get("button");

    expect(button.attributes("disabled")).toBeUndefined();
    expect(wrapper.find('[role="status"]').exists()).toBe(false);

    button.element.click();

    expect(wrapper.emitted("select")).toEqual([[product.id]]);
  });
});

function mountProductCard(product: PublicMenuProduct) {
  return mount(ProductCard, {
    props: { product },
    global: { plugins: [vuetify] },
  });
}

function createDrink(
  overrides: Partial<PublicMenuProduct> = {},
): PublicMenuProduct {
  return {
    id: "drink",
    name: "Очень длинное название напитка",
    description: "",
    isAvailable: true,
    modifierGroups: [],
    type: "DRINK",
    price: null,
    variants: [
      { id: "drink-s", isAvailable: true, price: 180, size: "S" },
      { id: "drink-m", isAvailable: false, price: 220, size: "M" },
    ],
    ...overrides,
  } as PublicMenuProduct;
}

function createOther(
  overrides: Partial<PublicMenuProduct> = {},
): PublicMenuProduct {
  return {
    id: "other",
    name: "Печенье",
    description: "",
    isAvailable: true,
    modifierGroups: [],
    type: "OTHER",
    price: 120,
    variants: [],
    ...overrides,
  } as PublicMenuProduct;
}
