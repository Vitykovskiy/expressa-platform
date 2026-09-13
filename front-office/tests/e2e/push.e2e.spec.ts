import { randomUUID } from "node:crypto";

import { expect, test, type Page, type TestInfo } from "@playwright/test";

import {
  pushCategoryName,
  pushEndpoint,
  pushOtp,
  pushPhonePrefix,
  pushProductName,
  pushSubscriptionRequestPath,
  pushUuid,
} from "./push.e2e.constants";
import type { PushBrowserMode, PushBrowserState } from "./push.e2e.types";

test("push подписка появляется только после явного включения и удаляется по кнопке", async ({
  page,
}) => {
  await installPushBrowser(page, "granted");
  const subscriptionRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === pushSubscriptionRequestPath)
      subscriptionRequests.push(request.method());
  });

  await openCustomerOrder(page);

  expect(await readPushState(page)).toMatchObject({ subscribeCalls: 0 });
  expect(subscriptionRequests).toEqual([]);
  await expect(
    page.getByRole("button", { name: "Включить уведомления" }),
  ).toBeVisible();

  const save = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === pushSubscriptionRequestPath &&
      response.request().method() === "PUT",
  );
  await page.getByRole("button", { name: "Включить уведомления" }).click();
  expect((await save).status()).toBe(200);
  expect(await readPushState(page)).toMatchObject({ subscribeCalls: 1 });
  await page.getByRole("button", { name: "Аккаунт" }).click();
  const reinspection = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname ===
        "/api/v2/push/subscriptions/inspect" &&
      response.request().method() === "POST",
  );
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Отключить на этом устройстве" }),
  ).toBeVisible();
  expect((await reinspection).status()).toBe(200);

  const remove = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === pushSubscriptionRequestPath &&
      response.request().method() === "DELETE",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Отключить на этом устройстве" })
    .click();
  expect((await remove).status()).toBe(204);
  expect(await readPushState(page)).toMatchObject({ unsubscribeCalls: 1 });
  await expect(
    page.getByText("Не включены для этого аккаунта на этом устройстве."),
  ).toBeVisible();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Включить уведомления" }),
  ).toBeVisible();
});

test("запрет browser permission не блокирует экран заказа", async ({
  page,
}) => {
  await installPushBrowser(page, "denied");
  await openCustomerOrder(page);
  await expect(page.getByRole("heading", { name: "Оформлен" })).toBeVisible();

  await page.getByRole("button", { name: "Аккаунт" }).click();
  await expect(
    page.getByText(
      "Уведомления запрещены в настройках устройства или браузера.",
    ),
  ).toBeVisible();
  expect(await readPushState(page)).toMatchObject({ subscribeCalls: 0 });
  await expect(
    page.getByRole("button", { name: "Проверить снова" }),
  ).toBeEnabled();
});

test("ошибка Push API не блокирует экран заказа", async ({
  page,
}, testInfo) => {
  await installPushBrowser(page, "granted");
  await page.route(
    "**/api/v2/push/subscriptions/association",
    async (route) => {
      if (route.request().method() !== "PUT") return route.continue();

      await route.fulfill({
        body: JSON.stringify({
          code: "PUSH_UNAVAILABLE",
          details: null,
          message: "Push временно недоступен.",
          requestId: null,
        }),
        contentType: "application/json",
        status: 503,
      });
    },
  );
  await openCustomerOrder(page);

  await page.getByRole("button", { name: "Включить уведомления" }).click();

  await expect(
    page.getByText("Не удалось включить уведомления. Попробуйте ещё раз."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Оформлен" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Включить уведомления" }),
  ).toBeEnabled();
  await screenshot(page, testInfo, "enable-error-order");
});

