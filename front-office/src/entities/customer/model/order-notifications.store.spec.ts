import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClient } from "@/shared/api/client";
import type { PushSubscriptionRequest } from "@/shared/api/push.api";
import { configureOrderNotificationsDependencies } from "./order-notifications.store.dependencies";
import { useOrderNotificationsStore } from "./order-notifications.store";

const vapid =
  "BKdrZ6EKrXOx0fbDPwF3egGVmOfYiacFCfz8g0-OG1FrCF_pmVddiHl8yPwv5kUNc9mu0vsPJgkuCwK1dbEWJ_k";
let apiFixtures: Array<{ assertConsumed: () => void }>;

describe("order notifications store lifecycle matrix", () => {
  let notificationDescriptor: PropertyDescriptor | undefined;
  let pushManagerDescriptor: PropertyDescriptor | undefined;
  let serviceWorkerDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    setActivePinia(createPinia());
    notificationDescriptor = Object.getOwnPropertyDescriptor(
      window,
      "Notification",
    );
    pushManagerDescriptor = Object.getOwnPropertyDescriptor(
      window,
      "PushManager",
    );
    serviceWorkerDescriptor = Object.getOwnPropertyDescriptor(
      navigator,
      "serviceWorker",
    );
    apiFixtures = [];
  });
  afterEach(() => {
    restoreDescriptor(window, "Notification", notificationDescriptor);
    restoreDescriptor(window, "PushManager", pushManagerDescriptor);
    restoreDescriptor(navigator, "serviceWorker", serviceWorkerDescriptor);
    apiFixtures.forEach(({ assertConsumed }) => assertConsumed());
  });

  it.each(["P01 unsupported", "P02 denied"])(
    "%s performs no mutation",
    async (id) => {
      const fixture = install({
        supported: id !== "P01 unsupported",
        permission: "denied",
      });
      const api = apiFixture();
      configureOrderNotificationsDependencies(api.client, async (read) =>
        read("token-a"),
      );
      const store = session();
      await store.enable();
      expect(store.state).toBe(
        id === "P01 unsupported" ? "unsupported" : "denied",
      );
      expect(fixture.subscribe).not.toHaveBeenCalled();
      expect(api.calls).toHaveLength(0);
    },
  );

  it("F1 fixture makes an unplanned endpoint attempt visible to the test", async () => {
    const api = apiFixture({}, false);

    await expect(
      api.client.request(
        "/push/unplanned",
        (value): value is undefined =>
          value === undefined || value !== undefined,
        {
          headers: { authorization: "Bearer token-a" },
          method: "GET",
        },
      ),
    ).rejects.toThrow();

    expect(api.trace()).toEqual(["GET /push/unplanned token-a"]);
    expect(api.violations).toEqual([
      "Unexpected notification API request: GET /push/unplanned",
    ]);
    expect(api.assertConsumed).toThrow(
      "Unexpected notification API request: GET /push/unplanned",
    );
  });

  it.each([
    ["P04 current", "current", "on_current"],
    ["P04 other", "other", "other_account"],
    ["P04 none", "none", "off_current"],
  ])(
    "%s inspects existing capability without mutation",
    async (_id, association, state) => {
      const subscription = push("p04");
      install({ current: subscription });
      const api = apiFixture({
        publicKey: [
          {
            expectedToken: "token-a",
            expectedBody: undefined,
            response: { publicKey: vapid },
            status: 200,
          },
        ],
        inspect: [
          {
            expectedToken: "token-a",
            expectedBody: requestSubscription(subscription),
            response: { association, version: "v0" },
            status: 200,
          },
        ],
      });
      configureOrderNotificationsDependencies(api.client, async (read) =>
        read("token-a"),
      );
      const store = session();
      await store.inspect();
      expect(store.state).toBe(state);
      expect(store.version).toBe("v0");
      expect(api.trace()).toEqual([
        "GET /push/public-key token-a",
        "POST /push/subscriptions/inspect token-a",
      ]);
    },
  );

  it("F2 server-only stop reuses retained inspected capability without subscribe", async () => {
    const subscription = push("reuse");
    const { fixture, store } = await inspectCurrent(subscription, {
      apiPlans: {
        deleteAssociation: [
          {
            expectedToken: "token-a",
            expectedBody: {
              expectedVersion: "v",
              subscription: requestSubscription(subscription),
            },
            response: undefined,
            status: 204,
          },
        ],
        association: [
          {
            expectedToken: "token-a",
            expectedBody: {
              action: "enable",
              expectedVersion: null,
              subscription: requestSubscription(subscription),
            },
            response: { association: "current", version: "v-next" },
            status: 200,
          },
        ],
      },
      browser: { observed: subscription },
    });
    await store.disable();
    expect(store).toMatchObject({
      state: "off_current",
      subscription: requestSubscription(subscription),
      version: null,
    });
    await store.enable();
    expect(fixture.subscribe).not.toHaveBeenCalled();
    expect(store).toMatchObject({ state: "on_current", version: "v-next" });
  });

  it.each([
    ["P05 absent", null, "anonymous_off"],
    ["P05 present", push("p05"), "anonymous_subscription"],
  ])("%s does not authenticate", async (_id, current, expected) => {
    install({ current });
    const api = apiFixture();
    configureOrderNotificationsDependencies(api.client, async (read) =>
      read("token-a"),
    );
    const store = useOrderNotificationsStore();
    await store.inspect();
    expect(store.state).toBe(expected);
    expect(api.calls).toHaveLength(0);
  });

  it("P06 deferred key does not publish A result into B", async () => {
    const key = deferred<unknown>();
    install({ current: null });
    const api = apiFixture({
      publicKey: [
        {
          expectedToken: "token-a",
          expectedBody: undefined,
          response: key.promise,
          status: 200,
        },
        {
          expectedToken: "token-b",
          expectedBody: undefined,
          response: { publicKey: vapid },
          status: 200,
        },
      ],
    });
    configureOrderNotificationsDependencies(api.client, async (read) =>
      read("token-a"),
    );
    const store = session();
    const pending = store.inspect();
    try {
      await vi.waitFor(() => expect(api.calls).toHaveLength(1));
      expect(store.operation).toBe("inspect");
      await store.inspect();
      expect(api.calls).toHaveLength(1);
      store.setSession("account-b", "token-b");
      expect(store.operation).toBeNull();
      key.resolve({ publicKey: vapid });
      await pending;
      expect(store.publicKey).toBeNull();
      configureOrderNotificationsDependencies(api.client, async (read) =>
        read("token-b"),
      );
      await store.inspect();
      expect(store.publicKey).toBe(vapid);
    } finally {
      key.resolve({ publicKey: vapid });
      await pending;
    }
  });

  it("P07 failed key has a released retry state", async () => {
    install({ current: null });
    const api = apiFixture({
      publicKey: [
        {
          expectedToken: "token-a",
          expectedBody: undefined,
          response: rejectLater("key"),
          status: 200,
        },
        {
          expectedToken: "token-a",
          expectedBody: undefined,
          response: { publicKey: vapid },
          status: 200,
        },
      ],
    });
    configureOrderNotificationsDependencies(api.client, async (read) =>
      read("token-a"),
    );
    const store = session();
    await store.inspect();
    expect(store.state).toBe("failed_check");
    expect(store.operation).toBeNull();
    await store.inspect();
    expect(store).toMatchObject({ state: "off_current", publicKey: vapid });
  });

  it.each(["ready", "getSubscription"] as const)(
    "P07 %s failure releases inspect for an explicit successful retry",
    async (boundary) => {
      const ready = deferred<BrowserRegistration>();
      const getSubscription = deferred<BrowserSubscription | null>();
      const fixture = install({
        current: null,
        ...(boundary === "ready" ? { ready } : { steps: { getSubscription } }),
      });
      const api = apiFixture({
        publicKey: [
          {
            expectedToken: "token-a",
            expectedBody: undefined,
            response: { publicKey: vapid },
            status: 200,
          },
          {
            expectedToken: "token-a",
            expectedBody: undefined,
            response: { publicKey: vapid },
            status: 200,
          },
        ],
      });
      configureOrderNotificationsDependencies(api.client, async (read) =>
        read("token-a"),
      );
      const store = session();
      const pending = store.inspect();
      if (boundary === "ready") {
        try {
          await ready.entered;
          expect(fixture.trace).toContain("ready");
          ready.reject(new Error("ready"));
          await pending;
        } finally {
          ready.resolve({
            pushManager: {
              getSubscription: fixture.getSubscription,
              subscribe: fixture.subscribe,
            },
          });
          await pending;
        }
      } else {
        try {
          await getSubscription.entered;
          expect(fixture.trace).toContain("getSubscription");
          getSubscription.reject(new Error("getSubscription"));
          await pending;
        } finally {
          getSubscription.resolve(null);
          await pending;
        }
      }
      expect(store).toMatchObject({ state: "failed_check", operation: null });
      if (boundary === "ready") install({ current: null });
      await store.inspect();
      expect(store).toMatchObject({ state: "off_current", publicKey: vapid });
    },
  );

  it("P08 uses prepared key once for subscribe and association", async () => {
    const fixture = install({ current: null });
    const api = apiFixture({
      publicKey: [
        {
          expectedToken: "token-a",
          expectedBody: undefined,
          response: { publicKey: vapid },
          status: 200,
        },
      ],
      association: [
        {
          expectedToken: "token-a",
          expectedBody: {
            action: "enable",
            expectedVersion: null,
            subscription: requestSubscription(push("created")),
          },
          response: { association: "current", version: "v1" },
          status: 200,
        },
      ],
    });
    configureOrderNotificationsDependencies(api.client, async (read) =>
      read("token-a"),
    );
    const store = session();
    await store.inspect();
    await store.enable();
    expect(api.trace()).toEqual([
      "GET /push/public-key token-a",
      "PUT /push/subscriptions/association token-a",
    ]);
    expect(fixture.subscribe).toHaveBeenCalledTimes(1);
    expect(store.state).toBe("on_current");
  });

  it("P03 supported browser without a saved subscription prepares one key and stays off", async () => {
    const fixture = install({ current: null });
    const api = apiFixture({
      publicKey: [
        {
          expectedToken: "token-a",
          expectedBody: undefined,
          response: { publicKey: vapid },
          status: 200,
        },
      ],
    });
    configureOrderNotificationsDependencies(api.client, async (read) =>
      read("token-a"),
    );
    const store = session();
    await store.inspect();
    expect("Notification" in window).toBe(true);
    expect("PushManager" in window).toBe(true);
    expect("serviceWorker" in navigator).toBe(true);
    expect(api.trace()).toEqual(["GET /push/public-key token-a"]);
    expect(fixture.requestPermission).not.toHaveBeenCalled();
    expect(fixture.subscribe).not.toHaveBeenCalled();
    expect(store).toMatchObject({
      operation: null,
      publicKey: vapid,
      state: "off_current",
      subscription: null,
      version: null,
    });
  });

  it("E01 requests default permission before awaited browser work", async () => {
    const permission = deferred<NotificationPermission>();
    const fixture = install({
      current: null,
      permission: "default",
      steps: { permission },
    });
    const api = apiFixture({
      publicKey: [
        {
          expectedToken: "token-a",
          expectedBody: undefined,
          response: { publicKey: vapid },
          status: 200,
        },
      ],
      association: [
        {
          expectedToken: "token-a",
          expectedBody: {
            action: "enable",
            expectedVersion: null,
            subscription: requestSubscription(push("created")),
          },
          response: { association: "current", version: "v1" },
          status: 200,
        },
      ],
    });
    configureOrderNotificationsDependencies(api.client, async (read) =>
      read("token-a"),
    );
    const store = session();
    const pending = store.enable();
    try {
      await permission.entered;
      expect(fixture.requestPermission).toHaveBeenCalledTimes(1);
      expect(fixture.subscribe).not.toHaveBeenCalled();
      permission.resolve("granted");
      await pending;
      expect(fixture.subscribe).toHaveBeenCalledTimes(1);
      expect(api.trace()).toEqual([
        "GET /push/public-key token-a",
        "PUT /push/subscriptions/association token-a",
      ]);
    } finally {
      permission.resolve("granted");
      await pending;
    }
  });

  it.each(["denied", "default"] as const)(
    "E02 %s permission has no browser or server mutation",
    async (result) => {
      const fixture = install({
        current: null,
        permission: "default",
        permissionPromise: Promise.resolve(result),
      });
      const api = apiFixture();
      configureOrderNotificationsDependencies(api.client, async (read) =>
        read("token-a"),
      );
      await session().enable();
      expect(fixture.subscribe).not.toHaveBeenCalled();
      expect(api.calls).toHaveLength(0);
    },
  );

  it.each([
    ["E03 reuse", push("e03"), 0],
    ["E03 subscribe", null, 1],
  ])("%s follows granted capability", async (_id, current, subscriptions) => {
    const fixture = install({ current });
    const api = apiFixture({
      ...(current === null
        ? {
            publicKey: [
              {
                expectedToken: "token-a",
                expectedBody: undefined,
                response: { publicKey: vapid },
                status: 200,
              },
            ],
          }
        : {}),
      association: [
        {
          expectedToken: "token-a",
          expectedBody: {
            action: "enable",
            expectedVersion: null,
            subscription: requestSubscription(current ?? push("created")),
          },
          response: { association: "current", version: "v" },
          status: 200,
        },
      ],
    });
    configureOrderNotificationsDependencies(api.client, async (read) =>
      read("token-a"),
    );
    const store = session();
    await store.enable();
    expect(fixture.requestPermission).not.toHaveBeenCalled();
    expect(fixture.subscribe).toHaveBeenCalledTimes(subscriptions);
    expect(store.state).toBe("on_current");
  });

  it.each(["permission", "registration", "getSubscription", "subscribe"])(
    "E04 %s failure is retriable and never associates",
    async (boundary) => {
      const ready = deferred<{
        pushManager: {
          getSubscription: () => Promise<BrowserSubscription | null>;
          subscribe: () => Promise<BrowserSubscription>;
        };
      }>();
      const fixture = install({
        current: null,
        permission: boundary === "permission" ? "default" : "granted",
        permissionPromise:
          boundary === "permission"
            ? new Promise<NotificationPermission>((_, reject) =>
                queueMicrotask(() => reject(new Error("permission"))),
              )
            : undefined,
        ...(boundary === "registration" ? { ready } : {}),
      });
      if (boundary === "getSubscription") fixture.failGetSubscriptionOnce();
      if (boundary === "subscribe") fixture.failSubscribeOnce();
      const api = apiFixture(
        boundary === "subscribe"
          ? {
              publicKey: [
                {
                  expectedToken: "token-a",
                  expectedBody: undefined,
                  response: { publicKey: vapid },
                  status: 200,
                },
              ],
            }
          : {},
      );
      configureOrderNotificationsDependencies(api.client, async (read) =>
        read("token-a"),
      );
      const store = session();
      const operation = store.enable();
      try {
        if (boundary === "registration") {
          await fixture.ready.entered;
          expect(fixture.getSubscription).not.toHaveBeenCalled();
          ready.reject(new Error("registration"));
        }
        await operation;
      } finally {
        if (boundary === "registration")
          ready.resolve({
            pushManager: {
              getSubscription: fixture.getSubscription,
              subscribe: fixture.subscribe,
            },
          });
        await operation;
      }
      expect(store.state).toBe("failed_enable");
      expect(api.trace().filter((call) => call.startsWith("PUT"))).toHaveLength(
        0,
      );
      expect(store.operation).toBeNull();
      expect(fixture.trace).toContain(
        boundary === "registration"
          ? "ready"
          : boundary === "permission"
            ? "requestPermission"
            : boundary,
      );
      expect(fixture.subscribe).toHaveBeenCalledTimes(
        boundary === "subscribe" ? 1 : 0,
      );
      install({ current: null });
      const retryApi = apiFixture({
        publicKey: [
          {
            expectedToken: "token-a",
            expectedBody: undefined,
            response: { publicKey: vapid },
            status: 200,
          },
        ],
      });
      configureOrderNotificationsDependencies(retryApi.client, async (read) =>
        read("token-a"),
      );
      await store.inspect();
      expect(store).toMatchObject({ state: "off_current", publicKey: vapid });
    },
  );

  it("E05 associates captured tuple and E06 transfer carries inspected version", async () => {
    const subscription = push("e05");
    install({ current: subscription });
    const api = apiFixture({
      publicKey: [
        {
          expectedToken: "token-a",
          expectedBody: undefined,
          response: { publicKey: vapid },
          status: 200,
        },
      ],
      inspect: [
        {
          expectedToken: "token-a",
          expectedBody: requestSubscription(subscription),
          response: { association: "other", version: "v-other" },
          status: 200,
        },
      ],
      association: [
        {
          expectedToken: "token-a",
          expectedBody: {
            action: "transfer",
            expectedVersion: "v-other",
            subscription: requestSubscription(subscription),
          },
          response: { association: "current", version: "v-current" },
          status: 200,
        },
      ],
    });
    configureOrderNotificationsDependencies(api.client, async (read) =>
      read("token-a"),
    );
    const store = session();
    await store.inspect();
    await store.enable(true);
    expect(api.calls[2]?.options.body).toBe(
      JSON.stringify({
        action: "transfer",
        expectedVersion: "v-other",
        subscription: requestSubscription(subscription),
      }),
    );
    expect(store.version).toBe("v-current");
  });

  it.each(["auth", "p256dh"])(
    "E04 missing %s encryption key fails before association and supports explicit retry",
    async (missing) => {
      const invalid = push("missing-key");
      const fixture = install({
        current: {
          ...invalid,
          getKey: (name: string) =>
            name === missing ? null : invalid.getKey(name),
        },
      });
      const api = apiFixture();
      configureOrderNotificationsDependencies(api.client, async (read) =>
        read("token-a"),
      );
      const store = session();
      await store.enable();
      expect(store).toMatchObject({ operation: null, state: "failed_enable" });
      expect(api.trace()).toEqual([]);
      fixture.setCurrent(push("valid"));
      const retryApi = apiFixture({
        publicKey: [
          {
            expectedToken: "token-a",
            expectedBody: undefined,
            response: { publicKey: vapid },
            status: 200,
          },
        ],
        inspect: [
          {
            expectedToken: "token-a",
            expectedBody: requestSubscription(push("valid")),
            response: { association: "none", version: null },
            status: 200,
          },
        ],
        association: [
          {
            expectedToken: "token-a",
            expectedBody: {
              action: "enable",
              expectedVersion: null,
              subscription: requestSubscription(push("valid")),
            },
            response: { association: "current", version: "retry" },
            status: 200,
          },
        ],
      });
      configureOrderNotificationsDependencies(retryApi.client, async (read) =>
        read("token-a"),
      );
      await store.inspect();
      expect(store).toMatchObject({ state: "off_current", publicKey: vapid });
      await store.enable();
      expect(store.state).toBe("on_current");
    },
  );

  it.each([
    ["R01", "current", "on_current"],
    ["R02 other", "other", "failed_enable"],
    ["R02 none", "none", "failed_enable"],
  ])(
    "%s has one write and one reconciliation",
    async (_id, association, state) => {
      const subscription = push("r");
      install({ current: subscription });
      const api = apiFixture({
        association: [
          {
            expectedToken: "token-a",
            expectedBody: {
              action: "enable",
              expectedVersion: null,
              subscription: requestSubscription(subscription),
            },
            response: rejectLater("lost"),
            status: 200,
          },
        ],
        inspect: [
          {
            expectedToken: "token-a",
            expectedBody: requestSubscription(subscription),
            response: { association, version: "vr" },
            status: 200,
          },
        ],
      });
      configureOrderNotificationsDependencies(api.client, async (read) =>
        read("token-a"),
      );
      const store = session();
      await store.enable();
      expect(api.trace()).toEqual([
        "PUT /push/subscriptions/association token-a",
        "POST /push/subscriptions/inspect token-a",
      ]);
      expect(store.state).toBe(state);
    },
  );

  it("R03 rejects lost write plus inspection without replay", async () => {
    const subscription = push("r03");
    install({ current: subscription });
    const api = apiFixture({
      association: [
        {
          expectedToken: "token-a",
          expectedBody: {
            action: "enable",
            expectedVersion: null,
            subscription: requestSubscription(subscription),
          },
          response: rejectLater("lost"),
          status: 200,
        },
      ],
      inspect: [
        {
          expectedToken: "token-a",
          expectedBody: requestSubscription(subscription),
          response: rejectLater("inspect"),
          status: 200,
        },
      ],
    });
    configureOrderNotificationsDependencies(api.client, async (read) =>
      read("token-a"),
    );
    const store = session();
    await store.enable();
    expect(store.state).toBe("failed_enable");
    expect(api.trace()).toEqual([
      "PUT /push/subscriptions/association token-a",
      "POST /push/subscriptions/inspect token-a",
    ]);
  });

  it("R04 transfer reconciliation never replays transfer", async () => {
    const subscription = push("r04");
    install({ current: subscription });
    const api = apiFixture({
      publicKey: [
        {
          expectedToken: "token-a",
          expectedBody: undefined,
          response: { publicKey: vapid },
          status: 200,
        },
      ],
      inspect: [
        {
          expectedToken: "token-a",
          expectedBody: requestSubscription(subscription),
          response: { association: "other", version: "v0" },
          status: 200,
        },
        {
          expectedToken: "token-a",
          expectedBody: requestSubscription(subscription),
          response: { association: "current", version: "v1" },
          status: 200,
        },
      ],
      association: [
        {
          expectedToken: "token-a",
          expectedBody: {
            action: "transfer",
            expectedVersion: "v0",
            subscription: requestSubscription(subscription),
          },
          response: rejectLater("lost"),
          status: 200,
        },
      ],
    });
    configureOrderNotificationsDependencies(api.client, async (read) =>
      read("token-a"),
    );
    const store = session();
    await store.inspect();
    await store.enable(true);
    expect(api.trace().filter((call) => call.startsWith("PUT"))).toHaveLength(
      1,
    );
    expect(store.state).toBe("on_current");
  });

  it.each([
    ["permission", "account-b", "token-b"],
    ["permission", null, null],
    ["ready", "account-b", "token-b"],
    ["ready", null, null],
    ["subscribe", "account-b", "token-b"],
    ["subscribe", null, null],
    ["association", "account-b", "token-b"],
    ["association", null, null],
    ["reinspection", "account-b", "token-b"],
    ["reinspection", null, null],
  ] as const)(
    "R05 O03 O04 %s barrier does not publish A into %s",
    async (boundary, nextAccountId, nextToken) => {
      const permission = deferred<NotificationPermission>();
      const ready = deferred<BrowserRegistration>();
      const subscribe = deferred<BrowserSubscription>();
      const association = deferred<unknown>();
      const reinspection = deferred<unknown>();
      const subscription = push(
        `race-${boundary}-${nextAccountId ?? "logout"}`,
      );
      const needsSavedSubscription =
        boundary === "association" || boundary === "reinspection";
      const fixture = install({
        current: needsSavedSubscription ? subscription : null,
        permission: boundary === "permission" ? "default" : "granted",
        ...(boundary === "ready" ? { ready } : {}),
        ...(boundary === "permission"
          ? { steps: { permission } }
          : boundary === "subscribe"
            ? { steps: { subscribe } }
            : {}),
      });
      const api = apiFixture({
        publicKey: needsSavedSubscription
          ? []
          : [
              {
                expectedToken: "token-a",
                expectedBody: undefined,
                response: { publicKey: vapid },
                status: 200,
              },
            ],
        association:
          boundary === "association"
            ? [
                {
                  expectedToken: "token-a",
                  expectedBody: {
                    action: "enable",
                    expectedVersion: null,
                    subscription: requestSubscription(subscription),
                  },
                  response: association.promise,
                  status: 200,
                },
              ]
            : boundary === "reinspection"
              ? [
                  {
                    expectedToken: "token-a",
                    expectedBody: {
                      action: "enable",
                      expectedVersion: null,
                      subscription: requestSubscription(subscription),
                    },
                    response: rejectLater("lost"),
                    status: 200,
                  },
                ]
              : [],
        inspect:
          boundary === "reinspection"
            ? [
                {
                  expectedToken: "token-a",
                  expectedBody: requestSubscription(subscription),
                  response: reinspection.promise,
                  status: 200,
                },
              ]
            : [],
      });
      configureOrderNotificationsDependencies(api.client, async (read) =>
        read("token-a"),
      );
      const store = session();
      const pending = store.enable();
      try {
        if (boundary === "permission") await permission.entered;
        else if (boundary === "ready") await ready.entered;
        else if (boundary === "subscribe") await subscribe.entered;
        else if (boundary === "association")
          await vi.waitFor(() =>
            expect(
              api.trace().filter((call) => call.startsWith("PUT")),
            ).toHaveLength(1),
          );
        else
          await vi.waitFor(() =>
            expect(
              api.trace().filter((call) => call.startsWith("POST")),
            ).toHaveLength(1),
          );

        store.setSession(nextAccountId, nextToken);
        if (boundary === "permission") permission.resolve("granted");
        else if (boundary === "ready")
          ready.resolve({
            pushManager: {
              getSubscription: fixture.getSubscription,
              subscribe: fixture.subscribe,
            },
          });
        else if (boundary === "subscribe") subscribe.resolve(subscription);
        else if (boundary === "association")
          association.resolve({ association: "current", version: "v-a" });
        else reinspection.resolve({ association: "current", version: "v-a" });
        await pending;
      } finally {
        permission.resolve("granted");
        ready.resolve({
          pushManager: {
            getSubscription: fixture.getSubscription,
            subscribe: fixture.subscribe,
          },
        });
        subscribe.resolve(subscription);
        association.resolve({ association: "current", version: "v-a" });
        reinspection.resolve({ association: "current", version: "v-a" });
        await pending;
      }
      expect(store).toMatchObject({
        accountId: nextAccountId,
        accessToken: nextToken,
        subscription: null,
        version: null,
      });
      expect(api.trace().filter((call) => call.endsWith("token-b"))).toEqual(
        [],
      );

      store.setSession("account-b", "token-b");
      const recoveryFixture = install({ current: null });
      const recoveryApi = apiFixture({
        publicKey: [
          {
            expectedToken: "token-b",
            expectedBody: undefined,
            response: { publicKey: vapid },
            status: 200,
          },
        ],
        association: [
          {
            expectedToken: "token-b",
            expectedBody: {
              action: "enable",
              expectedVersion: null,
              subscription: requestSubscription(push("created")),
            },
            response: { association: "current", version: "v-b" },
            status: 200,
          },
        ],
      });
      configureOrderNotificationsDependencies(
        recoveryApi.client,
        async (read) => read(store.accessToken ?? ""),
      );
      await store.inspect();
      await store.enable();
      expect(store).toMatchObject({
        accountId: "account-b",
        state: "on_current",
        version: "v-b",
      });
      expect(recoveryFixture.subscribe).toHaveBeenCalledTimes(1);
    },
  );

  it.each(["permission", "association"])(
    "O01 duplicate enable while %s waits makes one sequence",
    async (boundary) => {
      const permission = deferred<NotificationPermission>();
      const association = deferred<unknown>();
      const fixture = install({
        current: null,
        permission: boundary === "permission" ? "default" : "granted",
        ...(boundary === "permission" ? { steps: { permission } } : {}),
      });
      const api = apiFixture({
        publicKey: [
          {
            expectedToken: "token-a",
            expectedBody: undefined,
            response: { publicKey: vapid },
            status: 200,
          },
        ],
        association:
          boundary === "permission"
            ? [
                {
                  expectedToken: "token-a",
                  expectedBody: {
                    action: "enable",
                    expectedVersion: null,
                    subscription: requestSubscription(push("created")),
                  },
                  response: { association: "current", version: "v" },
                  status: 200,
                },
              ]
            : [
                {
                  expectedToken: "token-a",
                  expectedBody: {
                    action: "enable",
                    expectedVersion: null,
                    subscription: requestSubscription(push("created")),
                  },
                  response: association.promise,
                  status: 200,
                },
              ],
      });
      configureOrderNotificationsDependencies(api.client, async (read) =>
        read("token-a"),
      );
      const store = session();
      const one = store.enable();
      let two: Promise<void> | undefined;
      try {
        if (boundary === "permission") {
          await permission.entered;
          expect(fixture.requestPermission).toHaveBeenCalledTimes(1);
        } else
          await vi.waitFor(() =>
            expect(
              api.trace().filter((call) => call.startsWith("PUT")),
            ).toHaveLength(1),
          );
        two = store.enable();
        if (boundary === "permission") permission.resolve("granted");
        else association.resolve({ association: "current", version: "v" });
        await Promise.all([one, two]);
        expect(
          api.trace().filter((call) => call.startsWith("PUT")),
        ).toHaveLength(1);
      } finally {
        permission.resolve("granted");
        association.resolve({ association: "current", version: "v" });
        await one;
        if (two !== undefined) await two;
      }
    },
  );

  it("O07 has no invented dialog-close store command", () => {
    const store = session();
    expect("close" in store).toBe(false);
    expect(store.generation).toBe(1);
  });

  it("O02 enable held at association suppresses disable, then a later disable runs", async () => {
    const write = deferred<unknown>();
    const subscription = push("o02");
    install({ current: subscription });
    const api = apiFixture({
      association: [
        {
          expectedToken: "token-a",
          expectedBody: {
            action: "enable",
            expectedVersion: null,
            subscription: requestSubscription(subscription),
          },
          response: write.promise,
          status: 200,
        },
      ],
      deleteAssociation: [
        {
          expectedToken: "token-a",
          expectedBody: {
            expectedVersion: "v-o02",
            subscription: requestSubscription(subscription),
          },
          response: undefined,
          status: 204,
        },
      ],
    });
    configureOrderNotificationsDependencies(api.client, async (read) =>
      read("token-a"),
    );
    const store = session();
    const enabling = store.enable();
    await vi.waitFor(() =>
      expect(api.trace().filter((call) => call.startsWith("PUT"))).toHaveLength(
        1,
      ),
    );
    let disabling: Promise<void> | undefined;
    try {
      await store.disable();
      expect(
        api.trace().filter((call) => call.startsWith("DELETE")),
      ).toHaveLength(0);
      write.resolve({ association: "current", version: "v-o02" });
      await enabling;
      expect(store.operation).toBeNull();
      disabling = store.disable();
      await disabling;
      expect(
        api.trace().filter((call) => call.startsWith("DELETE")),
      ).toHaveLength(1);
      expect(store).toMatchObject({
        state: "off_current",
        subscription: requestSubscription(subscription),
        version: null,
      });
    } finally {
      write.resolve({ association: "current", version: "v-o02" });
      await enabling;
      if (disabling !== undefined) await disabling;
    }
  });

  it("O02 disable held at DELETE suppresses enable, then a later enable runs", async () => {
    const deletion = deferred<unknown>();
    const subscription = push("o02-reverse");
    const { api, store } = await inspectCurrent(subscription, {
      apiPlans: {
        deleteAssociation: [
          {
            expectedToken: "token-a",
            expectedBody: {
              expectedVersion: "v",
              subscription: requestSubscription(subscription),
            },
            response: deletion.promise,
            status: 204,
          },
        ],
        association: [
          {
            expectedToken: "token-a",
            expectedBody: {
              action: "enable",
              expectedVersion: null,
              subscription: requestSubscription(subscription),
            },
            response: { association: "current", version: "v-next" },
            status: 200,
          },
        ],
      },
    });
    const disabling = store.disable();
    try {
      await vi.waitFor(() =>
        expect(
          api.trace().filter((call) => call.startsWith("DELETE")),
        ).toHaveLength(1),
      );
      await store.enable();
      expect(api.trace().filter((call) => call.startsWith("PUT"))).toHaveLength(
        0,
      );
      deletion.resolve(undefined);
      await disabling;
    } finally {
      deletion.resolve(undefined);
      await disabling;
    }
    await store.enable();
    expect(store).toMatchObject({ state: "on_current", version: "v-next" });
  });

  it("O05 pending A unsubscribe prevents B browser work until the original stop settles", async () => {
    const subscription = push("o05");
    const unsubscribe = deferred<boolean>();
    const { api, fixture, store } = await inspectCurrent(subscription, {
      version: "v-a",
      apiPlans: {
        deleteAssociation: [
          {
            expectedToken: "token-a",
            expectedBody: {
              expectedVersion: "v-a",
              subscription: requestSubscription(subscription),
            },
            response: undefined,
            status: 204,
          },
        ],
      },
      browser: { observed: null, steps: { unsubscribe } },
    });
    const stopping = store.disable();
    try {
      await unsubscribe.entered;
      const callsAtBarrier = api.calls.length;
      const browserTraceAtBarrier = [...fixture.trace];
      store.setSession("account-b", "token-b");
      await store.enable();
      await store.inspect();
      expect(api.calls).toHaveLength(callsAtBarrier);
      expect(fixture.trace).toEqual(browserTraceAtBarrier);
      expect(store).toMatchObject({
        state: "checking",
        subscription: null,
        version: null,
      });
    } finally {
      unsubscribe.resolve(true);
      await stopping;
    }
    expect(store.accountId).toBe("account-b");
    expect(store.subscription).toBeNull();
    const recoveryFixture = install({ current: null });
    const recoveryApi = apiFixture({
      publicKey: [
        {
          expectedToken: "token-b",
          expectedBody: undefined,
          response: { publicKey: vapid },
          status: 200,
        },
      ],
      association: [
        {
          expectedToken: "token-b",
          expectedBody: {
            action: "enable",
            expectedVersion: null,
            subscription: requestSubscription(push("created")),
          },
          response: { association: "current", version: "v-b" },
          status: 200,
        },
      ],
    });
    configureOrderNotificationsDependencies(recoveryApi.client, async (read) =>
      read(store.accessToken ?? ""),
    );
    await store.inspect();
    await store.enable();
    expect(recoveryFixture.subscribe).toHaveBeenCalledTimes(1);
    expect(store).toMatchObject({ state: "on_current", version: "v-b" });
  });

  it("O06 unchanged session retains generation and lets one held operation complete", async () => {
    const permission = deferred<NotificationPermission>();
    const fixture = install({
      current: null,
      permission: "default",
      steps: { permission },
    });
    const api = apiFixture({
      publicKey: [
        {
          expectedToken: "token-a",
          expectedBody: undefined,
          response: { publicKey: vapid },
          status: 200,
        },
      ],
      association: [
        {
          expectedToken: "token-a",
          expectedBody: {
            action: "enable",
            expectedVersion: null,
            subscription: requestSubscription(push("created")),
          },
          response: { association: "current", version: "v" },
          status: 200,
        },
      ],
    });
    configureOrderNotificationsDependencies(api.client, async (read) =>
      read("token-a"),
    );
    const store = session();
    const generation = store.generation;
    const enabling = store.enable();
    try {
      await permission.entered;
      expect(fixture.requestPermission).toHaveBeenCalledTimes(1);
      store.setSession("account-a", "token-a");
      expect(store.generation).toBe(generation);
      permission.resolve("granted");
      await enabling;
      expect(store.state).toBe("on_current");
    } finally {
      permission.resolve("granted");
      await enabling;
    }
  });

  it.each([
    ["ready", undefined, "off_current", null],
    ["ready", new Error("delete"), "failed_disable", "v"],
    ["observed", undefined, "off_current", null],
    ["observed", new Error("delete"), "failed_disable", "v"],
  ] as const)(
    "D07 %s boundary failure crosses DELETE outcome",
    async (boundary, deleteReply, state, version) => {
      const subscription = push(`d07-${boundary}`);
      const { api, fixture, setupCalls, store } = await inspectCurrent(
        subscription,
        {
          apiPlans: {
            deleteAssociation: [
              {
                expectedToken: "token-a",
                expectedBody: {
                  expectedVersion: "v",
                  subscription: requestSubscription(subscription),
                },
                response: deleteReply,
                status: 204,
              },
            ],
          },
        },
      );
      if (boundary === "ready") fixture.failReadyOnce();
      else fixture.failObservedGetSubscriptionOnce();
      await store.disable();
      expect(api.calls.slice(setupCalls)).toHaveLength(1);
      expect(store).toMatchObject({
        state,
        subscription: requestSubscription(subscription),
        version,
      });
      expect(fixture.trace.slice(2)).toEqual(
        boundary === "ready"
          ? ["ready"]
          : [
              "ready",
              "getSubscription",
              "unsubscribe",
              "ready",
              "getSubscription",
            ],
      );
    },
  );

  it.each(["delete", "unsubscribe"])(
    "D10 duplicate disable while %s waits does not duplicate the sequence",
    async (boundary) => {
      const deleteGate = deferred<unknown>();
      const unsubscribeGate = deferred<boolean>();
      const subscription = push(`d10-${boundary}`);
      const { api, store } = await inspectCurrent(subscription, {
        apiPlans: {
          deleteAssociation: [
            {
              expectedToken: "token-a",
              expectedBody: {
                expectedVersion: "v",
                subscription: requestSubscription(subscription),
              },
              response: boundary === "delete" ? deleteGate.promise : undefined,
              status: 204,
            },
          ],
        },
        browser: {
          observed: null,
          steps:
            boundary === "unsubscribe"
              ? { unsubscribe: unsubscribeGate }
              : undefined,
        },
      });
      const first = store.disable();
      let second: Promise<void> | undefined;
      try {
        await vi.waitFor(() =>
          expect(
            api.trace().filter((call) => call.startsWith("DELETE")),
          ).toHaveLength(1),
        );
        if (boundary === "unsubscribe") await unsubscribeGate.entered;
        second = store.disable();
        if (boundary === "delete") deleteGate.resolve(undefined);
        else unsubscribeGate.resolve(true);
        await Promise.all([first, second]);
        expect(
          api.trace().filter((call) => call.startsWith("DELETE")),
        ).toHaveLength(1);
        expect(store.operation).toBeNull();
      } finally {
        deleteGate.resolve(undefined);
        unsubscribeGate.resolve(true);
        await first;
        if (second !== undefined) await second;
      }
      install({ current: null });
      const retryApi = apiFixture({
        publicKey: [
          {
            expectedToken: "token-a",
            expectedBody: undefined,
            response: { publicKey: vapid },
            status: 200,
          },
        ],
      });
      configureOrderNotificationsDependencies(retryApi.client, async (read) =>
        read("token-a"),
      );
      await store.inspect();
      expect(store.state).toBe("off_current");
    },
  );

  it.each([
    [
      "D01 delete resolves / unsubscribe true / observed absent",
      undefined,
      Promise.resolve(true),
      null,
      "off_current",
    ],
    [
      "D02 delete rejects / unsubscribe true / observed absent",
      new Error("delete"),
      true,
      null,
      "off_current",
    ],
    [
      "D03 delete resolves / unsubscribe false / observed absent",
      undefined,
      false,
      null,
      "off_current",
    ],
    [
      "D04 delete rejects / unsubscribe false / observed absent",
      new Error("delete"),
      false,
      null,
      "off_current",
    ],
    [
      "D05 delete resolves / unsubscribe true / observed retained",
      undefined,
      true,
      push("retained-a"),
      "off_current",
    ],
    [
      "D01 delete rejects / unsubscribe true / observed retained",
      new Error("delete"),
      true,
      push("retained-b"),
      "failed_disable",
    ],
    [
      "D02 delete resolves / unsubscribe false / observed retained",
      undefined,
      false,
      push("retained-c"),
      "off_current",
    ],
    [
      "D03 delete rejects / unsubscribe false / observed retained",
      new Error("delete"),
      false,
      push("retained-d"),
      "failed_disable",
    ],
    [
      "D04 delete resolves / unsubscribe throws",
      undefined,
      "throws",
      undefined,
      "off_current",
    ],
    [
      "D05 delete rejects / unsubscribe throws",
      new Error("delete"),
      "throws",
      undefined,
      "failed_disable",
    ],
  ])(
    "%s uses inspected stop state",
    async (_id, deleteReply, unsubscribe, observed, state) => {
      const subscription = push(`stop-${_id}`);
      const { api, fixture, setupCalls, store } = await inspectCurrent(
        subscription,
        {
          apiPlans: {
            deleteAssociation: [
              {
                expectedToken: "token-a",
                expectedBody: {
                  expectedVersion: "v",
                  subscription: requestSubscription(subscription),
                },
                response: deleteReply,
                status: 204,
              },
            ],
          },
          browser: {
            observed,
            ...(unsubscribe === "throws"
              ? {}
              : { unsubscribe: Promise.resolve(unsubscribe) }),
          },
        },
      );
      if (unsubscribe === "throws") fixture.failUnsubscribeOnce();
      await store.disable();
      expect(fixture.unsubscribe).toHaveBeenCalledTimes(1);
      expect(
        api.calls
          .slice(setupCalls)
          .map(({ path, options }) => `${options.method} ${path}`),
      ).toEqual(["DELETE /push/subscriptions/association"]);
      expect(store.state).toBe(state);
      expect(store.version).toBe(state === "failed_disable" ? "v" : null);
      if (observed === null) expect(store.subscription).toBeNull();
      else
        expect(store.subscription).toEqual(requestSubscription(subscription));
      if (unsubscribe === "throws")
        expect(fixture.trace.slice(2)).toEqual([
          "ready",
          "getSubscription",
          "unsubscribe",
        ]);
    },
  );

  it.each([false, true])(
    "D06 inspected capability disappears before disable",
    async (deleteRejects) => {
      const subscription = push("d06");
      const { api, fixture, setupCalls, store } = await inspectCurrent(
        subscription,
        {
          apiPlans: {
            deleteAssociation: [
              {
                expectedToken: "token-a",
                expectedBody: {
                  expectedVersion: "v",
                  subscription: requestSubscription(subscription),
                },
                response: deleteRejects ? new Error("delete") : undefined,
                status: 204,
              },
            ],
          },
        },
      );
      fixture.setCurrent(null);
      await store.disable();
      expect(fixture.unsubscribe).not.toHaveBeenCalled();
      expect(store.state).toBe("off_current");
      expect(store.subscription).toBeNull();
      expect(store.version).toBeNull();
      expect(api.calls.slice(setupCalls)).toHaveLength(1);
    },
  );

  it.each(["absent", "retained"] as const)(
    "D08 foreign stops locally without DELETE when observed is %s",
    async (outcome) => {
      const subscription = push("foreign");
      const { api, store } = await inspectOther(subscription, {
        observed: outcome === "absent" ? null : push("foreign-observed"),
      });
      await store.disable();
      expect(
        api.trace().filter((call) => call.startsWith("DELETE")),
      ).toHaveLength(0);
      expect(store.state).toBe(
        outcome === "absent" ? "off_current" : "failed_disable",
      );
      expect(store.subscription).toEqual(
        outcome === "absent" ? null : requestSubscription(subscription),
      );
      expect(store.version).toBe(outcome === "absent" ? null : "v-other");
    },
  );

  it.each(["absent", "retained"] as const)(
    "D09 anonymous stops locally without DELETE when observed is %s",
    async (outcome) => {
      const subscription = push("anonymous");
      const { api, store } = await inspectAnonymous(subscription, {
        observed: outcome === "absent" ? null : push("anonymous-observed"),
      });
      await store.disable();
      expect(api.trace()).toEqual([]);
      expect(store.state).toBe(
        outcome === "absent" ? "anonymous_off" : "failed_disable",
      );
      expect(store.subscription).toEqual(
        outcome === "absent" ? null : requestSubscription(subscription),
      );
      expect(store.version).toBeNull();
    },
  );
});

