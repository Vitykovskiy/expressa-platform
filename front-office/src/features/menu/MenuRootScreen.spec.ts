import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import { vuetify } from "@/app/plugins";
import type { PublicMenuCategory } from "@/shared/api/public-menu.api";
import MenuRootScreen from "./MenuRootScreen.vue";

describe("MenuRootScreen", () => {
  it("показывает заметное действие открытия категории с различимым именем", async () => {
    const category = createCategory();
    const wrapper = mount(MenuRootScreen, {
      props: { categories: [category] },
      global: { plugins: [vuetify] },
    });

    const action = wrapper.get(".menu-root__category-action");

    expect(action.text()).toContain("Открыть категорию");
    expect(action.attributes("aria-label")).toBe(
      `Открыть категорию ${category.name}`,
    );
    expect(action.attributes("variant")).toBeUndefined();
    expect(action.classes()).toContain("menu-root__category-action");
    expect(action.classes()).toContain("ui-btn--navigation");
    expect(action.classes()).toContain("ui-btn--navigation-forward");

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