test("Account dialog closes with Escape while inspection is pending", async ({
  page,
}, testInfo) => {
  await installPushBrowser(page, "granted");
  await openCustomerOrder(page);
  let releaseInspection!: () => void;
  const inspectionBlocked = new Promise<void>((resolve) => {
    releaseInspection = resolve;
  });
  await page.route("**/api/v2/push/public-key", async (route) => {
    await inspectionBlocked;
    await route.continue();
  });
  await openAccount(page);
  await expect(page.getByText("Проверяем уведомления…")).toBeVisible();
  await screenshot(page, testInfo, "checking-dialog");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Аккаунт" })).toBeHidden();
  releaseInspection();
  await expect(page.getByRole("heading", { name: "Аккаунт" })).toBeHidden();
});

test("service worker activates updates only after SKIP_WAITING and publishes click route only for UUID orders", async ({
  page,
}) => {
  await page.goto("/");
  const serviceWorker = await page.request.get("/push-notifications.js");
  const source = await serviceWorker.text();

  expect(serviceWorker.ok()).toBe(true);
  expect(source).toContain("SKIP_WAITING");
  expect(source).toContain("skipWaiting()");
  expect(source).toContain("clients.claim()");
  expect(source).not.toContain("&&(self.skipWaiting()");
  expect(source).toContain("notificationclick");
  expect(source).toContain(
    `/orders/${pushUuid}`.replace(pushUuid, "${r.orderId}"),
  );
  expect(source).toContain("^[0-9a-f]{8}");
  expect(source).not.toContain("openWindow(r.notification.data)");
});

test("first visible invitation is one-time, keeps an explicit choice and Account remains available", async ({
  page,
}, testInfo) => {
  await installPushBrowser(page, "granted");
  await openCustomerOrder(page);

  await expect(
    page.getByRole("heading", { name: "Уведомления о заказах" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Не сейчас" })).toBeVisible();
  await screenshot(page, testInfo, "invitation-visible");
  await page.getByRole("button", { name: "Не сейчас" }).click();
  await expect(page.getByRole("button", { name: "Не сейчас" })).toBeHidden();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Оформлен" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Не сейчас" })).toBeHidden();
  await openAccount(page);
  await expect(
    page.getByText("Не включены для этого аккаунта на этом устройстве."),
  ).toBeVisible();
  await screenshot(page, testInfo, "account-off-current");
});

test("invitation storage failure suppresses only the automatic prompt, not the Account control", async ({
  page,
}, testInfo) => {
  await installPushBrowser(page, "granted");
  await page.addInitScript(() => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("expressa.notification-invitation.v1:"))
        throw new DOMException("storage unavailable", "QuotaExceededError");
      return setItem.call(this, key, value);
    };
  });
  await openCustomerOrder(page);

  await expect(page.getByRole("button", { name: "Не сейчас" })).toBeHidden();
  await openAccount(page);
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Включить уведомления" }),
  ).toBeVisible();
  await screenshot(page, testInfo, "storage-failure-account-control");
});

test("Account enable records the settings choice and suppresses a later order invitation", async ({
  page,
}) => {
  await installPushBrowser(page, "granted");
  await openCustomerOrder(page);
  await openAccount(page);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Включить уведомления" })
    .click();
  await expect(
    page.getByText("Включены для этого аккаунта на этом устройстве."),
  ).toBeVisible();
  await closeAccount(page);
  await expect(page.getByRole("button", { name: "Не сейчас" })).toBeHidden();
  await page.reload();
  await expect(page.getByRole("button", { name: "Не сейчас" })).toBeHidden();
});

