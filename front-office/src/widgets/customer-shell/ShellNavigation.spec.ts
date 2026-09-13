import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import ShellNavigation from "./ShellNavigation.vue";
import type { ShellNavigationProps } from "./ShellNavigation.types";

describe("ShellNavigation", () => {
  it("возвращает в меню из корзины через объединённый бренд", async () => {
    const wrapper = mount(ShellNavigation, {
      props: createProps({ activeDestination: "cart" }),
    });

    expect(wrapper.find('[aria-label="Перейти в меню"]').exists()).toBe(true);
    expect(wrapper.find('[aria-label="Назад"]').exists()).toBe(false);

    await wrapper.get('[aria-label="Перейти в меню"]').trigger("click");

    expect(wrapper.emitted("navigate")).toEqual([["menu"]]);
  });

  it("возвращает в меню из истории через объединённый бренд", async () => {
    const wrapper = mount(ShellNavigation, {
      props: createProps({ activeDestination: "orders" }),
    });

    expect(wrapper.find('[aria-label="Перейти в меню"]').exists()).toBe(true);
    expect(wrapper.find('[aria-label="Назад"]').exists()).toBe(false);

    await wrapper.get('[aria-label="Перейти в меню"]').trigger("click");

    expect(wrapper.emitted("navigate")).toEqual([["menu"]]);
  });

  it("ведёт в историю отдельной мобильной кнопкой", async () => {
    const wrapper = mount(ShellNavigation, {
      props: createProps({ isAuthenticated: true }),
    });

    const history = wrapper.get('[aria-label="История заказов"]');
    await history.trigger("click");

    expect(wrapper.emitted("navigate")).toEqual([["orders"]]);
    expect(wrapper.get(".shell-navigation__account").text()).toContain(
      "+79991234567",
    );
  });

  it.each([{ cartCount: 0 }, { cartCount: 123 }])(
    "сохраняет полный текст бренда и все 44px-действия в узкой композиции: %o",
    ({ cartCount }) => {
      const wrapper = mount(ShellNavigation, {
        props: createProps({ cartCount }),
        global: {
          stubs: { UiBadge: { template: "<span><slot /></span>" } },
        },
      });

      expect(wrapper.get('[aria-label="Перейти в меню"]').text()).toBe(
        "Экспресса☕",
      );
      expect(
        wrapper.get('[aria-label="Перейти в меню"]').findAll("svg"),
      ).toHaveLength(0);
      expect(wrapper.find(".shell-navigation__brand-coffee").exists()).toBe(
        true,
      );
      expect(wrapper.get('[aria-label="История заказов"]')).toBeTruthy();
      expect(wrapper.get('[aria-label="Корзина"]')).toBeTruthy();
      expect(wrapper.get('[aria-label="Аккаунт"]')).toBeTruthy();
      expect(wrapper.find('[aria-label="Назад"]').exists()).toBe(false);
    },
  );

  it("открывает аккаунт из постоянного mobile header", async () => {
    const wrapper = mount(ShellNavigation, {
      props: createProps({ isAuthenticated: true, isLogoutPending: true }),
    });

    const account = wrapper.get('[aria-label="Аккаунт"]');
    expect(account.attributes("aria-haspopup")).toBe("dialog");
    await account.trigger("click");

    expect(wrapper.emitted("openAccount")).toEqual([[]]);
  });

  it.each(["menu", "cart", "orders", "auth"] as const)(
    "сохраняет Account в mobile header на маршруте %s",
    (activeDestination) => {
      const wrapper = mount(ShellNavigation, {
        props: createProps({ activeDestination }),
      });

      expect(wrapper.get('[aria-label="Аккаунт"]')).toBeTruthy();
      expect(wrapper.get('[aria-label="Перейти в меню"]')).toBeTruthy();
    },
  );
});

function createProps(overrides: Partial<ShellNavigationProps> = {}) {
  return {
    activeDestination: "menu" as const,
    accountLabel: "+79991234567",
    cartCount: 0,
    categories: [],
    isAuthenticated: false,
    isLogoutPending: false,
    ...overrides,
  };
}
