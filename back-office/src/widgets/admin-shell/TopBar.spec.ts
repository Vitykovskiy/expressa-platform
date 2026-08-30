import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import TopBar from "./TopBar.vue";

describe("TopBar", () => {
  it("показывает заголовок мобильного экрана семантическим h1", () => {
    const wrapper = mount(TopBar, {
      props: { title: "Заказы" },
    });

    expect(wrapper.get("h1.top-bar-title").text()).toBe("Заказы");
  });
});