test("logout failure is customer-facing and its retry succeeds", async ({
  page,
}) => {
  await installPushBrowser(page, "granted");
  await openCustomerOrder(page);
  let failed = false;
  await page.route("**/api/v2/auth/logout", async (route) => {
    if (failed) return route.continue();
    failed = true;
    await route.fulfill({
      body: JSON.stringify({
        code: "LOGOUT_UNAVAILABLE",
        details: null,
        message: "logout unavailable",
        requestId: null,
      }),
      contentType: "application/json",
      status: 503,
    });
  });
  await openAccount(page);
  await page.getByRole("button", { name: "Выйти из аккаунта" }).click();
  await expect(
    page.getByText("Не удалось выйти из аккаунта. Попробуйте ещё раз."),
  ).toBeVisible();
  await expect(page.getByText("logout unavailable")).toHaveCount(0);
  await page.getByRole("button", { name: "Выйти из аккаунта" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("unsupported notification capability keeps an explicit dialog state and focus", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(window, "PushManager");
  });
  await page.goto("/");
  await openAccount(page);
  await expect(
    page.getByText("Уведомления недоступны в этом браузере."),
  ).toBeVisible();
  const close = page.getByRole("button", {
    name: "Закрыть настройки аккаунта",
  });
  await close.focus();
  await expect(close).toBeFocused();
  await close.click();
  await expect(page.getByRole("heading", { name: "Аккаунт" })).toBeHidden();
});

test("inspection and stop failures keep explicit dialog states and focus", async ({
  page,
}) => {
  await installPushBrowser(page, "unsubscribe-fails");
  await page.route("**/api/v2/push/public-key", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        code: "INSPECT_UNAVAILABLE",
        details: null,
        message: "inspection unavailable",
        requestId: null,
      }),
      contentType: "application/json",
      status: 503,
    });
  });
  await openCustomerOrder(page);
  await openAccount(page);
  await expect(
    page.getByText("Не удалось проверить уведомления. Попробуйте ещё раз."),
  ).toBeVisible();
  const retryInspection = page.getByRole("button", {
    name: "Повторить проверку",
  });
  await retryInspection.focus();
  await expect(retryInspection).toBeFocused();
  await page.unroute("**/api/v2/push/public-key");
  await closeAccount(page);
  await openCustomerOrder(page);
  await page.getByRole("button", { name: "Включить уведомления" }).click();
  await openAccount(page);
  await page.route(
    "**/api/v2/push/subscriptions/association",
    async (route) => {
      if (route.request().method() !== "DELETE") return route.continue();
      await route.fulfill({
        body: JSON.stringify({
          code: "STOP_UNAVAILABLE",
          details: null,
          message: "stop unavailable",
          requestId: null,
        }),
        contentType: "application/json",
        status: 503,
      });
    },
  );
  const stop = page.getByRole("button", {
    name: "Отключить на этом устройстве",
  });
  await stop.click();
  await expect(
    page.getByText(
      "Не удалось отключить уведомления на этом устройстве. Попробуйте ещё раз.",
    ),
  ).toBeVisible();
  await stop.focus();
  await expect(stop).toBeFocused();
});

test("anonymous local stop does not call the authenticated association delete API", async ({
  page,
}) => {
  await installPushBrowser(page, "granted");
  await openCustomerOrder(page);
  await page.getByRole("button", { name: "Включить уведомления" }).click();
  await openAccount(page);
  await page.getByRole("button", { name: "Выйти из аккаунта" }).click();
  await expect(page).toHaveURL(/\/$/);
  await closeAccount(page);
  await openAccount(page);
  await expect(
    page.getByText("На этом устройстве могут приходить уведомления о заказах."),
  ).toBeVisible();
  await page.reload();
  await openAccount(page);
  await expect(
    page.getByText("На этом устройстве могут приходить уведомления о заказах."),
  ).toBeVisible();
  const methods: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === pushSubscriptionRequestPath)
      methods.push(request.method());
  });
  await page
    .getByRole("button", { name: "Отключить на этом устройстве" })
    .click();
  await expect(
    page.getByText("Уведомления на этом устройстве отключены."),
  ).toBeVisible();
  expect(methods).not.toContain("DELETE");
});

