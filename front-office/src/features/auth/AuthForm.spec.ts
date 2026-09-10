import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import AuthForm from "./AuthForm.vue";

const otpState = {
  errorMessage: "",
  name: "",
  phone: "+7 (999) 123-45-67",
  step: "otp" as const,
  verified: false,
};

describe("AuthForm", () => {
  it("передаёт только цифры из кода", async () => {
    const wrapper = mountForm();

    await wrapper.get('[aria-label="Код из сообщения"]').setValue("12a-3б4");

    expect(wrapper.emitted("updateOtp")).toEqual([["1234"]]);
  });

  it("во время ожидания честно показывает cooldown, но оставляет проверку и смену номера", async () => {
    const wrapper = mountForm({ otp: "123456", resendRemainingSeconds: 12 });
    const buttons = wrapper.findAll("button");

    expect(buttons[0].attributes("disabled")).toBeUndefined();
    expect(buttons[1].attributes("disabled")).toBeUndefined();
    expect(wrapper.text()).toContain(
      "Повторная отправка доступна через 12 сек.",
    );
    expect(wrapper.get("[aria-live]").text()).toBe(
      "Повторная отправка доступна через 12 сек.",
    );
    expect(buttons.map((button) => button.text())).not.toContain(
      "Отправить код ещё раз",
    );

    await buttons[1].trigger("click");

    expect(wrapper.emitted("backToPhone")).toHaveLength(1);
  });

  it("сохраняет форму и показывает compact busy feedback", () => {
    const wrapper = mountForm({ isLoading: true });

    expect(wrapper.get("button").attributes("aria-busy")).toBe("true");
    expect(wrapper.get('[aria-label="Код из сообщения"]')).toBeTruthy();
  });

  it("локально выделяет ошибку на auth-фоне", () => {
    const wrapper = mountForm({
      state: { ...otpState, errorMessage: "Не удалось отправить код." },
    });

    expect(wrapper.get(".auth-form__error-message").text()).toBe(
      "Не удалось отправить код.",
    );
  });
});

function mountForm(
  props: Partial<InstanceType<typeof AuthForm>["$props"]> = {},
) {
  return mount(AuthForm, {
    props: {
      isLoading: false,
      otp: "",
      resendRemainingSeconds: 0,
      state: otpState,
      ...props,
    },
    global: { stubs: formStubs },
  });
}

const formStubs = {
  "ui-btn": {
    props: ["loading"],
    template:
      "<button v-bind='$attrs' :aria-busy='loading || undefined'><slot /></button>",
  },
  "ui-text-field": {
    props: ["modelValue"],
    template:
      "<input v-bind='$attrs' :value='modelValue' @input='$emit(\"update:modelValue\", $event.target.value)' />",
  },
  UiFieldMessage: {
    props: ["message"],
    template: "<p v-bind='$attrs'>{{ message }}</p>",
  },
};
