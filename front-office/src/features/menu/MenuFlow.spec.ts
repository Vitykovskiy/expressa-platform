import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { vuetify } from "@/app/plugins";
import type { PublicMenu } from "@/shared/api/public-menu.api";
import MenuFlow from "./MenuFlow.vue";
import MenuGroupScreen from "./MenuGroupScreen.vue";
import MenuRootScreen from "./MenuRootScreen.vue";

describe("MenuFlow", () => {
  beforeEach(() => history.replaceState({}, ""));
  it("открывает товар только из категории и возвращает добавление в неё", async () => {
    const wrapper = mount(MenuFlow, {
      props: { menu: createMenu() },
      global: { plugins: [vuetify] },
      attachTo: document.body,
    });

    expect(wrapper.find(".product-card").exists()).toBe(false);
    await wrapper
      .findComponent(MenuRootScreen)
      .vm.$emit("selectCategory", "espresso");
    await wrapper
      .findComponent(MenuGroupScreen)
      .vm.$emit("selectProduct", "espresso-single");

    expect(wrapper.get(".product-detail__title").text()).toBe("Эспрессо");
    await wrapper.get(".product-detail__submit").trigger("click");
    await nextTick();
    expect(wrapper.get('[role="status"]').text()).toBe(
      "Добавлено в корзину: Эспрессо",
    );
    expect(wrapper.findComponent(MenuGroupScreen).exists()).toBe(true);
  });

  it("переводит фокус на heading категории после Enter на исчезающем действии", async () => {
    const wrapper = mount(MenuFlow, {
      props: { menu: createMenu() },
      global: { plugins: [vuetify] },
      attachTo: document.body,
    });
    const action = wrapper.get('[aria-label="Открыть категорию Эспрессо"]');

    (action.element as HTMLElement).focus();
    await action.trigger("keydown", { key: "Enter" });
    await action.trigger("keyup", { key: "Enter" });
    await action.trigger("click");
    await nextTick();
    await nextTick();

    expect(document.activeElement?.id).toBe("menu-group-espresso");
    wrapper.unmount();
  });

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
    expect(wrapper.get(".product-detail__total").text()).toBe("180 ₽");
    expect(wrapper.get(".product-detail__submit").text()).toBe(
      "Добавить · 180 ₽",
    );
    expect(wrapper.find(".menu-flow__back").exists()).toBe(false);
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

  it("подтверждает каждую свежую shell-команду и не создаёт дублирующую history", async () => {
    const pushState = vi.spyOn(history, "pushState");
    const wrapper = mount(MenuFlow, {
      props: {
        menu: createMenu(),
        menuShellCommand: {
          requestId: 1,
          target: { id: "category", categoryId: "espresso" },
        },
      },
      global: { plugins: [vuetify] },
    });

    await nextTick();
    expect(wrapper.findComponent(MenuGroupScreen).exists()).toBe(true);
    expect(wrapper.emitted("menuShellCommandAck")).toEqual([[1]]);
    expect(wrapper.emitted("menuScreenChange")?.at(-1)).toEqual([
      { categoryId: "espresso", id: "category" },
    ]);
    const pushCount = pushState.mock.calls.length;

    await wrapper.setProps({
      menuShellCommand: {
        requestId: 2,
        target: { id: "category", categoryId: "espresso" },
      },
    });
    await wrapper.setProps({
      menuShellCommand: {
        requestId: 2,
        target: { id: "category", categoryId: "espresso" },
      },
    });

    expect(wrapper.emitted("menuShellCommandAck")).toEqual([[1], [2]]);
    expect(pushState.mock.calls).toHaveLength(pushCount);
  });

  it("поглощает отсутствующую категорию без перехода", async () => {
    const wrapper = mount(MenuFlow, {
      props: { menu: createMenu() },
      global: { plugins: [vuetify] },
    });

    await wrapper.setProps({
      menuShellCommand: {
        requestId: 1,
        target: { id: "category", categoryId: "missing" },
      },
    });

    expect(wrapper.findComponent(MenuRootScreen).exists()).toBe(true);
    expect(wrapper.emitted("menuShellCommandAck")).toEqual([[1]]);
    expect(wrapper.emitted("menuScreenChange")).toEqual([[{ id: "root" }]]);
  });

  it("целевое Меню возвращает в root после последовательности категорий", async () => {
    const wrapper = mount(MenuFlow, {
      props: { menu: createMenu() },
      global: { plugins: [vuetify] },
    });

    await wrapper.setProps({
      menuShellCommand: {
        requestId: 1,
        target: { id: "category", categoryId: "espresso" },
      },
    });
    await wrapper.setProps({
      menuShellCommand: {
        requestId: 2,
        target: { id: "category", categoryId: "bakery" },
      },
    });
    await wrapper.setProps({
      menuShellCommand: { requestId: 3, target: { id: "root" } },
    });

    expect(wrapper.findComponent(MenuRootScreen).exists()).toBe(true);
    expect(wrapper.emitted("menuScreenChange")?.at(-1)).toEqual([
      { id: "root" },
    ]);
  });

  it("восстанавливает валидный screen из history и shell category-target не зависит от history", async () => {
    history.replaceState(
      {
        menuFlowScreen: {
          id: "product",
          categoryId: "espresso",
          productId: "espresso-single",
        },
      },
      "",
    );
    const wrapper = mount(MenuFlow, {
      props: { menu: createMenu() },
      global: { plugins: [vuetify] },
    });

    await nextTick();
    expect(wrapper.get(".product-detail__title").text()).toBe("Эспрессо");
    await wrapper.setProps({
      menuShellCommand: {
        requestId: 1,
        target: { id: "category", categoryId: "espresso" },
      },
    });
    expect(wrapper.findComponent(MenuGroupScreen).exists()).toBe(true);
    await wrapper.setProps({
      menuShellCommand: { requestId: 2, target: { id: "root" } },
    });
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
            price: null,
            variants: [
              {
                id: "espresso-s",
                size: "S",
                price: 180,
                isAvailable: true,
              },
            ],
          },
        ],
      },
      {
        id: "bakery",
        name: "Выпечка",
        description: "",
        products: [],
      },
    ],
  };
}