test("transient and terminal protected-read outcomes hide protected account data and offer only safe recovery", async ({
  page,
}) => {
  await installPushBrowser(page, "granted");
  const phone = await openCustomerOrder(page);
  let publicKeyCalls = 0;
  await page.route("**/api/v2/push/public-key", async (route) => {
    publicKeyCalls += 1;
    if (publicKeyCalls === 1)
      return route.fulfill({
        body: JSON.stringify({
          code: "PUSH_UNAVAILABLE",
          details: null,
          message: "Unavailable",
          requestId: null,
        }),
        contentType: "application/json",
        status: 503,
      });
    return route.continue();
  });
  await openAccount(page);
  await expect(
    page.getByText("Не удалось проверить уведомления. Попробуйте ещё раз."),
  ).toBeVisible();
  await expect(page.getByText(phone, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Повторить проверку" }).click();
  await expect(
    page.getByText("Не включены для этого аккаунта на этом устройстве."),
  ).toBeVisible();
  expect(publicKeyCalls).toBeGreaterThanOrEqual(2);
  await closeAccount(page);
  await page.unroute("**/api/v2/push/public-key");
  await page.route("**/api/v2/push/public-key", (route) =>
    route.fulfill({
      body: JSON.stringify({
        code: "UNAUTHORIZED",
        details: null,
        message: "Unauthorized",
        requestId: null,
      }),
      contentType: "application/json",
      status: 401,
    }),
  );
  await page.route("**/api/v2/auth/refresh", (route) =>
    route.fulfill({ body: "{}", contentType: "application/json", status: 401 }),
  );
  await openAccount(page);
  await expect(page.getByText("Вы не вошли в аккаунт")).toBeVisible();
  await expect(page.getByText("Unauthorized")).toHaveCount(0);
  await expect(page.getByText(phone)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Войти" })).toBeVisible();
});

test("A logout, B transfer and another A installation use the real association API", async ({
  browser,
}, testInfo) => {
  test.setTimeout(90_000);
  const firstA = await browser.newContext();
  const secondA = await browser.newContext();
  const firstPage = await firstA.newPage();
  const secondPage = await secondA.newPage();
  try {
    await installPushBrowser(firstPage, "granted", `${pushEndpoint}/a-one`);
    const phoneA = await openCustomerOrder(firstPage);
    await firstPage
      .getByRole("button", { name: "Включить уведомления" })
      .click();
    await openAccount(firstPage);
    await expect(
      firstPage.getByText("Включены для этого аккаунта на этом устройстве."),
    ).toBeVisible();
    await firstPage.getByRole("button", { name: "Выйти из аккаунта" }).click();
    await expect(firstPage).toHaveURL(/\/$/);
    await closeAccount(firstPage);
    await openAccount(firstPage);
    await expect(
      firstPage.getByText(
        "На этом устройстве могут приходить уведомления о заказах.",
      ),
    ).toBeVisible();

    await installPushBrowser(secondPage, "granted", `${pushEndpoint}/a-two`);
    await loginCustomer(secondPage, phoneA);
    await openAccount(secondPage);
    await secondPage
      .getByRole("button", { name: "Включить уведомления" })
      .click();
    await expect(
      secondPage.getByText("Включены для этого аккаунта на этом устройстве."),
    ).toBeVisible();

    await closeAccount(firstPage);
    await loginCustomer(firstPage, createPhone());
    await openAccount(firstPage);
    await expect(
      firstPage.getByText(
        "На этом устройстве включены уведомления другого аккаунта.",
      ),
    ).toBeVisible();
    await expect(
      firstPage.getByText(
        "Подключение отключит уведомления прежнего аккаунта на этом устройстве и подключит их к текущему аккаунту.",
      ),
    ).toBeVisible();
    await screenshot(firstPage, testInfo, "other-account-transfer-disclosure");
    const transfer = firstPage.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === pushSubscriptionRequestPath &&
        response.request().method() === "PUT",
    );
    await firstPage
      .getByRole("button", { name: "Подключить к этому аккаунту" })
      .click();
    expect((await transfer).status()).toBe(200);
    await expect(
      firstPage.getByText("Включены для этого аккаунта на этом устройстве."),
    ).toBeVisible();

    await closeAccount(secondPage);
    const secondAReinspection = secondPage.waitForResponse(
      (response) =>
        new URL(response.url()).pathname ===
          "/api/v2/push/subscriptions/inspect" &&
        response.request().method() === "POST",
    );
    await openAccount(secondPage);
    expect((await secondAReinspection).status()).toBe(200);
    await expect(
      secondPage.getByText("Включены для этого аккаунта на этом устройстве."),
    ).toBeVisible();
  } finally {
    await Promise.allSettled([firstA.close(), secondA.close()]);
  }
});

test("lost association response is reinspected after the server commits", async ({
  page,
}) => {
  await installPushBrowser(page, "granted", `${pushEndpoint}/lost-response`);
  await page.route(
    "**/api/v2/push/subscriptions/association",
    async (route) => {
      if (route.request().method() !== "PUT") return route.continue();
      const response = await route.fetch();
      expect(response.status()).toBe(200);
      await route.fulfill({
        body: JSON.stringify({
          code: "RESPONSE_LOST",
          details: null,
          message: "Ответ временно недоступен.",
          requestId: null,
        }),
        contentType: "application/json",
        status: 503,
      });
    },
  );
  await openCustomerOrder(page);
  await page.getByRole("button", { name: "Включить уведомления" }).click();
  await openAccount(page);
  await expect(
    page.getByText("Включены для этого аккаунта на этом устройстве."),
  ).toBeVisible();
});

test("partial stop keeps the honest account-off state when only local unsubscribe fails", async ({
  page,
}, testInfo) => {
  await installPushBrowser(
    page,
    "unsubscribe-fails",
    `${pushEndpoint}/partial-local-failure`,
  );
  await openCustomerOrder(page);
  await page.getByRole("button", { name: "Включить уведомления" }).click();
  await openAccount(page);
  await expect(
    page.getByText("Включены для этого аккаунта на этом устройстве."),
  ).toBeVisible();
  const methods: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === pushSubscriptionRequestPath)
      methods.push(request.method());
  });
  await page
    .getByRole("button", { name: "Отключить на этом устройстве" })
    .click();
  await expect(
    page.getByText("Не включены для этого аккаунта на этом устройстве."),
  ).toBeVisible();
  expect(methods).toContain("DELETE");
  expect(await readPushState(page)).toMatchObject({ unsubscribeCalls: 1 });
  await page.unroute("**/api/v2/push/subscriptions/association");
  await screenshot(page, testInfo, "partial-stop-local-failure-off-current");
});

