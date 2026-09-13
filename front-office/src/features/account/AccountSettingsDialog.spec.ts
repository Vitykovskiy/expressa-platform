import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick, ref } from "vue";

import { useOrderNotificationsStore } from "@/entities/customer/model/order-notifications.store";
import OrderNotificationsSection from "@/features/orders/OrderNotificationsSection.vue";
import { vuetify } from "@/app/plugins";
import AccountSettingsDialog from "./AccountSettingsDialog.vue";

describe("AccountSettingsDialog", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it.each([
    ["denied", "Проверить снова"],
    ["failed_check", "Повторить проверку"],
    ["off_current", "Включить уведомления"],
    ["on_current", "Отключить на этом устройстве"],
    ["other_account", "Подключить к этому аккаунту"],
    ["checking", "Проверяем уведомления"],
    ["unsupported", "Уведомления недоступны"],
    ["anonymous_subscription", "Отключить на этом устройстве"],
    ["anonymous_off", "Уведомления на этом устройстве отключены"],
    ["failed_enable", "Не удалось включить уведомления"],
    ["failed_disable", "Не удалось отключить уведомления"],
  ] as const)("shows the D03 %s action", (state, action) => {
    useOrderNotificationsStore().state = state;
    const wrapper = mount(AccountSettingsDialog, {
      props: {
        accountId: state === "anonymous_subscription" ? null : "account-a",
        accountLabel: "+79990000000",
        authenticated: state !== "anonymous_subscription",
        logoutError: null,
        logoutPending: false,
        modelValue: false,
        returnFocusTo: null,
      },
      global: {
        stubs: {
          UiBtn: { template: "<button><slot /></button>" },
          UiDialog: { template: "<div><slot /></div>" },
          UiFieldMessage: {
            props: ["message"],
            template: "<p>{{ message }}</p>",
          },
          UiIconBtn: { template: "<button><slot /></button>" },
        },
      },
    });
    expect(wrapper.text()).toContain(action);
    if (state === "other_account")
      expect(wrapper.text()).toContain("прежнего аккаунта");
  });

  it.each([
    ["failed_check", "Не удалось проверить уведомления. Попробуйте ещё раз."],
    ["failed_enable", "Не удалось включить уведомления. Попробуйте ещё раз."],
    [
      "failed_disable",
      "Не удалось отключить уведомления на этом устройстве. Попробуйте ещё раз.",
    ],
  ] as const)(
    "A03 renders one operation error announcement for %s",
    (state, message) => {
      const store = useOrderNotificationsStore();
      store.state = state;
      const wrapper = mount(AccountSettingsDialog, {
        props: {
          accountId: "account-a",
          accountLabel: "+79990000000",
          authenticated: true,
          logoutError: null,
          logoutPending: false,
          modelValue: true,
          returnFocusTo: null,
        },
        global: {
          stubs: {
            UiBtn: { template: "<button><slot /></button>" },
            UiDialog: { template: "<div><slot /></div>" },
            UiFieldMessage: {
              props: ["message", "tone"],
              template:
                "<p v-if=\"message\" :role=\"tone === 'error' ? 'alert' : 'status'\" aria-live=\"assertive\">{{ message }}</p>",
            },
            UiIconBtn: { template: "<button><slot /></button>" },
          },
        },
      });
      const alerts = wrapper.findAll('[role="alert"]');
      expect(alerts).toHaveLength(1);
      expect(alerts[0]?.text()).toBe(message);
      expect(alerts[0]?.attributes("aria-live")).toBe("assertive");
    },
  );

  it("I08 keeps the real Account notification control available when invitation storage write fails", () => {
    const notifications = useOrderNotificationsStore();
    notifications.state = "off_current";
    const write = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    const wrapper = mountRealDialog({ accountId: "account-a" });
    const control = byText(wrapper, "Включить уведомления");
    expect(control.attributes("disabled")).toBeUndefined();
    expect(wrapper.text()).not.toContain("blocked");
    wrapper.unmount();
    write.mockRestore();
  });

  it.each([
    [
      "off_current",
      "Включить уведомления",
      "enable",
      "failed_enable",
      "Включить уведомления",
    ],
    [
      "on_current",
      "Отключить на этом устройстве",
      "disable",
      "failed_disable",
      "Отключить на этом устройстве",
    ],
  ] as const)(
    "CNJ-A1-T04 renders failed deferred %s result with its retry action",
    async (state, label, command, failed, retry) => {
      const store = useOrderNotificationsStore();
      store.state = state;
      const gate = deferred<void>();
      vi.spyOn(store, command).mockImplementation(async () => {
        store.operation = command === "enable" ? "enable" : "disable";
        await gate.promise;
        store.operation = null;
        store.state = failed;
      });
      const wrapper = mountRealDialog();
      await byText(wrapper, label).trigger("click");
      gate.resolve();
      await flushPromises();
      expect(store.state).toBe(failed);
      expect(byText(wrapper, retry).exists()).toBe(true);
      expect(wrapper.findAll('[role="alert"]')).toHaveLength(1);
      await byText(wrapper, retry).trigger("click");
      expect(vi.mocked(store[command])).toHaveBeenCalledTimes(2);
      wrapper.unmount();
    },
  );

  it.each([
    "checking",
    "unsupported",
    "anonymous_off",
    "denied",
    "off_current",
    "on_current",
    "other_account",
    "anonymous_subscription",
  ] as const)("A03 has no notification error announcement for %s", (state) => {
    const store = useOrderNotificationsStore();
    store.state = state;
    const wrapper = mountRealDialog({
      accountId: state.startsWith("anonymous") ? null : "account-a",
      authenticated: !state.startsWith("anonymous"),
    });
    expect(
      wrapper
        .findAll('[role="alert"]')
        .filter((alert) => alert.text().includes("уведомлен")),
    ).toHaveLength(0);
    wrapper.unmount();
  });

  it("A03 retains the device disclosure after failed enable without exposing another account", () => {
    const store = useOrderNotificationsStore();
    store.state = "failed_enable";
    store.subscription = {
      endpoint: "https://push.example/subscription",
      keys: { auth: "auth", p256dh: "p256dh" },
    };
    const wrapper = mountRealDialog({ accountLabel: "+79990000000" });
    expect(wrapper.findAll(".account-settings__disclosure")).toHaveLength(1);
    expect(wrapper.get(".account-settings__disclosure").text()).toBe(
      "Уведомления будут приходить на это устройство и после выхода из аккаунта. На общем устройстве их смогут увидеть другие люди.",
    );
    expect(wrapper.text()).not.toContain("+79990000001");
    wrapper.unmount();
  });

  it("A03 describes transfer consequences without exposing the former account identity", () => {
    const store = useOrderNotificationsStore();
    store.state = "other_account";
    const wrapper = mountRealDialog({ accountLabel: "+79990000000" });
    expect(wrapper.findAll(".account-settings__disclosure")).toHaveLength(1);
    expect(wrapper.get(".account-settings__disclosure").text()).toBe(
      "Подключение отключит уведомления прежнего аккаунта на этом устройстве и подключит их к текущему аккаунту.",
    );
    expect(wrapper.text()).not.toContain("+79990000001");
    wrapper.unmount();
  });

  it("CNJ-A1-T07 stays closed when deferred notification work settles and does not retain prior identity", async () => {
    const store = useOrderNotificationsStore();
    store.state = "off_current";
    const gate = deferred<void>();
    vi.spyOn(store, "enable").mockImplementation(async () => {
      store.operation = "enable";
      await gate.promise;
      store.operation = null;
      store.state = "on_current";
    });
    const open = ref(true);
    const wrapper = mount(AccountSettingsDialog, {
      props: {
        accountId: "account-a",
        accountLabel: "+79990000000",
        authenticated: true,
        logoutError: null,
        logoutPending: false,
        modelValue: true,
        returnFocusTo: null,
        "onUpdate:modelValue": (value: boolean) => (open.value = value),
      },
      global: {
        stubs: {
          VDialog: {
            props: ["modelValue"],
            template: '<div v-if="modelValue"><slot /></div>',
          },
        },
      },
    });
    await byText(wrapper, "Включить уведомления").trigger("click");
    await wrapper
      .get('[aria-label="Закрыть настройки аккаунта"]')
      .trigger("click");
    await wrapper.setProps({
      modelValue: open.value,
      accountId: "account-b",
      accountLabel: "+79990000001",
    });
    gate.resolve();
    await flushPromises();
    expect(open.value).toBe(false);
    expect(wrapper.find(".account-settings").exists()).toBe(false);
    await wrapper.setProps({ modelValue: true });
    expect(wrapper.text()).toContain("+79990000001");
    expect(wrapper.text()).not.toContain("+79990000000");
    wrapper.unmount();
  });

  it.each([
    ["failed_check", "Не удалось проверить уведомления. Попробуйте ещё раз."],
    ["failed_enable", "Не удалось включить уведомления. Попробуйте ещё раз."],
    [
      "failed_disable",
      "Не удалось отключить уведомления на этом устройстве. Попробуйте ещё раз.",
    ],
  ] as const)(
    "CNJ-A1-T03 exposes one actual UiFieldMessage alert for %s",
    (state, text) => {
      const store = useOrderNotificationsStore();
      store.state = state;
      const wrapper = mount(AccountSettingsDialog, {
        props: {
          accountId: "account-a",
          accountLabel: "+79990000000",
          authenticated: true,
          logoutError: null,
          logoutPending: false,
          modelValue: true,
          returnFocusTo: null,
        },
        global: {
          plugins: [vuetify],
          stubs: { VDialog: { template: "<div><slot /></div>" } },
        },
      });
      const alerts = wrapper.findAll('[role="alert"]');
      expect(alerts).toHaveLength(1);
      expect(alerts[0]?.text()).toContain(text);
      expect(alerts[0]?.attributes("aria-live")).toBe("assertive");
      wrapper.unmount();
    },
  );

  it("A04 disables logout while notification work is pending but keeps close available", () => {
    const store = useOrderNotificationsStore();
    store.state = "on_current";
    store.operation = "disable";
    const wrapper = mount(AccountSettingsDialog, {
      props: {
        accountId: "account-a",
        accountLabel: "+79990000000",
        authenticated: true,
        logoutError: null,
        logoutPending: false,
        modelValue: true,
        returnFocusTo: null,
      },
      global: {
        stubs: {
          UiBtn: {
            props: ["disabled"],
            template: '<button :disabled="disabled"><slot /></button>',
          },
          UiDialog: { template: "<div><slot /></div>" },
          UiFieldMessage: {
            props: ["message"],
            template: '<p v-if="message">{{ message }}</p>',
          },
          UiIconBtn: { template: "<button><slot /></button>" },
        },
      },
    });
    expect(
      wrapper
        .findAll("button")
        .find((button) => button.text() === "Отключить на этом устройстве")
        ?.attributes("disabled"),
    ).toBeDefined();
    expect(
      wrapper
        .findAll("button")
        .find((button) => button.text() === "Выйти из аккаунта")
        ?.attributes("disabled"),
    ).toBeDefined();
    expect(
      wrapper
        .findAll("button")
        .find((button) => button.text() === "")
        ?.attributes("disabled"),
    ).toBeUndefined();
  });

  it.each([
    ["checking", []],
    ["unsupported", []],
    ["anonymous_off", []],
    ["denied", ["Проверить снова"]],
    ["failed_check", ["Повторить проверку"]],
    ["off_current", ["Включить уведомления"]],
    ["failed_enable", ["Включить уведомления"]],
    ["on_current", ["Отключить на этом устройстве"]],
    ["failed_disable", ["Отключить на этом устройстве"]],
    ["anonymous_subscription", ["Отключить на этом устройстве"]],
    [
      "other_account",
      ["Подключить к этому аккаунту", "Отключить на этом устройстве"],
    ],
  ] as const)(
    "A01 exposes only the %s notification action set",
    (state, actions) => {
      const store = useOrderNotificationsStore();
      store.state = state;
      const wrapper = mountRealDialog({
        accountId: state.startsWith("anonymous") ? null : "account-a",
        authenticated: !state.startsWith("anonymous"),
      });
      const controls = wrapper
        .find(".account-settings__notifications")
        .findAll("button");
      expect(controls.map((button) => button.text())).toEqual(actions);
      for (const control of controls)
        expect(control.attributes("disabled")).toBeUndefined();
      wrapper.unmount();
    },
  );

  it("keeps logout retry visible after a user-language failure", () => {
    const wrapper = mount(AccountSettingsDialog, {
      props: {
        accountId: "account-a",
        accountLabel: "+79990000000",
        authenticated: true,
        logoutError: "Не удалось выйти из аккаунта. Попробуйте ещё раз.",
        logoutPending: false,
        modelValue: false,
        returnFocusTo: null,
      },
      global: {
        stubs: {
          UiBtn: { template: "<button><slot /></button>" },
          UiDialog: { template: "<div><slot /></div>" },
          UiFieldMessage: {
            props: ["message"],
            template: "<p>{{ message }}</p>",
          },
          UiIconBtn: { template: "<button><slot /></button>" },
        },
      },
    });
    expect(wrapper.text()).toContain("Не удалось выйти из аккаунта");
    expect(wrapper.text()).toContain("Выйти из аккаунта");
  });

  it.each([
    ["denied", "Проверить снова", "inspect"],
    ["failed_check", "Повторить проверку", "inspect"],
    ["off_current", "Включить уведомления", "enable"],
    ["failed_enable", "Включить уведомления", "enable"],
    ["on_current", "Отключить на этом устройстве", "disable"],
    ["failed_disable", "Отключить на этом устройстве", "disable"],
    ["anonymous_subscription", "Отключить на этом устройстве", "disable"],
    ["other_account", "Подключить к этому аккаунту", "transfer"],
    ["other_account", "Отключить на этом устройстве", "disable"],
  ] as const)(
    "invokes only the applicable %s command",
    async (state, label, command) => {
      const notifications = useOrderNotificationsStore();
      notifications.state = state;
      const inspect = vi.spyOn(notifications, "inspect").mockResolvedValue();
      const enable = vi.spyOn(notifications, "enable").mockResolvedValue();
      const disable = vi.spyOn(notifications, "disable").mockResolvedValue();
      const wrapper = mount(AccountSettingsDialog, {
        props: {
          accountId: "account-a",
          accountLabel: "+79990000000",
          authenticated: true,
          logoutError: null,
          logoutPending: false,
          modelValue: false,
          returnFocusTo: null,
        },
        global: {
          stubs: {
            UiBtn: {
              emits: ["click"],
              template:
                "<button v-bind='$attrs' @click='$emit(\"click\")'><slot /></button>",
            },
            UiDialog: { template: "<div><slot /></div>" },
            UiFieldMessage: {
              props: ["message"],
              template: "<p>{{ message }}</p>",
            },
            UiIconBtn: { template: "<button><slot /></button>" },
          },
        },
      });
      await wrapper
        .findAll("button")
        .find((button) => button.text() === label)
        ?.trigger("click");
      expect(inspect).toHaveBeenCalledTimes(command === "inspect" ? 1 : 0);
      if (command === "transfer") expect(enable).toHaveBeenCalledWith(true);
      else if (command === "enable") expect(enable).toHaveBeenCalledWith();
      else expect(enable).not.toHaveBeenCalled();
      expect(disable).toHaveBeenCalledTimes(command === "disable" ? 1 : 0);
    },
  );

  it.each([
    ["checking", null],
    ["unsupported", null],
    ["anonymous_off", null],
    ["denied", "Проверить снова"],
    ["failed_check", "Повторить проверку"],
    ["off_current", "Включить уведомления"],
    ["failed_enable", "Включить уведомления"],
    ["on_current", "Отключить на этом устройстве"],
    ["failed_disable", "Отключить на этом устройстве"],
    ["anonymous_subscription", "Отключить на этом устройстве"],
    ["other_account", "Подключить к этому аккаунту"],
  ] as const)(
    "A05 disables every visible notification action while logout is pending: %s",
    (state, expectedAction) => {
      const notifications = useOrderNotificationsStore();
      notifications.state = state;
      const wrapper = mountRealDialog({
        accountId: state.startsWith("anonymous") ? null : "account-a",
        authenticated: !state.startsWith("anonymous"),
        logoutPending: true,
      });

      const notificationButtons = wrapper
        .get(".account-settings__notifications")
        .findAll("button");
      expect(notificationButtons.map((button) => button.text())).toEqual(
        expectedAction === null
          ? []
          : state === "other_account"
            ? ["Подключить к этому аккаунту", "Отключить на этом устройстве"]
            : [expectedAction],
      );
      for (const button of notificationButtons)
        expect(button.attributes("disabled")).toBeDefined();
      const logout = wrapper
        .findAll("button")
        .find((button) => button.text() === "Выйти из аккаунта");
      if (state.startsWith("anonymous")) expect(logout).toBeUndefined();
      else expect(logout?.attributes("disabled")).toBeDefined();
    },
  );

  it.each([
    [null, ""],
    ["Не удалось выйти из аккаунта. Попробуйте ещё раз.", "Не удалось выйти"],
  ])("A05 has one human logout announcement for %s", (logoutError, text) => {
    const wrapper = mountRealDialog({ logoutError });
    const alerts = wrapper.findAll('[role="alert"]');
    expect(alerts).toHaveLength(logoutError === null ? 0 : 1);
    if (logoutError !== null) {
      expect(alerts[0]?.text()).toContain(text);
      expect(wrapper.text()).not.toContain("Error:");
    }
    expect(
      wrapper
        .findAll("button")
        .filter((button) => button.text() === "Выйти из аккаунта"),
    ).toHaveLength(1);
  });

  it.each([
    ["denied", ["Проверить снова"]],
    ["failed_check", ["Повторить проверку"]],
    ["off_current", ["Включить уведомления"]],
    ["failed_enable", ["Включить уведомления"]],
    ["on_current", ["Отключить на этом устройстве"]],
    ["failed_disable", ["Отключить на этом устройстве"]],
    ["anonymous_subscription", ["Отключить на этом устройстве"]],
    [
      "other_account",
      ["Подключить к этому аккаунту", "Отключить на этом устройстве"],
    ],
  ] as const)(
    "A05 makes logout-pending notification controls inert: %s",
    async (state, labels) => {
      const notifications = useOrderNotificationsStore();
      notifications.state = state;
      const wrapper = mountRealDialog({ logoutPending: true });
      const inspectBefore = vi.mocked(notifications.inspect).mock.calls.length;
      const enable = vi.spyOn(notifications, "enable");
      const disable = vi.spyOn(notifications, "disable");

      for (const label of labels) {
        const control = byText(wrapper, label);
        expect(control.attributes("disabled")).toBeDefined();
        await control.trigger("click");
      }

      expect(vi.mocked(notifications.inspect)).toHaveBeenCalledTimes(
        inspectBefore,
      );
      expect(enable).not.toHaveBeenCalled();
      expect(disable).not.toHaveBeenCalled();
      wrapper.unmount();
    },
  );

  it.each([
    ["inspect", "denied", "Проверить снова", undefined],
    ["enable", "off_current", "Включить уведомления", undefined],
    ["transfer", "other_account", "Подключить к этому аккаунту", true],
    ["disable", "on_current", "Отключить на этом устройстве", undefined],
  ] as const)(
    "A04 keeps close enabled and suppresses duplicate %s command while pending",
    async (operation, state, label, argument) => {
      const notifications = useOrderNotificationsStore();
      notifications.state = state;
      notifications.operation = operation;
      const command = vi
        .spyOn(
          notifications,
          operation === "inspect"
            ? "inspect"
            : operation === "disable"
              ? "disable"
              : "enable",
        )
        .mockResolvedValue();
      const wrapper = mountRealDialog();
      await nextTick();
      const matching = wrapper
        .findAll("button")
        .find((button) => button.text() === label);
      expect(matching).toBeDefined();
      expect(matching?.attributes("disabled")).toBeDefined();
      expect(
        wrapper
          .get('[aria-label="Закрыть настройки аккаунта"]')
          .attributes("disabled"),
      ).toBeUndefined();
      await matching?.trigger("click");
      expect(command).not.toHaveBeenCalled();
      if (argument !== undefined)
        expect(command).not.toHaveBeenCalledWith(argument);
    },
  );

  it("A04 renders the resolved state after deferred transfer failure and permits exactly one retry", async () => {
    const notifications = useOrderNotificationsStore();
    notifications.state = "other_account";
    const release = deferred<void>();
    const enable = vi
      .spyOn(notifications, "enable")
      .mockImplementation(async () => {
        notifications.operation = "transfer";
        await release.promise;
        notifications.operation = null;
        notifications.state = "failed_enable";
      });
    vi.spyOn(notifications, "inspect").mockResolvedValue();
    const wrapper = mountRealDialog();
    await flushPromises();
    const transfer = byText(wrapper, "Подключить к этому аккаунту");
    await transfer.trigger("click");
    await nextTick();
    expect(
      byText(wrapper, "Отключить на этом устройстве").attributes("disabled"),
    ).toBeDefined();
    await transfer.trigger("click");
    expect(enable).toHaveBeenCalledTimes(1);
    expect(enable).toHaveBeenCalledWith(true);
    release.resolve();
    await flushPromises();
    expect(byText(wrapper, "Включить уведомления").exists()).toBe(true);
    await byText(wrapper, "Включить уведомления").trigger("click");
    expect(enable).toHaveBeenCalledTimes(2);
    expect(enable).toHaveBeenLastCalledWith();
  });

  it("A04 renders the resolved state after deferred transfer success", async () => {
    const notifications = useOrderNotificationsStore();
    notifications.state = "other_account";
    const gate = deferred<void>();
    const enable = vi
      .spyOn(notifications, "enable")
      .mockImplementation(async () => {
        notifications.operation = "transfer";
        await gate.promise;
        notifications.operation = null;
        notifications.state = "on_current";
      });
    const wrapper = mountRealDialog();
    await byText(wrapper, "Подключить к этому аккаунту").trigger("click");
    expect(enable).toHaveBeenCalledWith(true);
    gate.resolve();
    await flushPromises();
    expect(notifications.state).toBe("on_current");
    expect(
      wrapper
        .get(".account-settings__notifications")
        .findAll("button")
        .map((button) => button.text()),
    ).toEqual(["Отключить на этом устройстве"]);
    wrapper.unmount();
  });

  it("A04 renders failed foreign-owner stop and permits exactly one retry", async () => {
    const notifications = useOrderNotificationsStore();
    notifications.state = "other_account";
    const gate = deferred<void>();
    const disable = vi
      .spyOn(notifications, "disable")
      .mockImplementation(async () => {
        notifications.operation = "disable";
        await gate.promise;
        notifications.operation = null;
        notifications.state = "failed_disable";
      });
    const wrapper = mountRealDialog();
    await byText(wrapper, "Отключить на этом устройстве").trigger("click");
    expect(disable).toHaveBeenCalledOnce();
    gate.resolve();
    await flushPromises();
    expect(notifications.state).toBe("failed_disable");
    expect(wrapper.findAll('[role="alert"]')).toHaveLength(1);
    await byText(wrapper, "Отключить на этом устройстве").trigger("click");
    expect(disable).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });

  it("CNJ-A1-L03 uses the real deferred inspect lifetime to lock Account and release its retry", async () => {
    const notification = Object.getOwnPropertyDescriptor(
      window,
      "Notification",
    );
    const pushManager = Object.getOwnPropertyDescriptor(window, "PushManager");
    const serviceWorker = Object.getOwnPropertyDescriptor(
      navigator,
      "serviceWorker",
    );
    const first = deferred<PushSubscription | null>();
    const retry = deferred<PushSubscription | null>();
    const getSubscription = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(retry.promise);
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: { permission: "granted" },
    });
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: class {},
    });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { ready: Promise.resolve({ pushManager: { getSubscription } }) },
    });
    const store = useOrderNotificationsStore();
    store.state = "failed_check";
    const wrapper = mountDialogWithRealInspect();
    try {
      await wrapper.setProps({ modelValue: true });
      await vi.waitFor(() => expect(getSubscription).toHaveBeenCalledTimes(1));
      first.resolve(null);
      await flushPromises();
      expect(store.state).toBe("anonymous_off");
      store.state = "failed_check";
      await nextTick();
      await byText(wrapper, "Повторить проверку").trigger("click");
      await vi.waitFor(() => expect(getSubscription).toHaveBeenCalledTimes(2));
      expect(store.operation).toBe("inspect");
      expect(
        byText(wrapper, "Выйти из аккаунта").attributes("disabled"),
      ).toBeDefined();
      expect(
        wrapper
          .get('[aria-label="Закрыть настройки аккаунта"]')
          .attributes("disabled"),
      ).toBeUndefined();
      await store.inspect();
      expect(getSubscription).toHaveBeenCalledTimes(2);
      retry.reject(new Error("failed"));
      await flushPromises();
      expect(store.operation).toBeNull();
      expect(store.state).toBe("failed_check");
      expect(byText(wrapper, "Повторить проверку").exists()).toBe(true);
    } finally {
      wrapper.unmount();
      restoreDescriptor(window, "Notification", notification);
      restoreDescriptor(window, "PushManager", pushManager);
      restoreDescriptor(navigator, "serviceWorker", serviceWorker);
    }
  });

  it("CNJ-A1-T02 records explicit owner choice but never writes anonymous identity memory", async () => {
    window.localStorage.clear();
    const store = useOrderNotificationsStore();
    store.state = "off_current";
    const enable = vi.spyOn(store, "enable").mockResolvedValue();
    const owner = mountRealDialog({ accountId: "account-a" });
    await byText(owner, "Включить уведомления").trigger("click");
    expect(enable).toHaveBeenCalledOnce();
    expect(
      window.localStorage.getItem(
        "expressa.notification-invitation.v1:account-a",
      ),
    ).toBe("seen");
    expect(
      window.localStorage.getItem(
        "expressa.notification-invitation.v1:account-b",
      ),
    ).toBeNull();
    owner.unmount();
    window.localStorage.clear();
    store.state = "other_account";
    const transfer = mountRealDialog({ accountId: "account-a" });
    await byText(transfer, "Подключить к этому аккаунту").trigger("click");
    expect(enable).toHaveBeenLastCalledWith(true);
    expect(
      window.localStorage.getItem(
        "expressa.notification-invitation.v1:account-a",
      ),
    ).toBe("seen");
    transfer.unmount();
    window.localStorage.clear();
    store.state = "on_current";
    const stop = vi.spyOn(store, "disable").mockResolvedValue();
    const current = mountRealDialog({ accountId: "account-a" });
    await byText(current, "Отключить на этом устройстве").trigger("click");
    expect(stop).toHaveBeenCalledOnce();
    expect(
      window.localStorage.getItem(
        "expressa.notification-invitation.v1:account-a",
      ),
    ).toBe("seen");
    current.unmount();
    window.localStorage.clear();
    store.state = "anonymous_subscription";
    const anonymous = mountRealDialog({
      accountId: null,
      authenticated: false,
    });
    await byText(anonymous, "Отключить на этом устройстве").trigger("click");
    expect(window.localStorage.length).toBe(0);
    anonymous.unmount();
  });

  it.each([
    ["off_current", "Включить уведомления", "enable", []],
    ["other_account", "Подключить к этому аккаунту", "enable", [true]],
    ["on_current", "Отключить на этом устройстве", "disable", []],
  ] as const)(
    "I09 records the current account choice for a %s action even when that action settles failed",
    async (state, label, command, arguments_) => {
      window.localStorage.clear();
      const notifications = useOrderNotificationsStore();
      notifications.state = state;
      vi.spyOn(notifications, command).mockImplementation(async () => {
        notifications.operation = command === "enable" ? "enable" : "disable";
        await Promise.resolve();
        notifications.operation = null;
        notifications.state =
          command === "disable" ? "failed_disable" : "failed_enable";
      });
      const wrapper = mountRealDialog({ accountId: "account-a" });
      await byText(wrapper, label).trigger("click");
      await flushPromises();
      expect(vi.mocked(notifications[command])).toHaveBeenCalledWith(
        ...arguments_,
      );
      expect(
        window.localStorage.getItem(
          "expressa.notification-invitation.v1:account-a",
        ),
      ).toBe("seen");
      expect(
        window.localStorage.getItem(
          "expressa.notification-invitation.v1:account-b",
        ),
      ).toBeNull();
      wrapper.unmount();
      notifications.state = "off_current";
      vi.spyOn(notifications, "inspect").mockResolvedValue();
      globalThis.IntersectionObserver = class {
        disconnect(): void {}
        observe(): void {}
        takeRecords(): IntersectionObserverEntry[] {
          return [];
        }
        unobserve(): void {}
      } as unknown as typeof IntersectionObserver;
      const invitationA = mount(OrderNotificationsSection, {
        props: { accountId: "account-a", eligible: true, returnFocusTo: null },
      });
      const invitationB = mount(OrderNotificationsSection, {
        props: { accountId: "account-b", eligible: true, returnFocusTo: null },
      });
      await nextTick();
      expect(invitationA.find(".order-notifications").exists()).toBe(false);
      expect(invitationB.find(".order-notifications").exists()).toBe(true);
      invitationA.unmount();
      invitationB.unmount();
    },
  );

  it.each([
    ["off_current", "Включить уведомления", "enable", "on_current"],
    ["on_current", "Отключить на этом устройстве", "disable", "off_current"],
    ["other_account", "Отключить на этом устройстве", "disable", "off_current"],
  ] as const)(
    "CNJ-A1-T04 drives deferred %s through the real control and settles %s",
    async (state, label, command, settled) => {
      const store = useOrderNotificationsStore();
      store.state = state;
      const gate = deferred<void>();
      const action = vi.spyOn(store, command).mockImplementation(async () => {
        store.operation = command === "enable" ? "enable" : "disable";
        await gate.promise;
        store.operation = null;
        store.state = settled;
      });
      const wrapper = mountRealDialog();
      await byText(wrapper, label).trigger("click");
      await nextTick();
      expect(action).toHaveBeenCalledOnce();
      await byText(wrapper, label).trigger("click");
      expect(action).toHaveBeenCalledOnce();
      expect(
        byText(wrapper, "Выйти из аккаунта").attributes("disabled"),
      ).toBeDefined();
      expect(
        wrapper
          .get('[aria-label="Закрыть настройки аккаунта"]')
          .attributes("disabled"),
      ).toBeUndefined();
      gate.resolve();
      await flushPromises();
      expect(store.state).toBe(settled);
      expect(store.operation).toBeNull();
      wrapper.unmount();
    },
  );

  it("A07 closes a real UiDialog and returns focus to its actual trigger", async () => {
    const trigger = document.createElement("button");
    document.body.append(trigger);
    const open = ref(true);
    const DialogHarness = defineComponent({
      props: { modelValue: Boolean },
      emits: ["update:modelValue", "after-leave"],
      watch: {
        modelValue(value: boolean) {
          if (!value) this.$emit("after-leave");
        },
      },
      template: '<div v-if="modelValue"><slot /></div>',
    });
    const wrapper = mount(AccountSettingsDialog, {
      attachTo: document.body,
      props: {
        accountId: "account-a",
        accountLabel: "+79990000000",
        authenticated: true,
        logoutError: null,
        logoutPending: false,
        modelValue: open.value,
        returnFocusTo: trigger,
        "onUpdate:modelValue": (value: boolean) => (open.value = value),
      },
      global: { stubs: { VDialog: DialogHarness } },
    });
    await wrapper
      .get('[aria-label="Закрыть настройки аккаунта"]')
      .trigger("click");
    await wrapper.setProps({ modelValue: open.value });
    await nextTick();
    expect(document.activeElement).toBe(trigger);
    wrapper.unmount();
    trigger.remove();
  });

  it("A07 Escape closes the mounted Vuetify dialog", async () => {
    const trigger = document.createElement("button");
    document.body.append(trigger);
    const originalViewport = Object.getOwnPropertyDescriptor(
      globalThis,
      "visualViewport",
    );
    Object.defineProperty(globalThis, "visualViewport", {
      configurable: true,
      value: {
        addEventListener: vi.fn(),
        height: 800,
        offsetLeft: 0,
        offsetTop: 0,
        removeEventListener: vi.fn(),
        scale: 1,
        width: 400,
      },
    });
    const open = ref(true);
    const wrapper = mount(AccountSettingsDialog, {
      attachTo: document.body,
      props: {
        accountId: "account-a",
        accountLabel: "+79990000000",
        authenticated: true,
        logoutError: null,
        logoutPending: false,
        modelValue: true,
        returnFocusTo: trigger,
        "onUpdate:modelValue": (value: boolean) => (open.value = value),
      },
      global: { plugins: [vuetify] },
    });
    try {
      await nextTick();
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
      await vi.waitFor(() => expect(open.value).toBe(false));
      await wrapper.setProps({ modelValue: open.value });
      await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
    } finally {
      wrapper.unmount();
      trigger.remove();
      if (originalViewport === undefined)
        delete (globalThis as { visualViewport?: unknown }).visualViewport;
      else
        Object.defineProperty(globalThis, "visualViewport", originalViewport);
    }
  });
});

