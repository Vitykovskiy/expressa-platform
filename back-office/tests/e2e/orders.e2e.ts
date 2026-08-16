import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

import {
  ordersAccessTokenSecret,
  ordersBackendOrigin,
  ordersBackendReadyUrl,
  ordersBackOfficeOrigin,
  ordersCategoryName,
  ordersCustomerPhonePrefix,
  ordersDatabaseUrl,
  ordersDevelopmentOtp,
  ordersFrontendOrigin,
  ordersOtpPepper,
  ordersProductName,
  ordersStaffPhonePrefix,
  ordersVapidPrivateKey,
  ordersVapidPublicKey,
  ordersVapidSubject,
} from "./orders.e2e.constants";
import type { AuthAccess, OrdersPage } from "./orders.e2e.types";

test("Chromium подтверждает полный жизненный цикл заказа", async ({
  browser,
}) => {
  const customerContext = await browser.newContext();
  const staffContext = await browser.newContext();
  const customerPage = await customerContext.newPage();
  const staffPage = await staffContext.newPage();
  const staffPhone = phone(ordersStaffPhonePrefix);

  try {
    await proxyBackOfficeApi(staffPage);
    createStaff(staffPhone);
    const {
      accessToken: customerToken,
      orderId,
      orderNumber,
    } = await createCustomerOrder(customerPage);

    const customerTransition = await customerPage.request.post(
      `${ordersBackendOrigin}/api/v1/backoffice/orders/${orderId}/accept`,
      { headers: { authorization: `Bearer ${customerToken}` } },
    );
    expect(customerTransition.status()).toBe(403);

    const staffToken = await loginStaff(staffPage, staffPhone);
    const card = staffPage.locator(".order-card", { hasText: orderNumber });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: "Открыть детали" }).click();
    await expect(card.getByLabel(`Детали заказа ${orderNumber}`)).toContainText(
      ordersProductName,
    );
    await expect(card.locator(".order-card__events li")).toHaveCount(0);

    const invalidIssue = await staffPage.request.post(
      `${ordersBackendOrigin}/api/v1/backoffice/orders/${orderId}/issue`,
      { headers: { authorization: `Bearer ${staffToken}` } },
    );
    expect(invalidIssue.status()).toBe(409);
    await expect(card.locator(".order-card__stage")).toHaveText("Новый");

    await transition(staffPage, card, "Принять заказ", "Принят", 1);
    await transition(staffPage, card, "Начать приготовление", "Готовится", 2);
    await transition(staffPage, card, "Отметить готовым", "Готов к выдаче", 3);

    const deniedIssue = await customerPage.request.post(
      `${ordersBackendOrigin}/api/v1/backoffice/orders/${orderId}/issue`,
      { headers: { authorization: `Bearer ${customerToken}` } },
    );
    expect(deniedIssue.status()).toBe(403);
    await staffPage.getByRole("button", { name: "Обновить" }).click();
    await expect(card.locator(".order-card__stage")).toHaveText(
      "Готов к выдаче",
    );
    await expect(card.locator(".order-card__events li")).toHaveCount(3);

    await transition(staffPage, card, "Выдать заказ", "Выдан", 4);
    await expect(
      card.getByRole("button", { name: "Выдать заказ" }),
    ).toHaveCount(0);
  } finally {
    await customerContext.close();
    await staffContext.close();
  }
});

