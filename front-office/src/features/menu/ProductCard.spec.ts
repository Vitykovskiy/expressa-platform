import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import { vuetify } from "@/app/plugins";
import type { PublicMenuProduct } from "@/shared/api/public-menu.api";
import { PRODUCT_CARD_UNAVAILABLE_DESCRIPTION } from "./ProductCard.constants";
import ProductCard from "./ProductCard.vue";

describe("ProductCard", () => {
  it("приглушает недоступный напиток, заменяет описание и не выбирает его", async () => {
    const wrapper = mountProductCard(createDrink({ isAvailable: false }));
    const button = wrapper.get("button");
    const description = wrapper.get(".product-card__description");

    expect(button.attributes("disabled")).toBeDefined();
    expect(button.classes()).toContain("product-card--unavailable");
    expect(button.attributes("aria-describedby")).toBe(
      description.attributes("id"),
    );
    expect(description.text()).toBe(PRODUCT_CARD_UNAVAILABLE_DESCRIPTION);
    expect(description.element.parentElement?.classList).toContain(
      "product-card__info",
    );
    expect(button.text()).not.toContain(">");
    expect(wrapper.text()).toContain("Очень длинное название напитка");
    expect(wrapper.text()).toContain(PRODUCT_CARD_UNAVAILABLE_DESCRIPTION);
    expect(wrapper.text()).not.toContain("S · 180 ₽");
    expect(wrapper.text()).not.toContain("M · 220 ₽");
    expect(wrapper.findAll(".product-card__price")).toHaveLength(0);
    expect(wrapper.text()).not.toContain("Сейчас недоступно");
    expect(wrapper.find(".product-card__unavailable-veil").exists()).toBe(true);

    button.element.click();
    await button.trigger("keydown", { key: "Enter" });
    await button.trigger("keyup", { key: "Enter" });
    await button.trigger("keydown", { key: " " });
    await button.trigger("keyup", { key: " " });

    expect(wrapper.emitted("select")).toBeUndefined();

    await wrapper.setProps({ product: createDrink() });

    expect(button.attributes("disabled")).toBeUndefined();
    expect(wrapper.find(".product-card__description").exists()).toBe(false);
    expect(wrapper.find(".product-card__unavailable-veil").exists()).toBe(
      false,
    );
  });

  it("скрывает цену и заменяет описание недоступной карточки OTHER", () => {
    const wrapper = mountProductCard(createOther({ isAvailable: false }));

    expect(wrapper.get("button").attributes("disabled")).toBeDefined();
    expect(wrapper.get(".product-card__description").text()).toBe(
      PRODUCT_CARD_UNAVAILABLE_DESCRIPTION,
    );
    expect(wrapper.text()).toContain("Печенье");
    expect(wrapper.text()).not.toContain("120 ₽");
  });

  it("выбирает доступный товар один раз без статуса доступности", () => {
    const product = createOther();
    const wrapper = mountProductCard(product);
    const button = wrapper.get("button");

    expect(button.attributes("disabled")).toBeUndefined();
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
    expect(wrapper.find(".product-card__unavailable-veil").exists()).toBe(
      false,
    );
    expect(wrapper.findAll(".product-card__price--unavailable")).toHaveLength(
      0,
    );

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
