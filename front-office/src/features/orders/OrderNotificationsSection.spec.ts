import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import OrderNotificationsSection from "./OrderNotificationsSection.vue";

describe("OrderNotificationsSection", () => {
  beforeEach(() => setActivePinia(createPinia()));
  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(navigator, "serviceWorker");
    Reflect.deleteProperty(window, "PushManager");
    Reflect.deleteProperty(window, "Notification");
  });

  it("объясняет отсутствие поддержки без кнопки включения", async () => {
    const wrapper = mount(OrderNotificationsSection, {
      global: { stubs: { UiBtn: { template: "<button><slot /></button>" } } },
    });
    await flushPromises();

    expect(wrapper.text()).toContain(
      "Уведомления не поддерживаются этим браузером.",
    );
    expect(wrapper.text()).not.toContain("Включить уведомления");
    expect(wrapper.get("#notifications").attributes("tabindex")).toBe("-1");
  });

  it("не оставляет проверку бесконечной, если readiness service worker не отвечает", async () => {
    vi.useFakeTimers();
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: { permission: "default" },
    });
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: class PushManager {},
    });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { ready: new Promise(() => undefined) },
    });
    const wrapper = mount(OrderNotificationsSection, {
      global: { stubs: { UiBtn: { template: "<button><slot /></button>" } } },
    });

    expect(wrapper.get('[role="status"]').text()).toBe(
      "Проверяем уведомления…",
    );
    await vi.advanceTimersByTimeAsync(5_000);
    await flushPromises();

    expect(wrapper.text()).toContain(
      "Не удалось проверить уведомления. Попробуйте ещё раз.",
    );
    expect(wrapper.text()).toContain("Повторить проверку");
  });
});
