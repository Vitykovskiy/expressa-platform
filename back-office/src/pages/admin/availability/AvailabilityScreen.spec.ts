import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import AvailabilityScreen from "./AvailabilityScreen.vue";

const error = { message: "Не удалось сохранить доступность.", requestId: null };

describe("AvailabilityScreen", () => {
  it("показывает ошибку вместе с восстановленными данными после сбоя сохранения", () => {
    const wrapper = mount(AvailabilityScreen, {
      props: {
        error,
        groups: [
          {
            id: "coffee",
            items: [
              {
                id: "latte",
                isAvailable: true,
                label: "Латте",
                sublabel: "250 ₽",
                type: "product",
              },
            ],
            name: "Кофе",
            sortOrder: 0,
          },
        ],
        intake: {
          acceptsNewOrders: true,
          updatedAt: null,
          updatedBy: null,
        },
        loading: false,
        saving: false,
      },
    });

    expect(wrapper.get('[role="alert"]').text()).toContain(error.message);
    expect(wrapper.get(".availability-screen__intake").text()).toContain(
      "Приём заказов",
    );
    expect(
      wrapper
        .get('.availability-screen__intake [role="switch"]')
        .attributes("aria-checked"),
    ).toBe("true");
    expect(wrapper.get(".availability-group").text()).toContain("Кофе");
    expect(wrapper.get(".availability-group").text()).toContain("Латте");

    wrapper.unmount();
  });

  it("оставляет ошибку начальной загрузки отдельным состоянием", async () => {
    const wrapper = mount(AvailabilityScreen, {
      props: {
        error,
        groups: [],
        intake: null,
        loading: false,
        saving: false,
      },
    });

    expect(wrapper.get('[role="alert"]').text()).toContain(error.message);
    expect(wrapper.get(".availability-screen__error button").text()).toBe(
      "Повторить",
    );
    expect(wrapper.find(".availability-screen__ready").exists()).toBe(false);
    expect(wrapper.find(".availability-group").exists()).toBe(false);

    await wrapper.get(".availability-screen__error button").trigger("click");

    expect(wrapper.emitted("retry")).toHaveLength(1);
    wrapper.unmount();
  });
});