async function openCustomerOrder(page: Page): Promise<string> {
  await page.goto("/");
  await page.getByRole("button", { name: pushCategoryName }).click();
  await page.getByRole("button", { name: pushProductName }).click();
  await page.getByRole("button", { name: /M · 320 ₽/ }).click();
  await page.getByRole("button", { name: /Добавить/ }).click();
  await page.getByRole("button", { name: /Корзина/ }).click();
  const confirmPhone = page.getByRole("button", {
    name: "Подтвердить телефон",
  });
  const submitOrder = page.getByRole("button", { name: "Оформить заказ" });
  await expect(confirmPhone.or(submitOrder)).toBeVisible();
  const phone = createPhone();
  if (await confirmPhone.isVisible()) {
    await confirmPhone.click();
    await finishLogin(page, phone);
  }
  await submitOrder.click();
  await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: "Оформлен" })).toBeVisible();
  return phone;
}

async function installPushBrowser(
  page: Page,
  mode: PushBrowserMode,
  endpoint = pushEndpoint,
): Promise<void> {
  await page.addInitScript(
    ({ endpoint, mode }) => {
      const state = {
        getSubscriptionCalls: 0,
        subscribeCalls: 0,
        unsubscribeCalls: 0,
      };
      const subscriptionKey = `expressa.e2e-push:${endpoint}`;
      const createSubscription = (): PushSubscription =>
        ({
          endpoint,
          getKey(name: PushEncryptionKeyName): ArrayBuffer {
            const bytes = new Uint8Array(name === "auth" ? 16 : 65);
            if (name === "p256dh") bytes[0] = 4;
            return bytes.buffer;
          },
          async unsubscribe(): Promise<boolean> {
            state.unsubscribeCalls += 1;
            if (mode === "unsubscribe-fails")
              throw new DOMException("unsubscribe unavailable", "AbortError");
            subscription = null;
            localStorage.removeItem(subscriptionKey);
            return true;
          },
        }) as PushSubscription;
      let subscription: PushSubscription | null =
        localStorage.getItem(subscriptionKey) === "active"
          ? createSubscription()
          : null;
      const pushManager = {
        async getSubscription(): Promise<PushSubscription | null> {
          state.getSubscriptionCalls += 1;
          return subscription;
        },
        async subscribe(): Promise<PushSubscription> {
          state.subscribeCalls += 1;
          if (mode === "denied")
            throw new DOMException("Запрещено", "NotAllowedError");

          subscription = createSubscription();
          localStorage.setItem(subscriptionKey, "active");
          return subscription;
        },
      };
      const registration = { pushManager } as ServiceWorkerRegistration;

      Object.defineProperty(navigator, "serviceWorker", {
        configurable: true,
        value: {
          ready: Promise.resolve(registration),
          register: async () => registration,
        },
      });
      Object.defineProperty(window, "PushManager", {
        configurable: true,
        value: class PushManager {},
      });
      Object.defineProperty(window, "Notification", {
        configurable: true,
        value: {
          permission: mode === "denied" ? "denied" : "granted",
          requestPermission: async () =>
            mode === "denied" ? "denied" : "granted",
        },
      });
      Object.defineProperty(window, "__expressaPushState", {
        configurable: true,
        value: state,
      });
    },
    { endpoint, mode },
  );
}

