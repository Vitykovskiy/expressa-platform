import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import { vuetify } from "@/app/plugins";
import type { PublicMenuCategory } from "@/shared/api/public-menu.api";
import MenuRootScreen from "./MenuRootScreen.vue";

describe("MenuRootScreen", () => {
  it("показывает только доступную для всей площади карточку категории", async () => {
    const category = createCategory();
    const wrapper = mount(MenuRootScreen, {
      props: { categories: [category] },
      global: { plugins: [vuetify] },
    });

    const action = wrapper.get(".menu-root__category-card");

    expect(action.text()).toContain(category.name);
    expect(action.text()).toContain("0 позиций");
    expect(action.attributes("aria-label")).toBe(
      `Открыть категорию ${category.name}`,
    );
    expect(wrapper.find(".product-card").exists()).toBe(false);
    expect(wrapper.find(".menu-root__products").exists()).toBe(false);

    await action.trigger("click");

    expect(wrapper.emitted("selectCategory")).toEqual([[category.id]]);
  });
});

function createCategory(): PublicMenuCategory {
  return {
    id: "coffee",
    name: "Кофе с очень длинным названием категории",
    description: "",
    products: [],
  };
}
