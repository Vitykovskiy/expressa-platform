import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { describe, expect, it, vi } from "vitest";

import { vuetify } from "@/app/plugins";
import type { PublicMenu } from "@/shared/api/public-menu.api";
import MenuFlow from "./MenuFlow.vue";
import MenuGroupScreen from "./MenuGroupScreen.vue";
import MenuRootScreen from "./MenuRootScreen.vue";

describe("MenuFlow", () => {
  it("возвращает product в category через history и восстанавливает scroll", async () => {
    const menu = createMenu();
    const removeEventListener = vi.spyOn(window, "removeEventListener");
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const wrapper = mount(MenuFlow, {
      props: { menu },
      global: { plugins: [vuetify] },
    });

    await wrapper
      .findComponent(MenuRootScreen)
      .vm.$emit("selectCategory", "espresso");
    expect(history.state.menuFlowScreen).toEqual({
      categoryId: "espresso",
      id: "category",
    });
    expect(() => structuredClone(history.state.menuFlowScreen)).not.toThrow();

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 240,
    });
    await wrapper
      .findComponent(MenuGroupScreen)
      .vm.$emit("selectProduct", "espresso-single");
    expect(history.state.menuFlowScreen).toEqual({
      categoryId: "espresso",
      id: "product",
      productId: "espresso-single",
    });
    expect(() => structuredClone(history.state.menuScreen)).not.toThrow();

    await backTo({ id: "category", categoryId: "espresso" });
    await nextTick();
    expect(wrapper.findComponent(MenuGroupScreen).exists()).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ top: 240 });

    await backTo({ id: "root" });
    await nextTick();
    expect(wrapper.findComponent(MenuRootScreen).exists()).toBe(true);

    wrapper.unmount();
    expect(removeEventListener).toHaveBeenCalledWith(
      "popstate",
      expect.any(Function),
    );
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  });

  it("показывает для пустой категории единое действие возврата к категориям", async () => {
    const defaults = createMenu();
    const menu = {
      ...defaults,
      acceptsNewOrders: true,
      categories: defaults.categories.map((category) =>
        category.id === "espresso" ? { ...category, products: [] } : category,
      ),
    };
    const wrapper = mount(MenuFlow, {
      props: { menu },
      global: { plugins: [vuetify] },
    });

    await wrapper
      .findComponent(MenuRootScreen)
      .vm.$emit("selectCategory", "espresso");

    expect(wrapper.get(".menu-group__empty").text()).toContain(
      "В этой категории пока нет товаров",
    );
    expect(wrapper.get("button").text()).toContain("К категориям");
    expect(
      wrapper.findAll("button").filter((button) => button.text() === "Назад"),
    ).toHaveLength(0);

    history.replaceState({}, "");
    await wrapper.get("button").trigger("click");
    await nextTick();
    expect(wrapper.findComponent(MenuRootScreen).exists()).toBe(true);
  });
});

async function backTo(
  screen:
    | { id: "root" }
    | { id: "category"; categoryId: string }
    | { id: "product"; categoryId: string; productId: string },
): Promise<void> {
  const popstate = new Promise<void>((resolve) => {
    window.addEventListener("popstate", () => resolve(), { once: true });
  });

  history.back();
  window.dispatchEvent(
    new PopStateEvent("popstate", { state: { menuFlowScreen: screen } }),
  );
  await popstate;
}

function createMenu(): PublicMenu {
  return {
    acceptsNewOrders: true,
    categories: [
      {
        id: "espresso",
        name: "Эспрессо",
        description: "",
        products: [
          {
            id: "espresso-single",
            name: "Эспрессо",
            description: "",
            isAvailable: true,
            modifierGroups: [],
            type: "DRINK",
            priceMinor: null,
            variants: [
              {
                id: "espresso-s",
                size: "S",
                priceMinor: 18000,
                isAvailable: true,
              },
            ],
          },
        ],
      },
    ],
  };
}
