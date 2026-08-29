import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import {
  pushCategoryName,
  pushDeniedMessage,
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
  expect((await save).status()).toBe(204);
  expect(await readPushState(page)).toMatchObject({ subscribeCalls: 1 });
  await expect(
    page.getByRole("button", { name: "Отключить уведомления" }),
  ).toBeVisible();

  const remove = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === pushSubscriptionRequestPath &&
      response.request().method() === "DELETE",
  );
  await page.getByRole("button", { name: "Отключить уведомления" }).click();
  expect((await remove).status()).toBe(204);
  expect(await readPushState(page)).toMatchObject({ unsubscribeCalls: 1 });
  await expect(page.getByText("Уведомления отключены.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Включить уведомления" }),
  ).toBeVisible();
});

test("запрет browser permission не блокирует экран заказа", async ({
  page,
}) => {
  await installPushBrowser(page, "denied");
  await openCustomerOrder(page);

  await page.getByRole("button", { name: "Включить уведомления" }).click();

  await expect(page.getByText(pushDeniedMessage)).toBeVisible();
  expect(await readPushState(page)).toMatchObject({ subscribeCalls: 1 });
  await expect(page.getByRole("heading", { name: /Заказ №/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Включить уведомления" }),
  ).toBeEnabled();
});

test("ошибка Push API не блокирует экран заказа", async ({ page }) => {
  await installPushBrowser(page, "granted");
  await page.route("**/api/v2/push/subscriptions", async (route) => {
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
  });
  await openCustomerOrder(page);

  await page.getByRole("button", { name: "Включить уведомления" }).click();

  await expect(page.getByText(pushDeniedMessage)).toBeVisible();
  await expect(page.getByRole("heading", { name: /Заказ №/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Включить уведомления" }),
  ).toBeEnabled();
});

test("service worker публикует click route только для UUID заказа", async ({
  page,
}) => {
  await page.goto("/");
  const serviceWorker = await page.request.get("/push-notifications.js");
  const source = await serviceWorker.text();

  expect(serviceWorker.ok()).toBe(true);
  expect(source).toContain("notificationclick");
  expect(source).toContain(
    `/orders/${pushUuid}`.replace(pushUuid, "${r.orderId}"),
  );
  expect(source).toContain("^[0-9a-f]{8}");
  expect(source).not.toContain("openWindow(r.notification.data)");
});

async function openCustomerOrder(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: pushCategoryName }).click();
  await page.getByRole("button", { name: pushProductName }).click();
  await page.getByRole("button", { name: /M · 320 ₽/ }).click();
  await page.getByRole("button", { name: /Добавить/ }).click();
  await page.getByRole("link", { name: /Корзина/ }).click();
  await page.getByRole("button", { name: "Оформить заказ" }).click();
  await page
    .getByLabel("Номер телефона")
    .fill(
      `${pushPhonePrefix}${randomUUID().replace(/\D/g, "").slice(0, 7).padStart(7, "0")}`,
    );
  await page.getByRole("button", { name: "Отправить код" }).click();
  await page.getByLabel("Код из сообщения").fill(pushOtp);
  await page
    .locator(".auth-form:visible")
    .getByRole("button", { name: "Подтвердить", exact: true })
    .click();
  await page.getByRole("button", { name: "Оформить заказ" }).click();
  await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: /Заказ №/ })).toBeVisible();
}

async function installPushBrowser(
  page: Page,
  mode: PushBrowserMode,
): Promise<void> {
  await page.addInitScript(
    ({ endpoint, mode }) => {
      const state = {
        getSubscriptionCalls: 0,
        subscribeCalls: 0,
        unsubscribeCalls: 0,
      };
      let subscription: PushSubscription | null = null;
      const pushManager = {
        async getSubscription(): Promise<PushSubscription | null> {
          state.getSubscriptionCalls += 1;
          return subscription;
        },
        async subscribe(): Promise<PushSubscription> {
          state.subscribeCalls += 1;
          if (mode === "denied")
            throw new DOMException("Запрещено", "NotAllowedError");

          subscription = {
            endpoint,
            getKey(name: PushEncryptionKeyName): ArrayBuffer {
              return new Uint8Array(name === "auth" ? [4] : [5]).buffer;
            },
            async unsubscribe(): Promise<boolean> {
              state.unsubscribeCalls += 1;
              subscription = null;
              return true;
            },
          } as PushSubscription;
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
      Object.defineProperty(window, "__expressaPushState", {
        configurable: true,
        value: state,
      });
    },
    { endpoint: pushEndpoint, mode },
  );
}

async function readPushState(page: Page): Promise<PushBrowserState> {
  return page.evaluate(() => {
    const state = (window as Window & { __expressaPushState: PushBrowserState })
      .__expressaPushState;
    return { ...state };
  });
}