test("закрытый intake сохраняет меню и выдачу существующего заказа", async ({
  browser,
}) => {
  const customerContext = await browser.newContext();
  const staffContext = await browser.newContext();
  const customerPage = await customerContext.newPage();
  const menuPage = await customerContext.newPage();
  const staffPage = await staffContext.newPage();
  const staffPhone = phone(ordersStaffPhonePrefix);

  try {
    await proxyBackOfficeApi(staffPage);
    createStaff(staffPhone);
    const { orderId } = await createCustomerOrder(customerPage);
    await openCustomerCart(customerPage);

    const staffToken = await loginStaff(staffPage, staffPhone);
    await setIntake(staffPage, false);

    await menuPage.goto(ordersFrontendOrigin);
    await menuPage.getByRole("button", { name: ordersCategoryName }).click();
    await expect(
      menuPage.getByRole("button", { name: ordersProductName }),
    ).toBeVisible();

    const closedOrder = customerPage.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        new URL(response.url()).pathname === "/api/v1/orders",
    );
    await customerPage.getByRole("button", { name: "Оформить заказ" }).click();
    const closedResponse = await closedOrder;
    expect(closedResponse.status()).toBe(400);
    await expect(closedResponse.json()).resolves.toMatchObject({
      code: "ORDER_INTAKE_CLOSED",
    });
    await expect(
      customerPage.getByText("Приём новых заказов сейчас закрыт."),
    ).toBeVisible();

    await transitionRequest(staffPage, staffToken, orderId, "accept");
    await transitionRequest(staffPage, staffToken, orderId, "start-preparing");
    await transitionRequest(staffPage, staffToken, orderId, "mark-ready");
    await transitionRequest(staffPage, staffToken, orderId, "issue");

    await setIntake(staffPage, true);
    await customerPage.reload();
    await expect(
      customerPage.getByRole("heading", { name: "Корзина" }),
    ).toBeVisible();
    const reopenedOrder = customerPage.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        new URL(response.url()).pathname === "/api/v1/orders",
    );
    await customerPage.getByRole("button", { name: "Оформить заказ" }).click();
    expect((await reopenedOrder).status()).toBe(201);
    await expect(customerPage).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);
    await expect(customerPage).not.toHaveURL(new RegExp(`/orders/${orderId}$`));
  } finally {
    await customerContext.close();
    await staffContext.close();
  }
});

async function createCustomerOrder(page: OrdersPage): Promise<{
  accessToken: string;
  orderId: string;
  orderNumber: string;
}> {
  await expect((await page.request.get(ordersBackendReadyUrl)).ok()).toBe(true);
  await page.goto(ordersFrontendOrigin);
  await page.getByRole("button", { name: ordersCategoryName }).click();
  await page.getByRole("button", { name: ordersProductName }).click();
  await page.getByRole("button", { name: /M · 320 ₽/ }).click();
  await page.getByRole("button", { name: /Добавить/ }).click();
  await page.getByRole("link", { name: /Корзина/ }).click();
  await expect(page.locator(".cart-screen__payment")).toBeVisible();

  await page.getByRole("button", { name: "Оформить заказ" }).click();
  const accessToken = await loginCustomer(
    page,
    phone(ordersCustomerPhonePrefix),
  );
  await page.getByRole("button", { name: "Оформить заказ" }).click();
  const heading = page.getByRole("heading", { name: /Заказ №/ });
  await expect(heading).toBeVisible();
  const orderNumber = (await heading.textContent())?.replace("Заказ №", "");
  const orderId = page.url().match(/\/orders\/([0-9a-f-]{36})$/i)?.[1];
  if (orderNumber === undefined || orderNumber === "" || orderId === undefined)
    throw new Error("Заказ не содержит номера или идентификатора.");

  return { accessToken, orderId, orderNumber };
}

async function openCustomerCart(page: OrdersPage): Promise<void> {
  await page.goto(ordersFrontendOrigin);
  await page.getByRole("button", { name: ordersCategoryName }).click();
  await page.getByRole("button", { name: ordersProductName }).click();
  await page.getByRole("button", { name: /M · 320 ₽/ }).click();
  await page.getByRole("button", { name: "Добавить" }).click();
  await page.getByRole("link", { name: /Корзина/ }).click();
}

async function loginCustomer(
  page: OrdersPage,
  phoneNumber: string,
): Promise<string> {
  await page.getByLabel("Номер телефона").fill(phoneNumber);
  await page.getByRole("button", { name: "Отправить код" }).click();
  const verified = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/auth/otp/verify") &&
      response.status() === 200,
  );
  await page.getByLabel("Код из сообщения").fill(ordersDevelopmentOtp);
  await page.getByRole("button", { name: "Подтвердить" }).click();
  return accessToken(await verified);
}

async function loginStaff(
  page: OrdersPage,
  phoneNumber: string,
): Promise<string> {
  await page.goto(`${ordersBackOfficeOrigin}/login`);
  await page.getByLabel("Телефон").fill(phoneNumber);
  await page.getByRole("button", { name: "Отправить код" }).click();
  const verified = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/auth/otp/verify") &&
      response.status() === 200,
  );
  await page.getByLabel("Код из сообщения").fill(ordersDevelopmentOtp);
  await page.getByRole("button", { name: "Подтвердить" }).click();
  await expect(
    page.getByRole("heading", { name: "Очередь заказов" }),
  ).toBeVisible();
  return accessToken(await verified);
}