function createPhone(): string {
  return `${pushPhonePrefix}${randomUUID().replace(/\D/g, "").slice(0, 7).padStart(7, "0")}`;
}

async function loginCustomer(page: Page, phone: string): Promise<void> {
  await page.goto("/auth/phone");
  await finishLogin(page, phone);
  await expect(page).toHaveURL(/\/$/);
}

async function finishLogin(page: Page, phone: string): Promise<void> {
  await page.getByLabel("Номер телефона").fill(phone);
  await page.getByRole("button", { name: "Получить код" }).click();
  await page.getByLabel("Шестизначный код из сообщения").fill(pushOtp);
  await page
    .locator(".auth-form:visible")
    .getByRole("button", { name: "Подтвердить", exact: true })
    .click();
}

async function openAccount(page: Page): Promise<void> {
  const heading = page.getByRole("heading", { name: "Аккаунт" });
  if (await heading.isVisible()) return;
  const account = page.getByRole("button", { name: "Аккаунт", exact: true });
  if (!(await account.isVisible()))
    throw new Error("Не найдена постоянная кнопка Аккаунт в header.");
  await page.getByRole("button", { name: "Аккаунт", exact: true }).click();
  await expect(heading).toBeVisible();
}

async function closeAccount(page: Page): Promise<void> {
  const heading = page.getByRole("heading", { name: "Аккаунт" });
  const close = page.getByRole("button", {
    name: "Закрыть настройки аккаунта",
  });
  if (await close.isVisible()) {
    await close.click();
    await expect(heading).toBeHidden();
  }
}

async function screenshot(
  page: Page,
  _testInfo: TestInfo,
  name: string,
): Promise<void> {
  await stabilizeAccountDialog(page);
  await page.screenshot({
    animations: "disabled",
    path: `../.codex/tmp/tasks/expressa-quality-baseline/ui-acceptance/iteration-71-notification-policy-${name}.png`,
  });
}

async function stabilizeAccountDialog(page: Page): Promise<void> {
  const heading = page.getByRole("heading", { name: "Аккаунт" });
  if (!(await heading.isVisible())) return;

  const overlay = page
    .locator(".v-overlay__content:visible")
    .filter({ has: heading });
  await expect(overlay).toHaveCount(1);
  await expect
    .poll(async () =>
      overlay.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const topElement = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          Number(style.opacity) >= 0.99 &&
          Boolean(topElement && element.contains(topElement))
        );
      }),
    )
    .toBe(true);
}

async function readPushState(page: Page): Promise<PushBrowserState> {
  return page.evaluate(() => {
    const state = (window as Window & { __expressaPushState: PushBrowserState })
      .__expressaPushState;
    return { ...state };
  });
}
