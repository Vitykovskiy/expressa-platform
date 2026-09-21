import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import { vuetify } from "@/app/plugins";
import type {
  PublicMenuCategory,
  PublicMenuProduct,
} from "@/shared/api/public-menu.api";
import ProductDetailScreen from "./ProductDetailScreen.vue";

describe("ProductDetailScreen", () => {
  it("renders the mobile action area as an in-flow footer", () => {
    const wrapper = mountProductDetail();
    const footer = wrapper.get(".product-detail__footer");

    expect(footer.element.tagName).toBe("FOOTER");
    expect(footer.element.parentElement?.classList).toContain("product-detail");
  });

  it("keeps the counter and add action as native controls", () => {
    const wrapper = mountProductDetail();

    expect(
      wrapper.get('[aria-label="Уменьшить количество"]').element,
    ).toBeInstanceOf(HTMLButtonElement);
    expect(
      wrapper.get('[aria-label="Увеличить количество"]').element,
    ).toBeInstanceOf(HTMLButtonElement);
    expect(wrapper.get(".product-detail__submit").text()).toContain("Добавить");
  });

  it("emits screen-owned Back from the contextual row before product content", async () => {
    const wrapper = mountProductDetail();
    const contextRow = wrapper.get(".product-detail__context-row");

    expect(contextRow.findAll('[aria-label="Назад"]')).toHaveLength(1);
    expect(wrapper.find(".product-detail__title-row").exists()).toBe(false);
    expect(
      contextRow.element.nextElementSibling?.classList.contains(
        "product-detail__header",
      ),
    ).toBe(true);
    await contextRow.get('[aria-label="Назад"]').trigger("click");

    expect(wrapper.emitted("back")).toEqual([[]]);
  });
});

function mountProductDetail() {
  return mount(ProductDetailScreen, {
    props: {
      category: {
        description: "",
        id: "coffee",
        name: "Кофе",
        products: [],
      } satisfies PublicMenuCategory,
      product: {
        description: "",
        id: "espresso",
        isAvailable: true,
        modifierGroups: [],
        name: "Эспрессо",
        price: null,
        portionLabel: null,
        priceChoices: [
          {
            id: "espresso-s",
            isAvailable: true,
            price: 180,
            portionLabel: "250 мл",
          },
        ],
      } satisfies PublicMenuProduct,
    },
    global: { plugins: [vuetify] },
  });
}