async function proxyBackOfficeApi(page: OrdersPage): Promise<void> {
  await page.route(`${ordersBackOfficeOrigin}/api/v1/**`, async (route) => {
    const requestUrl = new URL(route.request().url());
    const response = await route.fetch({
      url: `${ordersBackendOrigin}${requestUrl.pathname}${requestUrl.search}`,
    });
    await route.fulfill({ response });
  });
}

async function accessToken(
  response: Awaited<ReturnType<OrdersPage["waitForResponse"]>>,
): Promise<string> {
  const value: unknown = await response.json();
  if (
    typeof value !== "object" ||
    value === null ||
    !("accessToken" in value) ||
    typeof value.accessToken !== "string" ||
    value.accessToken === ""
  )
    throw new Error("Ответ OTP не содержит access token.");
  return (value as AuthAccess).accessToken;
}

async function transition(
  page: OrdersPage,
  card: ReturnType<OrdersPage["locator"]>,
  action: string,
  stage: string,
  eventCount: number,
): Promise<void> {
  const [response] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.request().method() === "POST" &&
        /\/api\/v1\/backoffice\/orders\/.+\/(accept|start-preparing|mark-ready|issue)$/.test(
          new URL(candidate.url()).pathname,
        ),
    ),
    card.getByRole("button", { name: action }).click(),
  ]);
  expect(response.status()).toBe(200);
  await expect(card.locator(".order-card__stage")).toHaveText(stage);
  await expect(card.locator(".order-card__events li")).toHaveCount(eventCount);
}

async function setIntake(
  page: OrdersPage,
  acceptsNewOrders: boolean,
): Promise<void> {
  const intake = page.getByRole("switch", { name: "Приём новых заказов" });
  if (!(await intake.isVisible())) {
    await page.getByRole("button", { name: "Доступность" }).click();
  }
  await expect(intake).toHaveAttribute(
    "aria-checked",
    String(!acceptsNewOrders),
  );
  const response = page.waitForResponse(
    (candidate) =>
      candidate.request().method() === "PATCH" &&
      new URL(candidate.url()).pathname === "/api/v1/backoffice/service/intake",
  );
  await intake.click();
  const confirmed = await response;
  expect(confirmed.status()).toBe(200);
  await expect(confirmed.json()).resolves.toMatchObject({ acceptsNewOrders });
  await expect(intake).toHaveAttribute(
    "aria-checked",
    String(acceptsNewOrders),
  );
}

async function transitionRequest(
  page: OrdersPage,
  accessToken: string,
  orderId: string,
  transition: "accept" | "start-preparing" | "mark-ready" | "issue",
): Promise<void> {
  const response = await page.request.post(
    `${ordersBackendOrigin}/api/v1/backoffice/orders/${orderId}/${transition}`,
    { headers: { authorization: `Bearer ${accessToken}` } },
  );
  expect(response.status()).toBe(200);
}

function createStaff(phoneNumber: string): void {
  execFileSync(
    "npm",
    [
      "--prefix",
      "../backend",
      "run",
      "staff",
      "--",
      "upsert",
      "--phone",
      phoneNumber,
      "--role",
      "barista",
    ],
    {
      env: {
        ...process.env,
        AUTH_ACCESS_TOKEN_SECRET: ordersAccessTokenSecret,
        AUTH_DEVELOPMENT_OTP: ordersDevelopmentOtp,
        AUTH_OTP_PEPPER: ordersOtpPepper,
        CORS_ORIGINS: `${ordersFrontendOrigin},${ordersBackOfficeOrigin}`,
        DATABASE_URL: ordersDatabaseUrl,
        NODE_ENV: "local",
        PORT: "3002",
        VAPID_PRIVATE_KEY: ordersVapidPrivateKey,
        VAPID_PUBLIC_KEY: ordersVapidPublicKey,
        VAPID_SUBJECT: ordersVapidSubject,
      },
      stdio: "inherit",
    },
  );
}

function phone(prefix: string): string {
  return `${prefix}${randomUUID().replace(/\D/g, "").slice(0, 7).padStart(7, "0")}`;
}
