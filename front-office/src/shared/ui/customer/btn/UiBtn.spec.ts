import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import UiBtn from "./UiBtn.vue";

describe("UiBtn", () => {
  it("применяет единый навигационный стиль и зеркалит forward-направление", () => {
    const back = mount(UiBtn, {
      props: { navigation: true },
      slots: { default: "Назад" },
    });
    const forward = mount(UiBtn, {
      props: { navigation: true, navigationDirection: "forward" },
      slots: { default: "Открыть категорию" },
    });

    expect(back.get("button").classes()).toContain("ui-btn--navigation");
    expect(back.get("button").classes()).not.toContain(
      "ui-btn--navigation-forward",
    );
    expect(forward.get("button").classes()).toContain("ui-btn--navigation");
    expect(forward.get("button").classes()).toContain(
      "ui-btn--navigation-forward",
    );
  });
});