function session() {
  const store = useOrderNotificationsStore();
  store.setSession("account-a", "token-a");
  return store;
}

async function inspectCurrent(
  subscription: BrowserSubscription,
  options: {
    apiPlans?: Pick<ApiPlans, "association" | "deleteAssociation">;
    browser?: Omit<Parameters<typeof install>[0], "current">;
    version?: string;
  } = {},
) {
  const version = options.version ?? "v";
  const fixture = install({ ...options.browser, current: subscription });
  const api = apiFixture({
    publicKey: [
      {
        expectedToken: "token-a",
        expectedBody: undefined,
        response: { publicKey: vapid },
        status: 200,
      },
    ],
    inspect: [
      {
        expectedToken: "token-a",
        expectedBody: requestSubscription(subscription),
        response: { association: "current", version },
        status: 200,
      },
    ],
    ...options.apiPlans,
  });
  configureOrderNotificationsDependencies(api.client, async (read) =>
    read("token-a"),
  );
  const store = session();
  await store.inspect();
  expect(store).toMatchObject({
    state: "on_current",
    subscription: requestSubscription(subscription),
    version,
  });
  return { api, fixture, setupCalls: api.calls.length, store };
}

async function inspectOther(
  subscription: BrowserSubscription,
  browser: Omit<Parameters<typeof install>[0], "current"> = {},
) {
  const fixture = install({ ...browser, current: subscription });
  const api = apiFixture({
    publicKey: [
      {
        expectedToken: "token-a",
        expectedBody: undefined,
        response: { publicKey: vapid },
        status: 200,
      },
    ],
    inspect: [
      {
        expectedToken: "token-a",
        expectedBody: requestSubscription(subscription),
        response: { association: "other", version: "v-other" },
        status: 200,
      },
    ],
  });
  configureOrderNotificationsDependencies(api.client, async (read) =>
    read("token-a"),
  );
  const store = session();
  await store.inspect();
  expect(store.state).toBe("other_account");
  return { api, fixture, setupCalls: api.calls.length, store };
}

