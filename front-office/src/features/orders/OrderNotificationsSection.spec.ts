import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useOrderNotificationsStore } from "@/entities/customer/model/order-notifications.store";
import OrderNotificationsSection from "./OrderNotificationsSection.vue";

describe("OrderNotificationsSection", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    window.localStorage.clear();
    globalThis.IntersectionObserver = class {
      constructor(private readonly callback: IntersectionObserverCallback) {}

      disconnect(): void {}

      observe(target: Element): void {
        this.callback(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }

      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }

      unobserve(): void {}
    } as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it("не показывает подсказку без авторизованного владельца заказа", () => {
    const wrapper = mount(OrderNotificationsSection, {
      props: { accountId: null, eligible: true, returnFocusTo: null },
      global: { stubs: { UiBtn: { template: "<button><slot /></button>" } } },
    });

    expect(wrapper.find(".order-notifications").exists()).toBe(false);
  });

  it("не показывает подсказку для выданного заказа", () => {
    const wrapper = mount(OrderNotificationsSection, {
      props: { accountId: null, eligible: false, returnFocusTo: null },
      global: { stubs: { UiBtn: { template: "<button><slot /></button>" } } },
    });

    expect(wrapper.find(".order-notifications").exists()).toBe(false);
  });

  it("I01 records one first visible eligible visit, not a nonintersecting observation", async () => {
    let callback: IntersectionObserverCallback | undefined;
    const observed = vi.fn();
    globalThis.IntersectionObserver = class {
      constructor(next: IntersectionObserverCallback) {
        callback = next;
      }
      disconnect(): void {}
      observe(target: Element): void {
        observed(target);
      }
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
      unobserve(): void {}
    } as unknown as typeof IntersectionObserver;
    const notifications = useOrderNotificationsStore();
    notifications.state = "off_current";
    vi.spyOn(notifications, "inspect").mockResolvedValue();
    const writes = vi.spyOn(Storage.prototype, "setItem");
    const wrapper = mount(OrderNotificationsSection, {
      attachTo: document.body,
      props: { accountId: "account-a", eligible: true, returnFocusTo: null },
    });
    await wrapper.vm.$nextTick();
    const target = wrapper.get(".order-notifications").element;
    expect(observed).toHaveBeenCalledWith(target);
    callback?.(
      [{ isIntersecting: false, target } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(window.localStorage.length).toBe(0);
    callback?.(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(
      window.localStorage.getItem(
        "expressa.notification-invitation.v1:account-a",
      ),
    ).toBe("seen");
    callback?.(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(writes).toHaveBeenCalledTimes(1);
    expect(wrapper.find(".order-notifications").exists()).toBe(true);
    wrapper.unmount();
  });

  it("I02 waits for a visible document before recording the real intersecting target", async () => {
    const observer = installControlledObserver();
    const hidden = Object.getOwnPropertyDescriptor(document, "hidden");
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    const notifications = readyNotifications();
    const wrapper = mountInvitation("account-a");
    try {
      await wrapper.vm.$nextTick();
      const target = wrapper.get(".order-notifications").element;
      observer.deliver(target, true);
      expect(window.localStorage.length).toBe(0);
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: false,
      });
      observer.deliver(target, true);
      expect(marker("account-a")).toBe("seen");
      expect(notifications.inspect).toHaveBeenCalled();
    } finally {
      wrapper.unmount();
      restoreDescriptor(document, "hidden", hidden);
    }
  });

  it.each([
    ["off_current", "account-a", true, true],
    ["failed_enable", "account-a", true, true],
    ["checking", "account-a", true, false],
    ["unsupported", "account-a", true, false],
    ["denied", "account-a", true, false],
    ["on_current", "account-a", true, false],
    ["other_account", "account-a", true, false],
    ["anonymous_subscription", "account-a", true, false],
    ["anonymous_off", "account-a", true, false],
    ["off_current", null, true, false],
    ["off_current", "account-a", false, false],
  ] as const)(
    "I03 presents %s / owner=%s / eligible=%s as %s",
    async (state, accountId, eligible, shown) => {
      installControlledObserver();
      const notifications = readyNotifications(state);
      const wrapper = mountInvitation(accountId, eligible);
      await wrapper.vm.$nextTick();
      expect(wrapper.find(".order-notifications").exists()).toBe(shown);
      expect(notifications.inspect).toHaveBeenCalled();
      wrapper.unmount();
    },
  );

  it("I03 suppresses a prior-visit marker after a remount", async () => {
    installControlledObserver();
    readyNotifications();
    window.localStorage.setItem(markerKey("account-a"), "seen");
    const wrapper = mountInvitation("account-a");
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".order-notifications").exists()).toBe(false);
    wrapper.unmount();
  });

  it("I04 dismisses only the hint, never invokes a notification command, and restores in-hint focus", async () => {
    installControlledObserver();
    const notifications = readyNotifications();
    const heading = document.createElement("h1");
    heading.tabIndex = -1;
    document.body.append(heading);
    const wrapper = mountInvitation("account-a", true, heading, true);
    await wrapper.vm.$nextTick();
    const dismiss = button(wrapper, "Не сейчас");
    (dismiss.element as HTMLButtonElement).focus();
    await dismiss.trigger("click");
    expect(notifications.enable).not.toHaveBeenCalled();
    expect(notifications.disable).not.toHaveBeenCalled();
    expect(wrapper.find(".order-notifications").exists()).toBe(false);
    expect(document.activeElement).toBe(heading);
    wrapper.unmount();
  });

  it("I04 keeps unrelated focus when dismissal was not initiated inside the hint", async () => {
    installControlledObserver();
    readyNotifications();
    const unrelated = document.createElement("button");
    document.body.append(unrelated);
    const wrapper = mountInvitation("account-a", true, null, true);
    await wrapper.vm.$nextTick();
    unrelated.focus();
    await button(wrapper, "Не сейчас").trigger("click");
    expect(document.activeElement).toBe(unrelated);
    wrapper.unmount();
  });

  it("I05 retains the consumed visit through a failed enable and supports exactly one retry", async () => {
    installControlledObserver();
    const notifications = readyNotifications();
    let calls = 0;
    vi.mocked(notifications.enable).mockImplementation(async () => {
      calls += 1;
      notifications.operation = "enable";
      await Promise.resolve();
      notifications.operation = null;
      notifications.state = calls === 1 ? "failed_enable" : "on_current";
    });
    const wrapper = mountInvitation("account-a");
    await wrapper.vm.$nextTick();
    await button(wrapper, "Включить уведомления").trigger("click");
    await wrapper.vm.$nextTick();
    expect(notifications.enable).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain("Не удалось включить уведомления");
    await button(wrapper, "Включить уведомления").trigger("click");
    await wrapper.vm.$nextTick();
    expect(notifications.enable).toHaveBeenCalledTimes(2);
    expect(wrapper.find(".order-notifications").exists()).toBe(false);
    wrapper.unmount();
  });

  it("I05a keeps a pre-observer enable visit usable through pending, failure and one retry", async () => {
    installControlledObserver();
    const notifications = readyNotifications();
    const first = deferred<void>();
    const second = deferred<void>();
    let calls = 0;
    vi.mocked(notifications.enable).mockImplementation(async () => {
      calls += 1;
      notifications.operation = "enable";
      await (calls === 1 ? first.promise : second.promise);
      notifications.operation = null;
      notifications.state = calls === 1 ? "failed_enable" : "on_current";
    });
    const wrapper = mountInvitation("account-a", true, null, true);
    try {
      await wrapper.vm.$nextTick();
      await button(wrapper, "Включить уведомления").trigger("click");
      expect(marker("account-a")).toBe("seen");
      expect(wrapper.find(".order-notifications").exists()).toBe(true);
      expect(wrapper.text()).toContain("Включаем уведомления");
      await button(wrapper, "Не сейчас").trigger("click");
      await button(wrapper, "Включить уведомления").trigger("click");
      expect(notifications.enable).toHaveBeenCalledTimes(1);
      first.resolve();
      await wrapper.vm.$nextTick();
      await Promise.resolve();
      expect(wrapper.text()).toContain("Не удалось включить уведомления");
      await button(wrapper, "Включить уведомления").trigger("click");
      expect(notifications.enable).toHaveBeenCalledTimes(2);
      second.resolve();
      await wrapper.vm.$nextTick();
      await Promise.resolve();
      expect(wrapper.find(".order-notifications").exists()).toBe(false);
    } finally {
      first.resolve();
      second.resolve();
      wrapper.unmount();
    }
  });

  it("I05b retains a legitimately exposed visit after failed enable, but not across owner or remount", async () => {
    const observer = installControlledObserver();
    const notifications = readyNotifications();
    const first = deferred<void>();
    const retry = deferred<void>();
    let calls = 0;
    vi.mocked(notifications.enable).mockImplementation(async () => {
      calls += 1;
      notifications.operation = "enable";
      await (calls === 1 ? first.promise : retry.promise);
      notifications.operation = null;
      notifications.state = calls === 1 ? "failed_enable" : "on_current";
    });
    const wrapper = mountInvitation("account-a");
    await wrapper.vm.$nextTick();
    const target = wrapper.get(".order-notifications").element;
    observer.deliver(target, true);
    await button(wrapper, "Включить уведомления").trigger("click");
    expect(wrapper.text()).toContain("Включаем уведомления");
    await button(wrapper, "Не сейчас").trigger("click");
    await button(wrapper, "Включить уведомления").trigger("click");
    expect(notifications.enable).toHaveBeenCalledTimes(1);
    first.resolve();
    await wrapper.vm.$nextTick();
    await Promise.resolve();
    expect(wrapper.text()).toContain("Не удалось включить уведомления");
    await button(wrapper, "Включить уведомления").trigger("click");
    expect(notifications.enable).toHaveBeenCalledTimes(2);
    retry.resolve();
    await wrapper.vm.$nextTick();
    await Promise.resolve();
    expect(wrapper.find(".order-notifications").exists()).toBe(false);
    wrapper.unmount();
    const revisit = mountInvitation("account-a");
    await revisit.vm.$nextTick();
    expect(revisit.find(".order-notifications").exists()).toBe(false);
    revisit.unmount();
    window.localStorage.removeItem(markerKey("account-b"));
    notifications.state = "off_current";
    const other = mountInvitation("account-b");
    await other.vm.$nextTick();
    expect(other.find(".order-notifications").exists()).toBe(true);
    other.unmount();
  });

  it("I06 does not automatically expose again after navigation, reload-like remount, login, or another owned order", async () => {
    const observer = installControlledObserver();
    readyNotifications();
    const first = mountInvitation("account-a");
    await first.vm.$nextTick();
    const target = first.get(".order-notifications").element;
    observer.deliver(target, true);
    first.unmount();
    const revisit = mountInvitation("account-a");
    await revisit.vm.$nextTick();
    expect(revisit.find(".order-notifications").exists()).toBe(false);
    revisit.unmount();
    const differentOrderSameOwner = mountInvitation("account-a");
    await differentOrderSameOwner.vm.$nextTick();
    expect(differentOrderSameOwner.find(".order-notifications").exists()).toBe(
      false,
    );
    differentOrderSameOwner.unmount();
  });

  it("I06 retains A storage across fresh-store reload simulation and A logout/login", async () => {
    const observer = installControlledObserver();
    readyNotifications();
    const first = mountInvitation("account-a");
    await first.vm.$nextTick();
    observer.deliver(first.get(".order-notifications").element, true);
    first.unmount();
    setActivePinia(createPinia());
    readyNotifications();
    const reloaded = mountInvitation("account-a");
    await reloaded.vm.$nextTick();
    expect(reloaded.find(".order-notifications").exists()).toBe(false);
    await reloaded.setProps({ accountId: null });
    await reloaded.setProps({ accountId: "account-a" });
    expect(reloaded.find(".order-notifications").exists()).toBe(false);
    reloaded.unmount();
  });

  it("I07 isolates A/B markers and stale observer callbacks cannot write either identity", async () => {
    const observer = installControlledObserver();
    readyNotifications();
    const first = mountInvitation("account-a");
    await first.vm.$nextTick();
    const targetA = first.get(".order-notifications").element;
    observer.deliver(targetA, true);
    first.unmount();
    const second = mountInvitation("account-b");
    await second.vm.$nextTick();
    expect(second.find(".order-notifications").exists()).toBe(true);
    const targetB = second.get(".order-notifications").element;
    await second.setProps({ accountId: "account-c" });
    observer.deliver(targetB, true);
    expect(marker("account-b")).toBeNull();
    expect(marker("account-c")).toBeNull();
    second.unmount();
  });

  it("I07 allows B after unavailable A storage and keeps returning A suppressed", async () => {
    const observer = installControlledObserver();
    readyNotifications();
    window.localStorage.setItem(markerKey("account-a"), "seen");
    const b = mountInvitation("account-b");
    await b.vm.$nextTick();
    expect(b.find(".order-notifications").exists()).toBe(true);
    observer.deliver(b.get(".order-notifications").element, true);
    b.unmount();
    const a = mountInvitation("account-a");
    await a.vm.$nextTick();
    expect(a.find(".order-notifications").exists()).toBe(false);
    a.unmount();
  });

  it("I07 isolates a failed A exposure from B and rejects A's retained callback", async () => {
    const observer = installControlledObserver();
    readyNotifications();
    const write = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    const a = mountInvitation("account-a");
    await a.vm.$nextTick();
    const targetA = a.get(".order-notifications").element;
    observer.deliver(targetA, true);
    expect(marker("account-a")).toBeNull();
    write.mockRestore();
    const b = mountInvitation("account-b");
    await b.vm.$nextTick();
    expect(b.find(".order-notifications").exists()).toBe(true);
    observer.deliver(targetA, true);
    expect(marker("account-a")).toBeNull();
    expect(marker("account-b")).toBeNull();
    a.unmount();
    b.unmount();
  });

  it("I07 delivers retained A only to its disconnected observer and proves mixed B entries are rejected", async () => {
    const observer = installControlledObserver();
    readyNotifications();
    const a = mountInvitation("account-a");
    await a.vm.$nextTick();
    const targetA = a.get(".order-notifications").element;
    a.unmount();
    const b = mountInvitation("account-b");
    await b.vm.$nextTick();
    const targetB = b.get(".order-notifications").element;
    observer.deliverTo(targetA, [entry(targetA, true)]);
    expect(marker("account-a")).toBeNull();
    expect(marker("account-b")).toBeNull();
    observer.deliverTo(targetB, [entry(targetA, true), entry(targetB, false)]);
    expect(marker("account-b")).toBeNull();
    const writes = vi.spyOn(Storage.prototype, "setItem");
    observer.deliverTo(targetB, [entry(targetB, true)]);
    observer.deliverTo(targetB, [entry(targetB, true)]);
    expect(marker("account-a")).toBeNull();
    expect(marker("account-b")).toBe("seen");
    expect(writes).toHaveBeenCalledTimes(1);
    b.unmount();
  });

  it("I08 omits the automatic hint when storage cannot be read or written", async () => {
    installControlledObserver();
    readyNotifications();
    const getItem = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    const wrapper = mountInvitation("account-a");
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".order-notifications").exists()).toBe(false);
    expect(getItem).toHaveBeenCalled();
    wrapper.unmount();
  });

  it("I08 hides an unrecordable actual exposure without technical order content", async () => {
    const observer = installControlledObserver();
    readyNotifications();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const wrapper = mountInvitation("account-a");
    await wrapper.vm.$nextTick();
    observer.deliver(wrapper.get(".order-notifications").element, true);
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".order-notifications").exists()).toBe(false);
    expect(wrapper.text()).not.toContain("blocked");
    wrapper.unmount();
  });

  it("I08 read failure is owner-local: later valid B can still render without technical copy", async () => {
    installControlledObserver();
    readyNotifications();
    const read = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    const a = mountInvitation("account-a");
    await a.vm.$nextTick();
    expect(a.find(".order-notifications").exists()).toBe(false);
    read.mockRestore();
    const b = mountInvitation("account-b");
    await b.vm.$nextTick();
    expect(b.find(".order-notifications").exists()).toBe(true);
    expect(b.text()).not.toContain("blocked");
    a.unmount();
    b.unmount();
  });

  it("I10 disconnects stale observer work on unmount without restoring detached focus", async () => {
    const observer = installControlledObserver();
    readyNotifications();
    const heading = document.createElement("h1");
    heading.tabIndex = -1;
    document.body.append(heading);
    const wrapper = mountInvitation("account-a", true, heading, true);
    await wrapper.vm.$nextTick();
    const target = wrapper.get(".order-notifications").element;
    wrapper.unmount();
    target.remove();
    observer.deliver(target, true);
    expect(marker("account-a")).toBeNull();
    expect(marker("account-b")).toBeNull();
    expect(observer.disconnected()).toBe(true);
    expect(document.activeElement).not.toBe(heading);
  });

  it("I10b disposes an observation scheduled before its nextTick continuation", async () => {
    const observer = installControlledObserver();
    readyNotifications();
    const wrapper = mountInvitation("account-a");
    wrapper.unmount();
    await Promise.resolve();
    await Promise.resolve();
    expect(observer.count()).toBe(0);
    expect(marker("account-a")).toBeNull();
  });

  it("оставляет подсказку с повтором после ошибки включения", () => {
    const notifications = useOrderNotificationsStore();
    notifications.state = "failed_enable";
    const wrapper = mount(OrderNotificationsSection, {
      props: { accountId: "customer-1", eligible: true, returnFocusTo: null },
      global: { stubs: { UiBtn: { template: "<button><slot /></button>" } } },
    });

    expect(wrapper.text()).toContain(
      "Не удалось включить уведомления. Попробуйте ещё раз.",
    );
    expect(wrapper.get("button").text()).toBe("Включить уведомления");
  });

  it("не записывает выбор B по запоздалому пересечению наблюдателя A", async () => {
    const callbacks: IntersectionObserverCallback[] = [];
    globalThis.IntersectionObserver = class {
      constructor(callback: IntersectionObserverCallback) {
        callbacks.push(callback);
      }

      disconnect(): void {}
      observe(): void {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
      unobserve(): void {}
    } as unknown as typeof IntersectionObserver;
    const notifications = useOrderNotificationsStore();
    notifications.state = "off_current";
    const wrapper = mount(OrderNotificationsSection, {
      props: { accountId: "account-a", eligible: true, returnFocusTo: null },
      global: { stubs: { UiBtn: { template: "<button><slot /></button>" } } },
    });
    await wrapper.vm.$nextTick();
    const stale = callbacks[0];
    await wrapper.setProps({ accountId: "account-b" });
    stale?.(
      [
        {
          isIntersecting: true,
          target: wrapper.element,
        } as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    );
    expect(
      window.localStorage.getItem(
        "expressa.notification-invitation.v1:account-b",
      ),
    ).toBeNull();
  });

  it("не расходует показ, если приглашение скрыто до запоздалого callback", async () => {
    const callbacks: IntersectionObserverCallback[] = [];
    globalThis.IntersectionObserver = class {
      constructor(callback: IntersectionObserverCallback) {
        callbacks.push(callback);
      }

      disconnect(): void {}
      observe(): void {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
      unobserve(): void {}
    } as unknown as typeof IntersectionObserver;
    useOrderNotificationsStore().state = "off_current";
    const wrapper = mount(OrderNotificationsSection, {
      props: { accountId: "account-a", eligible: true, returnFocusTo: null },
      global: { stubs: { UiBtn: { template: "<button><slot /></button>" } } },
    });
    await wrapper.vm.$nextTick();
    const stale = callbacks[0];
    await wrapper.setProps({ eligible: false });
    stale?.(
      [
        {
          isIntersecting: true,
          target: wrapper.element,
        } as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    );
    expect(
      window.localStorage.getItem(
        "expressa.notification-invitation.v1:account-a",
      ),
    ).toBeNull();
  });
});

function markerKey(accountId: string): string {
  return `expressa.notification-invitation.v1:${accountId}`;
}

function marker(accountId: string): string | null {
  return window.localStorage.getItem(markerKey(accountId));
}

function readyNotifications(
  state: ReturnType<typeof useOrderNotificationsStore>["state"] = "off_current",
) {
  const notifications = useOrderNotificationsStore();
  notifications.state = state;
  vi.spyOn(notifications, "inspect").mockResolvedValue();
  vi.spyOn(notifications, "enable").mockResolvedValue();
  vi.spyOn(notifications, "disable").mockResolvedValue();
  return notifications;
}

function mountInvitation(
  accountId: string | null,
  eligible = true,
  returnFocusTo: HTMLElement | null = null,
  attached = false,
) {
  return mount(OrderNotificationsSection, {
    attachTo: attached ? document.body : undefined,
    props: { accountId, eligible, returnFocusTo },
  });
}

function button(wrapper: ReturnType<typeof mount>, label: string) {
  const candidate = wrapper
    .findAll("button")
    .find((item) => item.text() === label);
  if (candidate === undefined)
    throw new Error(`Button ${label} was not found.`);
  return candidate;
}

function installControlledObserver() {
  const callbacks: Array<{
    callback: IntersectionObserverCallback;
    disconnected: boolean;
    target: Element | null;
  }> = [];
  globalThis.IntersectionObserver = class {
    private readonly record: {
      callback: IntersectionObserverCallback;
      disconnected: boolean;
      target: Element | null;
    };
    constructor(callback: IntersectionObserverCallback) {
      this.record = { callback, disconnected: false, target: null };
      callbacks.push(this.record);
    }
    disconnect(): void {
      this.record.disconnected = true;
    }
    observe(target: Element): void {
      this.record.target = target;
    }
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    unobserve(): void {}
  } as unknown as typeof IntersectionObserver;
  return {
    count(): number {
      return callbacks.length;
    },
    disconnected(): boolean {
      return callbacks.some((record) => record.disconnected);
    },
    deliverTo(target: Element, entries: IntersectionObserverEntry[]): void {
      const record = callbacks.find((candidate) => candidate.target === target);
      if (record === undefined)
        throw new Error("Controlled observer target was not registered.");
      record.callback(entries, {} as IntersectionObserver);
    },
    deliver(target: Element, isIntersecting: boolean): void {
      for (const { callback } of callbacks)
        callback(
          [{ isIntersecting, target } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        );
    },
  };
}

function entry(
  target: Element,
  isIntersecting: boolean,
): IntersectionObserverEntry {
  return { isIntersecting, target } as IntersectionObserverEntry;
}

function restoreDescriptor(
  object: object,
  key: string,
  descriptor: PropertyDescriptor | undefined,
): void {
  if (descriptor === undefined) Reflect.deleteProperty(object, key);
  else Object.defineProperty(object, key, descriptor);
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}
