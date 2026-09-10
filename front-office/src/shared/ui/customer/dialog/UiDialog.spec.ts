import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { defineComponent } from "vue";

import UiDialog from "./UiDialog.vue";

describe("UiDialog", () => {
  it("передаёт trigger встроенному механизму возврата фокуса", () => {
    const trigger = document.createElement("button");
    const DialogStub = defineComponent({
      props: { activator: { required: false, type: Object } },
      template: '<div data-testid="dialog"><slot /></div>',
    });

    const wrapper = mount(UiDialog, {
      props: { returnFocusTo: trigger },
      global: {
        stubs: { VDialog: DialogStub },
      },
    });

    expect(wrapper.getComponent(DialogStub).props("activator")).toBe(trigger);
    wrapper.unmount();
  });

  it("передаёт контекстное доступное имя", () => {
    const wrapper = mount(UiDialog, {
      props: { label: "Подтверждение замены корзины" },
      global: {
        stubs: {
          VDialog: {
            template:
              '<div v-bind="$attrs" data-testid="dialog"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.get('[data-testid="dialog"]').attributes("aria-label")).toBe(
      "Подтверждение замены корзины",
    );
  });
});
