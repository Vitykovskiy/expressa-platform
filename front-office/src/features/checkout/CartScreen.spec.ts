import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import CartScreen from "./CartScreen.vue";

describe("CartScreen", () => {
  it("показывает оплату на кассе в заполненной корзине", () => {
    const wrapper = mountCartScreen();

    expect(wrapper.text()).toContain("Оплата на кассе при получении");
    expect(wrapper.text()).not.toContain("Онлайн-оплата");
  });

  it("разрешает оформление, когда признак приёма не передан", async () => {
    const wrapper = mountCartScreen();
    const checkoutButtons = wrapper.findAll(".cart-screen__checkout");

    expect(checkoutButtons).toHaveLength(2);
    expect(
      checkoutButtons.every(
        (button) => button.attributes("disabled") === undefined,
      ),
    ).toBe(true);
    await checkoutButtons[0]!.trigger("click");
    expect(wrapper.emitted("checkout")).toHaveLength(1);
  });

  it("блокирует оформление при закрытом приёме, сохраняя управление корзиной", async () => {
    const wrapper = mountCartScreen({
      acceptsNewOrders: false,
      checkoutState: "idle",
      errorMessage: "Приём новых заказов сейчас закрыт.",
    });

    const checkoutButtons = wrapper.findAll(".cart-screen__checkout");
    expect(checkoutButtons).toHaveLength(2);
    expect(
      checkoutButtons.every(
        (button) => button.attributes("disabled") !== undefined,
      ),
    ).toBe(true);
    await checkoutButtons[0]!.trigger("click");
    expect(wrapper.emitted("checkout")).toBeUndefined();
    expect(wrapper.emitted("reconfirm")).toBeUndefined();

    expect(
      wrapper.get('[data-test="remove"]').attributes("disabled"),
    ).toBeUndefined();
    expect(
      wrapper.get('[data-test="quantity"]').attributes("disabled"),
    ).toBeUndefined();
    await wrapper.get('[data-test="remove"]').trigger("click");
    await wrapper.get('[data-test="quantity"]').trigger("click");
    expect(wrapper.emitted("removeItem")).toEqual([["item"]]);
    expect(wrapper.emitted("updateQuantity")).toEqual([["item", 2]]);
    expect(wrapper.text()).toContain("Приём новых заказов сейчас закрыт.");

    await wrapper.setProps({ checkoutState: "submitting" });
    expect(
      wrapper.get('[data-test="remove"]').attributes("disabled"),
    ).toBeDefined();
    expect(
      wrapper.get('[data-test="quantity"]').attributes("disabled"),
    ).toBeDefined();
    expect(
      wrapper
        .findAll(".cart-screen__checkout")
        .every((button) => button.attributes("disabled") !== undefined),
    ).toBe(true);
  });
});

function mountCartScreen(
  props: {
    acceptsNewOrders?: boolean;
    checkoutState?: "idle" | "submitting" | "error";
    errorMessage?: string | null;
  } = {},
) {
  return mount(CartScreen, {
    props: {
      items: [cartItem],
      ...props,
    },
    global: {
      stubs: {
        CartItem: {
          props: ["disabled", "item"],
          emits: ["removeItem", "updateQuantity"],
          template: `
              <div>
                <button data-test="remove" :disabled="disabled" @click="$emit('removeItem', item.id)" />
                <button data-test="quantity" :disabled="disabled" @click="$emit('updateQuantity', item.id, 2)" />
              </div>
            `,
        },
        UiBtn: {
          props: ["disabled"],
          emits: ["click"],
          template:
            '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
        },
      },
    },
  });
}

const cartItem = {
  addons: [],
  id: "item",
  lineTotalRub: 4,
  productId: "product",
  productName: "Капучино",
  quantity: 1,
  type: "drink" as const,
};
