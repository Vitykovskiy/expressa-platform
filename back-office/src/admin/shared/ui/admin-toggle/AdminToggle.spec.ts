import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import { vuetify } from "../../../../plugins/vuetify";
import AdminToggle from "./AdminToggle.vue";

describe("AdminToggle", () => {
  it("рендерит видимый нативный переключатель и обновляет значение", async () => {
    const wrapper = mount(AdminToggle, {
      props: {
        modelValue: false,
      },
      attrs: { "aria-label": "Выбор обязателен" },
      global: { plugins: [vuetify] },
    });
    const input = wrapper.get('[role="switch"]');

    expect(wrapper.find("v-switch").exists()).toBe(false);
    await input.trigger("click");

    expect(wrapper.emitted("update:modelValue")).toEqual([[true]]);
  });
});