async function inspectAnonymous(
  subscription: BrowserSubscription,
  browser: Omit<Parameters<typeof install>[0], "current"> = {},
) {
  const fixture = install({ ...browser, current: subscription });
  const api = apiFixture();
  configureOrderNotificationsDependencies(api.client, async (read) =>
    read("token-a"),
  );
  const store = useOrderNotificationsStore();
  await store.inspect();
  expect(store.state).toBe("anonymous_subscription");
  return { api, fixture, setupCalls: api.calls.length, store };
}
function requestSubscription(
  value: Pick<BrowserSubscription, "endpoint" | "keys">,
): PushSubscriptionRequest {
  return { endpoint: value.endpoint, keys: value.keys };
}
function push(id: string, unsubscribe?: () => Promise<boolean>) {
  const keys = { auth: btoa("a".repeat(16)), p256dh: btoa("p".repeat(65)) };
  return {
    endpoint: `https://push.example/${id}`,
    keys,
    getKey: (name: string) =>
      new TextEncoder().encode(
        name === "auth" ? "a".repeat(16) : "p".repeat(65),
      ).buffer,
    unsubscribe: () => unsubscribe?.() ?? Promise.resolve(true),
  };
}
type Deferred<T> = {
  enter: () => void;
  entered: Promise<void>;
  promise: Promise<T>;
  reject: (reason?: unknown) => void;
  resolve: (value: T) => void;
};

