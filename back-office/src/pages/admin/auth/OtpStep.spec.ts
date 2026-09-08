import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import OtpStep from "./OtpStep.vue";
const props = {
  error: "",
  expiresInSeconds: 300,
  otp: "",
  phone: "+7 999 000-10-02",
  valid: false,
};
describe("OtpStep", () => {
  it("при ожидании input и verify доступны, resend disabled без live countdown", () => {
    const wrapper = mount(OtpStep, {
      props: { ...props, resendRemainingSeconds: 12, valid: true },
    });
    const buttons = wrapper.findAll("button");
    expect(wrapper.text()).toContain(
      "Повторная отправка доступна через 12 сек.",
    );
    expect(buttons[0]!.attributes("disabled")).toBeUndefined();
    expect(buttons[1]!.attributes("disabled")).toBeDefined();
    expect(wrapper.get("input").attributes("name")).toBe("otp");
    expect(wrapper.find(".auth-step__hint").attributes("role")).toBeUndefined();
    expect(
      wrapper.find(".auth-step__hint").attributes("aria-live"),
    ).toBeUndefined();
    wrapper.unmount();
  });
  it("эмитит verify, resend и change-phone, disabled resend не эмитит", async () => {
    const waiting = mount(OtpStep, {
      props: { ...props, resendRemainingSeconds: 1 },
    });
    await waiting.findAll("button")[1]!.trigger("click");
    expect(waiting.emitted("resend")).toBeUndefined();
    waiting.unmount();
    const wrapper = mount(OtpStep, {
      props: { ...props, resendRemainingSeconds: 0 },
    });
    const buttons = wrapper.findAll("button");
    await wrapper.get("form").trigger("submit");
    await buttons[1]!.trigger("click");
    await buttons[2]!.trigger("click");
    expect(wrapper.emitted("submit")).toHaveLength(1);
    expect(wrapper.emitted("resend")).toHaveLength(1);
    expect(wrapper.emitted("changePhone")).toHaveLength(1);
    expect(wrapper.text()).toContain("Отправить код повторно");
    expect(wrapper.text()).not.toContain("через 0 секунд");
    wrapper.unmount();
  });
  it("ошибка сохраняет alert и label", () => {
    const wrapper = mount(OtpStep, {
      props: { ...props, error: "Код неверный", resendRemainingSeconds: 0 },
    });
    expect(wrapper.get(".auth-step__error").attributes("role")).toBe("alert");
    expect(wrapper.get("input").attributes("aria-describedby")).toBe(
      "auth-otp-error",
    );
    wrapper.unmount();
  });
});
