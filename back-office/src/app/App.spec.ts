import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { describe, expect, it } from "vitest";

import App from "./App.vue";
import { useAppStore } from "./app.store";
import { vuetify } from "./plugins";
import { router } from "./router";
import ErrorNotice from "../shared/ui/ErrorNotice.vue";

class ResizeObserverMock {
  constructor(private readonly callback: ResizeObserverCallback) {}

  disconnect(): void {}

  observe(): void {
    void this.callback;
  }

  unobserve(): void {}
}

globalThis.ResizeObserver = ResizeObserverMock;

describe("App", () => {
  it("показывает заголовок рабочего приложения", async () => {
    await router.replace("/login");

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), vuetify, router],
      },
    });

    expect(wrapper.get(".app-name").text()).toBe("Expressa back-office");
  });

  it("показывает и закрывает ошибку состояния экрана", async () => {
    await router.replace("/login");
    const pinia = createPinia();
    const wrapper = mount(App, {
      global: {
        plugins: [pinia, vuetify, router],
      },
    });

    const appStore = useAppStore(pinia);
    appStore.showScreenError({
      message: "Изменение не принято.",
      requestId: "request-42",
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("Изменение не принято.");
    wrapper.getComponent(ErrorNotice).vm.$emit("close");

    expect(appStore.screenError).toBeNull();
  });
});