type BrowserRegistration = {
  pushManager: {
    getSubscription: () => Promise<BrowserSubscription | null>;
    subscribe: (
      options?: PushSubscriptionOptionsInit,
    ) => Promise<BrowserSubscription>;
  };
};

type BrowserSteps = Partial<{
  getSubscription: Deferred<BrowserSubscription | null>;
  observed: Deferred<BrowserSubscription | null>;
  permission: Deferred<NotificationPermission>;
  subscribe: Deferred<BrowserSubscription>;
  unsubscribe: Deferred<boolean>;
}>;

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  let enter!: () => void;
  let hasEntered = false;
  const entered = new Promise<void>((done) => {
    enter = () => {
      if (hasEntered) return;
      hasEntered = true;
      done();
    };
  });
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { enter, entered, promise, reject, resolve };
}
function rejectLater(message: string): Promise<never> {
  return new Promise((_, reject) =>
    queueMicrotask(() => reject(new Error(message))),
  );
}
function restoreDescriptor(
  target: object,
  property: string,
  descriptor: PropertyDescriptor | undefined,
): void {
  if (descriptor === undefined) Reflect.deleteProperty(target, property);
  else Object.defineProperty(target, property, descriptor);
}
type BrowserSubscription = Omit<ReturnType<typeof push>, "getKey"> & {
  getKey: (name: string) => ArrayBuffer | null;
};

