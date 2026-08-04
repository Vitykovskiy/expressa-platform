import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { describe, expect, it, vi } from "vitest";

import { vuetify } from "../../../app/plugins";
import { createCustomerDefaults } from "../../../stories/customer/fixtures/customer.fixtures";
import MenuFlow from "./MenuFlow.vue";
import MenuGroupScreen from "./MenuGroupScreen.vue";
import MenuRootScreen from "./MenuRootScreen.vue";

describe("MenuFlow", () => {
  it("возвращает product в category через history и восстанавливает scroll", async () => {
    const menu = { ...createCustomerDefaults(), acceptsNewOrders: true };
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
