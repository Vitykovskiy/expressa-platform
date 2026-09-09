import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AuthScreen from "./admin/auth/AuthScreen.vue";
import LoginPage from "./LoginPage.vue";

const phone = "+7 999 000-10-02";
const session = vi.hoisted(() => ({
  error: null as { message: string } | null,
  requestOtp: vi.fn(),
  status: "anonymous",
  verifyOtp: vi.fn(),
}));
vi.mock("../app/session.store", () => ({ useSessionStore: () => session }));
vi.mock("vue-router", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
const metadata = (retryAfterSeconds: number) => ({
  expiresInSeconds: 300,
  retryAfterSeconds,
});
const mountPage = () =>
  mount(LoginPage, { global: { stubs: { LoadingState: true } } });
async function requestOtp(wrapper: ReturnType<typeof mountPage>) {
  const screen = wrapper.getComponent(AuthScreen);
  screen.vm.$emit("update:phone", phone);
  await flushPromises();
  wrapper.getComponent(AuthScreen).vm.$emit("requestOtp");
  await flushPromises();
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T10:00:00.000Z"));
    session.error = null;
    session.requestOtp.mockReset();
  });
  afterEach(() => vi.useRealTimers());
  it("успешный повтор очищает код и создаёт новый deadline", async () => {
    session.requestOtp
      .mockResolvedValueOnce(metadata(1))
      .mockResolvedValueOnce(metadata(30));
    const wrapper = mountPage();
    await requestOtp(wrapper);
    let screen = wrapper.getComponent(AuthScreen);
    screen.vm.$emit("update:otp", "123");
    await vi.advanceTimersByTimeAsync(1000);
    screen.vm.$emit("resendOtp");
    await flushPromises();
    screen = wrapper.getComponent(AuthScreen);
    expect(session.requestOtp).toHaveBeenCalledTimes(2);
    expect(session.requestOtp).toHaveBeenLastCalledWith(phone);
    expect(screen.props("otp")).toBe("");
    expect(screen.props("otpMetadata")).toEqual(metadata(30));
    expect(screen.props("resendRemainingSeconds")).toBe(30);
    wrapper.unmount();
  });
  it("на нулевой границе пропускает один concurrent repeat", async () => {
    let resolve: ((value: ReturnType<typeof metadata>) => void) | undefined;
    session.requestOtp
      .mockResolvedValueOnce(metadata(1))
      .mockImplementationOnce(() => new Promise((done) => (resolve = done)));
    const wrapper = mountPage();
    await requestOtp(wrapper);
    await vi.advanceTimersByTimeAsync(1000);
    const screen = wrapper.getComponent(AuthScreen);
    screen.vm.$emit("resendOtp");
    screen.vm.$emit("resendOtp");
    await flushPromises();
    expect(session.requestOtp).toHaveBeenCalledTimes(2);
    resolve?.(metadata(10));
    await flushPromises();
    wrapper.unmount();
  });
  it("первая ошибка остаётся на phone", async () => {
    session.requestOtp.mockResolvedValueOnce(null);
    const wrapper = mountPage();
    await requestOtp(wrapper);
    expect(wrapper.getComponent(AuthScreen).props("state")).toBe("phone");
    wrapper.unmount();
  });

  it("сохраняет OTP после ошибки проверки кода", async () => {
    session.requestOtp.mockResolvedValueOnce(metadata(30));
    session.verifyOtp.mockResolvedValueOnce(undefined);
    session.error = { message: "Неверный код. Попробуйте ещё раз." };
    const wrapper = mountPage();
    await requestOtp(wrapper);
    let screen = wrapper.getComponent(AuthScreen);
    screen.vm.$emit("update:otp", "123456");
    screen.vm.$emit("verifyOtp");
    await flushPromises();
    screen = wrapper.getComponent(AuthScreen);

    expect(screen.props("state")).toBe("otp");
    expect(screen.props("otp")).toBe("123456");
    wrapper.unmount();
  });
  it("rate-limit и network resend ошибки сохраняют контекст и deadline", async () => {
    for (const message of ["Слишком много запросов", "Нет сети"]) {
      const clear = vi.spyOn(globalThis, "clearInterval");
      session.requestOtp
        .mockReset()
        .mockResolvedValueOnce(metadata(2))
        .mockResolvedValueOnce(null);
      session.error = { message };
      const wrapper = mountPage();
      await requestOtp(wrapper);
      let screen = wrapper.getComponent(AuthScreen);
      screen.vm.$emit("update:otp", "123");
      await vi.advanceTimersByTimeAsync(2_000);
      expect(screen.props("resendRemainingSeconds")).toBe(0);
      clear.mockClear();
      screen.vm.$emit("resendOtp");
      await flushPromises();
      screen = wrapper.getComponent(AuthScreen);
      expect(session.requestOtp).toHaveBeenCalledTimes(2);
      expect(screen.props("otp")).toBe("123");
      expect(screen.props("otpMetadata")).toEqual(metadata(2));
      expect(screen.props("resendRemainingSeconds")).toBe(0);
      await vi.advanceTimersByTimeAsync(1_000);
      expect(screen.props("resendRemainingSeconds")).toBe(0);
      expect(clear).not.toHaveBeenCalled();
      wrapper.unmount();
    }
  });
  it("смена номера чистит OTP контекст", async () => {
    session.requestOtp.mockResolvedValue(metadata(60));
    const wrapper = mountPage();
    await requestOtp(wrapper);
    const screen = wrapper.getComponent(AuthScreen);
    screen.vm.$emit("update:otp", "123");
    screen.vm.$emit("changePhone");
    await flushPromises();
    expect(wrapper.getComponent(AuthScreen).props("otpMetadata")).toBeNull();
    expect(wrapper.getComponent(AuthScreen).props("otp")).toBe("");
    wrapper.unmount();
  });
  it("unmount чистит активный interval", async () => {
    const clear = vi.spyOn(globalThis, "clearInterval");
    session.requestOtp.mockResolvedValue(metadata(60));
    const wrapper = mountPage();
    await requestOtp(wrapper);
    clear.mockClear();
    wrapper.unmount();
    expect(clear).toHaveBeenCalled();
  });
});