function mountRealDialog(
  overrides: Partial<InstanceType<typeof AccountSettingsDialog>["$props"]> = {},
) {
  const notifications = useOrderNotificationsStore();
  vi.spyOn(notifications, "inspect").mockResolvedValue();
  return mount(AccountSettingsDialog, {
    props: {
      accountId: "account-a",
      accountLabel: "+79990000000",
      authenticated: true,
      logoutError: null,
      logoutPending: false,
      modelValue: true,
      returnFocusTo: null,
      ...overrides,
    },
    global: {
      stubs: {
        VAlert: {
          props: ["role", "ariaLive"],
          template: '<p :role="role" :aria-live="ariaLive"><slot /></p>',
        },
        VDialog: {
          template: "<div><slot /></div>",
        },
      },
    },
  });
}

function mountDialogWithRealInspect() {
  return mount(AccountSettingsDialog, {
    props: {
      accountId: "account-a",
      accountLabel: "+79990000000",
      authenticated: true,
      logoutError: null,
      logoutPending: false,
      modelValue: false,
      returnFocusTo: null,
    },
    global: {
      stubs: {
        VAlert: {
          props: ["role", "ariaLive"],
          template: '<p :role="role" :aria-live="ariaLive"><slot /></p>',
        },
        VDialog: { template: "<div><slot /></div>" },
      },
    },
  });
}

function byText(wrapper: ReturnType<typeof mount>, text: string) {
  const button = wrapper
    .findAll("button")
    .find((candidate) => candidate.text() === text);
  expect(button, `Expected button ${text}`).toBeDefined();
  return button!;
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (reason?: unknown) => void = () => {};
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, reject, resolve };
}

function restoreDescriptor(
  object: object,
  key: string,
  descriptor: PropertyDescriptor | undefined,
): void {
  if (descriptor === undefined) Reflect.deleteProperty(object, key);
  else Object.defineProperty(object, key, descriptor);
}