type Reply = unknown | Promise<unknown>;
type ApiPlan = {
  expectedToken: string;
  expectedBody: unknown;
  response: Reply;
  status: number;
};
type ApiPlans = Partial<{
  association: ApiPlan[];
  deleteAssociation: ApiPlan[];
  inspect: ApiPlan[];
  publicKey: ApiPlan[];
}>;

function install(
  options: {
    current?: BrowserSubscription | null;
    observed?: BrowserSubscription | null;
    permission?: NotificationPermission;
    permissionPromise?: Promise<NotificationPermission>;
    supported?: boolean;
    unsubscribe?: Promise<boolean>;
    ready?: Deferred<BrowserRegistration>;
    steps?: BrowserSteps;
  } = {},
) {
  let current = options.current ?? null;
  let observationOverride = options.observed;
  let getSubscriptionFailure: Error | null = null;
  let observedGetSubscriptionFailure: Error | null = null;
  let readyFailure: Error | null = null;
  let subscribeFailure: Error | null = null;
  let unsubscribeFailure: Error | null = null;
  let didUnsubscribe = false;
  const steps = { ...options.steps };
  const trace: string[] = [];
  const unsubscribe = vi.fn(() => {
    trace.push("unsubscribe");
    didUnsubscribe = true;
    if (unsubscribeFailure !== null) {
      const failure = unsubscribeFailure;
      unsubscribeFailure = null;
      return Promise.reject(failure);
    }
    const step = steps.unsubscribe;
    if (step !== undefined) {
      steps.unsubscribe = undefined;
      step.enter();
      return step.promise;
    }
    return options.unsubscribe ?? Promise.resolve(true);
  });
  const currentSubscription = current && {
    ...current,
    unsubscribe,
  };
  current = currentSubscription;
  const getSubscription = vi.fn(() => {
    trace.push("getSubscription");
    if (didUnsubscribe && observedGetSubscriptionFailure !== null) {
      const failure = observedGetSubscriptionFailure;
      observedGetSubscriptionFailure = null;
      return Promise.reject(failure);
    }
    if (getSubscriptionFailure !== null) {
      const failure = getSubscriptionFailure;
      getSubscriptionFailure = null;
      return Promise.reject(failure);
    }
    const step =
      didUnsubscribe && steps.observed !== undefined
        ? steps.observed
        : !didUnsubscribe
          ? steps.getSubscription
          : undefined;
    if (step !== undefined) {
      if (didUnsubscribe) steps.observed = undefined;
      else steps.getSubscription = undefined;
      step.enter();
      return step.promise;
    }
    if (didUnsubscribe && observationOverride !== undefined) {
      const observed = observationOverride;
      observationOverride = undefined;
      return Promise.resolve(observed);
    }
    return Promise.resolve(current);
  });
  const subscribe = vi.fn(() => {
    trace.push("subscribe");
    if (subscribeFailure !== null) {
      const failure = subscribeFailure;
      subscribeFailure = null;
      return Promise.reject(failure);
    }
    if (steps.subscribe !== undefined) {
      const step = steps.subscribe;
      steps.subscribe = undefined;
      step.enter();
      return step.promise;
    }
    const created = push("created", unsubscribe);
    current = created;
    return Promise.resolve(created);
  });
  const ready: Deferred<BrowserRegistration> =
    options.ready ?? deferred<BrowserRegistration>();
  if (options.supported !== false) {
    const requestPermission = vi.fn(() => {
      trace.push("requestPermission");
      if (steps.permission !== undefined) {
        const step = steps.permission;
        steps.permission = undefined;
        step.enter();
        return step.promise;
      }
      return (
        options.permissionPromise ??
        Promise.resolve(options.permission ?? "granted")
      );
    });
    Reflect.set(window, "Notification", {
      permission: options.permission ?? "granted",
      requestPermission,
    });
    Reflect.set(window, "PushManager", class {});
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        get ready() {
          trace.push("ready");
          if (readyFailure !== null) {
            const failure = readyFailure;
            readyFailure = null;
            return Promise.reject(failure);
          }
          ready.enter();
          return ready.promise;
        },
      },
    });
    if (options.ready === undefined)
      ready.resolve({ pushManager: { getSubscription, subscribe } });
  }
  return {
    getSubscription,
    failGetSubscriptionOnce: () => {
      getSubscriptionFailure = new Error("subscription");
    },
    failObservedGetSubscriptionOnce: () => {
      observedGetSubscriptionFailure = new Error("observation");
    },
    failReadyOnce: () => {
      readyFailure = new Error("ready");
    },
    failSubscribeOnce: () => {
      subscribeFailure = new Error("subscribe");
    },
    failUnsubscribeOnce: () => {
      unsubscribeFailure = new Error("unsubscribe");
    },
    ready,
    requestPermission:
      options.supported === false
        ? vi.fn()
        : (window.Notification.requestPermission as ReturnType<typeof vi.fn>),
    subscribe,
    setCurrent: (value: BrowserSubscription | null) => {
      current = value;
    },
    trace,
    unsubscribe,
  };
}
function apiFixture(plans: ApiPlans = {}, registerForAfterEach = true) {
  const routes = {
    "DELETE /push/subscriptions/association": [
      ...(plans.deleteAssociation ?? []),
    ],
    "GET /push/public-key": [...(plans.publicKey ?? [])],
    "POST /push/subscriptions/inspect": [...(plans.inspect ?? [])],
    "PUT /push/subscriptions/association": [...(plans.association ?? [])],
  };
  const calls: Array<{ path: string; options: RequestInit }> = [];
  const violations: string[] = [];
  const failFixture = (message: string): never => {
    violations.push(message);
    throw new Error(message);
  };
  const assertConsumed = () => {
    if (violations.length > 0) throw new Error(violations.join("\n"));
    expect(Object.values(routes).flat()).toHaveLength(0);
  };
  const client = new ApiClient({
    baseUrl: "https://api.example.test/api/v2",
    fetcher: async (url, options) => {
      const path = new URL(
        typeof url === "string" ? url : url.toString(),
      ).pathname.replace("/api/v2", "");
      const request = `${options?.method ?? "GET"} ${path}`;
      calls.push({ path, options: options ?? {} });
      const route = routes[request as keyof typeof routes];
      if (route === undefined)
        failFixture(`Unexpected notification API request: ${request}`);
      if (route.length === 0)
        failFixture(`No planned notification API response: ${request}`);
      const plan = route[0];
      if (plan === undefined)
        failFixture(`No planned notification API response: ${request}`);
      const authorization = (
        options?.headers as Record<string, string> | undefined
      )?.authorization;
      if (authorization !== `Bearer ${plan.expectedToken}`)
        failFixture(
          `Unexpected notification API credential for ${request}: ${authorization}`,
        );
      const body =
        options?.body === undefined
          ? undefined
          : JSON.parse(String(options.body));
      try {
        expect(body).toEqual(plan.expectedBody);
      } catch {
        failFixture(`Unexpected notification API body for ${request}`);
      }
      route.shift();
      const reply = await plan.response;
      if (reply instanceof Error) throw reply;
      return plan.status === 204
        ? new Response(null, { status: plan.status })
        : new Response(JSON.stringify(reply), { status: plan.status });
    },
  });
  const fixture = {
    assertConsumed,
    calls,
    client,
    trace: () =>
      calls.map(({ path, options }) =>
        `${options.method ?? "GET"} ${path} ${(options.headers as Record<string, string> | undefined)?.authorization?.replace("Bearer ", "") ?? ""}`.trim(),
      ),
    violations,
  };
  if (registerForAfterEach) apiFixtures.push(fixture);
  return fixture;
}
