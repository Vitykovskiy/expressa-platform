import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import ShellNavigation from "./ShellNavigation.vue";

describe("ShellNavigation", () => {
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
});

function createProps(overrides: Partial<{ isAuthenticated: boolean }> = {}) {
  return {
    activeDestination: "menu" as const,
    accountLabel: "+79991234567",
    cartCount: 0,
    categories: [],
    isAuthenticated: false,
    showBack: false,
    ...overrides,
  };
}
