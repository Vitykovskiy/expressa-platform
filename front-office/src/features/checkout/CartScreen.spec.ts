import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import CartItem from "./CartItem.vue";
import CartScreen from "./CartScreen.vue";
import type { CartScreenProps } from "./CartScreen.types";

describe("CartScreen", () => {
  it("показывает empty state без checkout controls", () => {
    const wrapper = mountCartScreen({ items: [] });

    expect(wrapper.get('[role="status"]').text()).toContain(
      "Пока ничего не добавлено",
    );
    expect(wrapper.findAll(".cart-screen__checkout")).toHaveLength(0);
  });

  it("показывает оплату на кассе в заполненной корзине", () => {
    const wrapper = mountCartScreen();

    expect(wrapper.text()).toContain("Оплата на кассе при получении");
    expect(wrapper.text()).not.toContain("Онлайн-оплата");
  });

  it("показывает локализованную сумму корзины", () => {
    const wrapper = mountCartScreen({
      items: [
        { ...cartItem, id: "first", lineTotalRub: 1.99 },
        { ...cartItem, id: "second", lineTotalRub: 1.99 },
      ],
    });

    expect(wrapper.get('[aria-label="Итого заказа"]').text()).toContain(
      "3,98 ₽",
    );
    expect(wrapper.text()).not.toContain("3.98 ₽");
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

  it("показывает retry error с alert semantics и сохраняет checkout emit", async () => {
    const wrapper = mountCartScreen({
      checkoutState: "error",
      errorMessage: "Не удалось отправить заказ. Повторите попытку.",
    });

    expect(wrapper.get('[role="alert"]').text()).toContain(
      "Не удалось отправить заказ. Повторите попытку.",
    );
    await wrapper.findAll(".cart-screen__checkout")[0]!.trigger("click");
    expect(wrapper.emitted("checkout")).toHaveLength(1);
  });

  it("передаёт unavailable state, блокирует checkout и оставляет remove", async () => {
    const wrapper = mountCartScreen({ unavailableItemIds: [cartItem.id] });
    const item = wrapper.get('[data-test="cart-item"]');

    expect(item.attributes("data-unavailable")).toBe("true");
    expect(item.attributes("data-disabled")).toBe("false");
    expect(wrapper.get('[role="alert"]').text()).toContain("Проверьте корзину");
    expect(
      wrapper
        .findAll(".cart-screen__checkout")
        .every((button) => button.attributes("disabled") !== undefined),
    ).toBe(true);
    await wrapper.get('[data-test="remove"]').trigger("click");
    expect(wrapper.emitted("removeItem")).toEqual([[cartItem.id]]);
  });

  it("показывает reconfirmation totals и вызывает только reconfirm", async () => {
    const wrapper = mountCartScreen({
      checkoutState: "reconfirmation-required",
      reconfirmedTotalRub: 5,
    });

    expect(wrapper.get('[role="status"]').text()).toContain("Итог изменился");
    expect(
      wrapper.get('[aria-label="Изменение итога заказа"]').text(),
    ).toContain("Новый итог");
    await wrapper.findAll(".cart-screen__checkout")[0]!.trigger("click");
    expect(wrapper.emitted("reconfirm")).toHaveLength(1);
    expect(wrapper.emitted("checkout")).toBeUndefined();
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

  it("disables checkout and item controls while submitting", () => {
    const wrapper = mountCartScreen({ checkoutState: "submitting" });

    expect(
      wrapper
        .findAll(".cart-screen__checkout")
        .every((button) => button.attributes("disabled") !== undefined),
    ).toBe(true);
    expect(
      wrapper.get('[data-test="cart-item"]').attributes("data-disabled"),
    ).toBe("true");
  });
});

describe("CartItem", () => {
  it("связывает недоступную позицию с сообщением о недоступности", () => {
    const wrapper = mount(CartItem, {
      props: { item: cartItem, unavailable: true },
      global: { stubs: { UiIconBtn: true } },
    });
    const item = wrapper.get("li");
    const unavailableMessage = wrapper.get('[role="status"]');

    expect(item.attributes("aria-describedby")).toBe(
      unavailableMessage.attributes("id"),
    );
    expect(unavailableMessage.text()).toContain("Сейчас недоступно");
  });

  it("не добавляет сообщение о недоступности доступной позиции", () => {
    const wrapper = mount(CartItem, {
      props: { item: cartItem },
      global: { stubs: { UiIconBtn: true } },
    });

    expect(wrapper.get("li").attributes("aria-describedby")).toBeUndefined();
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
  });

  it("показывает локализованную цену позиции", () => {
    const wrapper = mount(CartItem, {
      props: { item: { ...cartItem, lineTotalRub: 1.99 } },
      global: { stubs: { UiIconBtn: true } },
    });

    expect(wrapper.get('[data-testid="cart-item-line-total"]').text()).toBe(
      "1,99 ₽",
    );
  });
});

function mountCartScreen(props: Partial<CartScreenProps> = {}) {
  return mount(CartScreen, {
    props: {
      items: [cartItem],
      ...props,
    } as never,
    global: {
      stubs: {
        CartItem: {
          props: ["disabled", "item", "priceOutdated", "unavailable"],
          emits: ["removeItem", "updateQuantity"],
          template: `
              <div
                data-test="cart-item"
                :data-disabled="String(Boolean(disabled))"
                :data-unavailable="String(Boolean(unavailable))"
              >
                <button data-test="remove" :disabled="disabled" @click="$emit('removeItem', item.id)" />
                <button data-test="quantity" :disabled="disabled" @click="$emit('updateQuantity', item.id, 2)" />
              </div>
            `,
        },
        UiBtn: {
          props: ["disabled", "loading"],
          emits: ["click"],
          template:
            '<button :disabled="disabled || loading" @click="$emit(\'click\')"><slot /></button>',
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
