import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import ShellNavigation from "./ShellNavigation.vue";
import type { ShellNavigationProps } from "./ShellNavigation.types";

describe("ShellNavigation", () => {
  it("открывает меню из корзины без кнопки назад", async () => {
    const wrapper = mount(ShellNavigation, {
      props: createProps({ activeDestination: "cart" }),
    });

    expect(wrapper.find('[aria-label="Меню"]').exists()).toBe(true);
    expect(wrapper.find('[aria-label="Назад"]').exists()).toBe(false);

    await wrapper.get('[aria-label="Меню"]').trigger("click");

    expect(wrapper.emitted("navigate")).toEqual([["menu"]]);
  });

  it("открывает меню из истории без кнопки назад", async () => {
    const wrapper = mount(ShellNavigation, {
      props: createProps({ activeDestination: "orders" }),
    });

    expect(wrapper.find('[aria-label="Меню"]').exists()).toBe(true);
    expect(wrapper.find('[aria-label="Назад"]').exists()).toBe(false);

    await wrapper.get('[aria-label="Меню"]').trigger("click");

    expect(wrapper.emitted("navigate")).toEqual([["menu"]]);
  });

  it("сохраняет distinct detail back и menu actions", async () => {
    const wrapper = mount(ShellNavigation, {
      props: createProps({ activeDestination: "orders", showBack: true }),
    });

    await wrapper.get('[aria-label="Назад"]').trigger("click");
    await wrapper.get('[aria-label="Меню"]').trigger("click");

    expect(wrapper.emitted("back")).toEqual([[]]);
    expect(wrapper.emitted("navigate")).toEqual([["menu"]]);
  });

  it("называет мобильную кнопку аккаунтом и историей, не меняя выход", async () => {
    const wrapper = mount(ShellNavigation, {
      props: createProps({ isAuthenticated: true }),
    });

    const accountControl = wrapper.get(
      '[aria-label="+79991234567: история заказов"]',
    );
    await accountControl.trigger("click");
    await wrapper.get('[aria-label="Выйти"]').trigger("click");

    expect(wrapper.emitted("navigate")).toEqual([["orders"]]);
    expect(wrapper.emitted("signOut")).toEqual([[]]);
    expect(wrapper.get(".shell-navigation__account").text()).toContain(
      "+79991234567",
    );

    await wrapper.setProps({ isAuthenticated: false });
    expect(wrapper.find('[aria-label="Подтвердить телефон"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[aria-label="Выйти"]').exists()).toBe(false);
  });

  it("объявляет и блокирует выход во время выполнения", () => {
    const wrapper = mount(ShellNavigation, {
      props: createProps({ isAuthenticated: true, isLogoutPending: true }),
    });

    const logout = wrapper.get('[aria-label="Выход выполняется"]');
    expect(logout.attributes("disabled")).toBeDefined();
    expect(logout.attributes("aria-busy")).toBe("true");
    expect(
      wrapper.get(".shell-navigation__account").attributes("disabled"),
    ).toBeDefined();
  });
});

function createProps(overrides: Partial<ShellNavigationProps> = {}) {
  return {
    activeDestination: "menu" as const,
    accountLabel: "+79991234567",
    cartCount: 0,
    categories: [],
    isAuthenticated: false,
    isLogoutPending: false,
    showBack: false,
    ...overrides,
  };
}
