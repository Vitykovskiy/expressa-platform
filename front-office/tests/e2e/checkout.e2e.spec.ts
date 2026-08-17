import { randomUUID } from "node:crypto";

import { expect, test, type Locator, type Page } from "@playwright/test";

import { CheckoutDatabase } from "./checkout.database";
import {
  checkoutCategoryName,
  checkoutRepeatPriceDeltaMinor,
  checkoutOtp,
  checkoutPhonePrefix,
  checkoutProductName,
  checkoutResponsiveWidths,
  checkoutViewportHeight,
  checkoutViewports,
} from "./checkout.e2e.constants";
import type { OrderRow } from "./checkout.database.types";
import type { BrowserIssue, CurrentUser } from "./checkout.e2e.types";

test("guest сохраняет конфигурацию через OTP и создаёт один заказ", async ({
  page,
}) => {
  const database = new CheckoutDatabase();
  try {
    const issues = collectBrowserIssues(page);
    await page.setViewportSize({
      width: checkoutViewports[0],
      height: checkoutViewportHeight,
    });
    await page.goto("/");
    await page.getByRole("button", { name: checkoutCategoryName }).click();
    await page.getByRole("button", { name: checkoutProductName }).click();
    await page.getByRole("button", { name: /M · 320 ₽/ }).click();
    await page.getByRole("button", { name: /Добавить/ }).click();
    await page.getByRole("link", { name: /Корзина/ }).click();
    await expect(
      page.getByLabel(`Позиция корзины: ${checkoutProductName}`),
    ).toContainText("Размер M");

    await page.getByRole("button", { name: "Оформить заказ" }).click();
    await expect(page).toHaveURL(/\/auth\/phone\?returnTo=\/cart$/);
    const customerId = await login(
      page,
      `${checkoutPhonePrefix}${randomUUID().replace(/\D/g, "").slice(0, 7).padStart(7, "0")}`,
    );
    await expect(page).toHaveURL(/\/cart$/);
    await expect(
      page.getByLabel(`Позиция корзины: ${checkoutProductName}`),
    ).toContainText("Размер M");

    let idempotencyKey = "";
    page.on("request", (request) => {
      if (request.url().endsWith("/api/v1/orders"))
        idempotencyKey = request.headers()["idempotency-key"] ?? "";
    });
    await page.getByRole("button", { name: "Оформить заказ" }).click();
    await expect(page.getByText("Заказ принят")).toBeVisible();
    await expect(page.getByText(checkoutProductName)).toBeVisible();
    await expect(page.getByText("Размер M")).toBeVisible();
    await expect(page.getByText("+ Обычное молоко")).toBeVisible();
    expect(idempotencyKey).toMatch(/^[0-9a-f-]{36}$/i);
    expect(await database.countOrders(customerId, idempotencyKey)).toBe(1);
    const order = await requireOrder(database, customerId, idempotencyKey);
    await expectOrderPage(page, order);
    await expectNoOverflow(page, checkoutViewports[0]);
    expect(issues()).toEqual([]);
  } finally {
    await database.close();
  }
});

test("изменённая цена требует повторного подтверждения", async ({ page }) => {
  const database = new CheckoutDatabase();
  const state = await database.readState();
  try {
    await page.setViewportSize({
      width: checkoutViewports[0],
      height: checkoutViewportHeight,
    });
    await page.goto("/");
    await page.getByRole("button", { name: checkoutCategoryName }).click();
    await page.getByRole("button", { name: checkoutProductName }).click();
    await page.getByRole("button", { name: /M · 320 ₽/ }).click();
    await page.getByRole("button", { name: /Добавить/ }).click();
    await page.getByRole("link", { name: /Корзина/ }).click();
    await page.getByRole("button", { name: "Оформить заказ" }).click();
    const customerId = await login(
      page,
      `${checkoutPhonePrefix}${randomUUID().replace(/\D/g, "").slice(0, 7).padStart(7, "0")}`,
    );
    const previousTotal = `${state.variantPriceMinor / 100} ₽`;
    const nextPriceMinor = state.variantPriceMinor + 100;
    const nextTotal = `${nextPriceMinor / 100} ₽`;
    await database.setVariantPriceMinor(nextPriceMinor);
    let key = "";
    page.on("request", (request) => {
      if (request.url().endsWith("/api/v1/orders"))
        key = request.headers()["idempotency-key"] ?? "";
    });
    await page.getByRole("button", { name: "Оформить заказ" }).click();
    await expect(page.getByText("Итог изменился")).toBeVisible();
    const changedTotal = page.getByLabel("Изменение итога заказа");
    await expect(
      changedTotal.getByText(previousTotal, { exact: true }),
    ).toBeVisible();
    await expect(
      changedTotal.getByText(nextTotal, { exact: true }),
    ).toBeVisible();
    expect(await database.countOrders(customerId, key)).toBe(0);
    await page.getByRole("button", { name: "Подтвердить новый итог" }).click();
    await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);
    expect(await database.countOrders(customerId, key)).toBe(1);
  } finally {
    await database.restore(state);
    await database.close();
  }
});

test("недоступный вариант выделен и не создаёт заказ", async ({ page }) => {
  const database = new CheckoutDatabase();
  const state = await database.readState();
  try {
    await page.setViewportSize({
      width: checkoutViewports[0],
      height: checkoutViewportHeight,
    });
    await page.goto("/");
    await page.getByRole("button", { name: checkoutCategoryName }).click();
    await page.getByRole("button", { name: checkoutProductName }).click();
    await page.getByRole("button", { name: /M · 320 ₽/ }).click();
    await page.getByRole("button", { name: /Добавить/ }).click();
    await page.getByRole("link", { name: /Корзина/ }).click();
    await page.getByRole("button", { name: "Оформить заказ" }).click();
    const customerId = await login(
      page,
      `${checkoutPhonePrefix}${randomUUID().replace(/\D/g, "").slice(0, 7).padStart(7, "0")}`,
    );
    await database.setVariantAvailable(false);
    let key = "";
    page.on("request", (request) => {
      if (request.url().endsWith("/api/v1/orders"))
        key = request.headers()["idempotency-key"] ?? "";
    });
    await page.getByRole("button", { name: "Оформить заказ" }).click();
    const item = page.getByLabel(`Позиция корзины: ${checkoutProductName}`);
    await expect(item).toContainText("Сейчас недоступно");
    await expect(
      page.getByRole("button", { name: "Оформить заказ" }),
    ).toBeDisabled();
    expect(key).toMatch(/^[0-9a-f-]{36}$/i);
    expect(await database.countOrders(customerId, key)).toBe(0);
  } finally {
    await database.restore(state);
    await database.close();
  }
});

test("закрытый приём заказов блокирует checkout", async ({ browser, page }) => {
  const database = new CheckoutDatabase();
  const intakePage = await browser.newPage();
  const state = await database.readState();
  try {
    await page.setViewportSize({
      width: checkoutViewports[0],
      height: checkoutViewportHeight,
    });
    await openCappuccinoCart(page);
    await page.getByRole("button", { name: "Оформить заказ" }).click();
    const customerId = await login(
      page,
      `${checkoutPhonePrefix}${randomUUID().replace(/\D/g, "").slice(0, 7).padStart(7, "0")}`,
    );
    await database.setAcceptsNewOrders(false);
    await intakePage.setViewportSize({
      width: checkoutViewports[0],
      height: checkoutViewportHeight,
    });
    await openCappuccinoCart(intakePage, new URL("/", page.url()).toString());
    await expect(
      intakePage.getByText("Приём новых заказов сейчас закрыт."),
    ).toBeVisible();
    await expect(
      intakePage.getByRole("button", { name: "Оформить заказ" }),
    ).toBeDisabled();
    expect(await database.countOrdersForCustomer(customerId)).toBe(0);
  } finally {
    await intakePage.close();
    await database.restore(state);
    await database.close();
  }
});

test("повтор после потери ответа сохраняет один заказ и тот же ключ", async ({
  page,
}) => {
  const database = new CheckoutDatabase();
  try {
    await page.setViewportSize({
      width: checkoutViewports[0],
      height: checkoutViewportHeight,
    });
    await openCappuccinoCart(page);
    await page.getByRole("button", { name: "Оформить заказ" }).click();
    const customerId = await login(
      page,
      `${checkoutPhonePrefix}${randomUUID().replace(/\D/g, "").slice(0, 7).padStart(7, "0")}`,
    );

    const idempotencyKeys: string[] = [];
    let dropFirstResponse = true;
    await page.route("**/api/v1/orders", async (route) => {
      idempotencyKeys.push(route.request().headers()["idempotency-key"] ?? "");
      if (!dropFirstResponse) {
        await route.continue();
        return;
      }

      dropFirstResponse = false;
      await route.fetch();
      await route.abort("connectionaborted");
    });

    await page.getByRole("button", { name: "Оформить заказ" }).click();
    await expect(
      page.getByText("Не удалось отправить заказ. Повторите попытку."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Оформить заказ" }).click();
    expect(idempotencyKeys).toHaveLength(2);
    expect(idempotencyKeys[0]).toMatch(/^[0-9a-f-]{36}$/i);
    expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
    expect(await database.countOrders(customerId, idempotencyKeys[0])).toBe(1);
    const replayedOrder = await requireOrder(
      database,
      customerId,
      idempotencyKeys[0],
    );
    await expectOrderPage(page, replayedOrder);

    await openCappuccinoCart(page);
    await page.getByRole("button", { name: "Оформить заказ" }).click();
    await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);

    expect(idempotencyKeys).toHaveLength(3);
    expect(idempotencyKeys[2]).toMatch(/^[0-9a-f-]{36}$/i);
    expect(idempotencyKeys[2]).not.toBe(idempotencyKeys[0]);
    expect(await database.countOrders(customerId, idempotencyKeys[2])).toBe(1);
    const laterOrder = await requireOrder(
      database,
      customerId,
      idempotencyKeys[2],
    );
    await expectOrderPage(page, laterOrder);
  } finally {
    await database.close();
  }
});

test("checkout и заказ не ломают вёрстку на ключевых ширинах", async ({
  page,
}) => {
  const issues = collectConsoleAndPageIssues(page);
  const phone = `${checkoutPhonePrefix}${randomUUID().replace(/\D/g, "").slice(0, 7).padStart(7, "0")}`;
  let authenticated = false;

  for (const width of checkoutResponsiveWidths) {
    await page.setViewportSize({ height: checkoutViewportHeight, width });
    await openCappuccinoCart(page);
    await expectNoOverflow(page, width);
    await expectElementNotOccluded(
      page,
      page.getByLabel(`Позиция корзины: ${checkoutProductName}`),
    );
    await expectElementNotOccluded(
      page,
      page.getByRole("button", { name: "Оформить заказ" }),
    );

    if (!authenticated) {
      await page.getByRole("button", { name: "Оформить заказ" }).click();
      await login(page, phone);
      authenticated = true;
      await expect(page).toHaveURL(/\/cart$/);
    }
    await page.getByRole("button", { name: "Оформить заказ" }).click();
    await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);
    await expectNoOverflow(page, width);
    await expectElementNotOccluded(page, page.getByText("Заказ принят"));
    await expectElementNotOccluded(
      page,
      page.getByText(checkoutProductName, { exact: true }),
    );
  }

  expect(issues()).toEqual([]);
});

test("issued заказ показывает history, скрывает чужой snapshot и повторяет только после подтверждения", async ({
  browser,
  page,
}) => {
  const database = new CheckoutDatabase();
  const state = await database.readState();
  const phone = `${checkoutPhonePrefix}${randomUUID().replace(/\D/g, "").slice(0, 7).padStart(7, "0")}`;
  let historyOrderIds: readonly string[] = [];
  try {
    await openCappuccinoCart(page);
    await page.getByRole("button", { name: "Оформить заказ" }).click();
    const customerId = await login(page, phone);
    let key = "";
    page.on("request", (request) => {
      if (request.url().endsWith("/api/v1/orders"))
        key = request.headers()["idempotency-key"] ?? "";
    });
    await page.getByRole("button", { name: "Оформить заказ" }).click();
    await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);
    await expect(page.getByText("Заказ принят")).toBeVisible();
    const order = await requireOrder(database, customerId, key);
    const detailRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith(`/api/v1/orders/${order.id}`))
        detailRequests.push(request.url());
    });
    await database.setOrderStage(order.id, "ISSUED");
    await expect(page.getByText("Заказ выдан")).toBeVisible({
      timeout: 15_000,
    });
    const requestsAfterIssue = detailRequests.length;
    expect(requestsAfterIssue).toBeGreaterThan(0);
    await page.waitForTimeout(11_000);
    expect(detailRequests).toHaveLength(requestsAfterIssue);

    const history = await database.createIssuedHistory(customerId, order.id);
    historyOrderIds = history.map((historyOrder) => historyOrder.id);

    await page.goto("/orders");
    await expect(page.getByRole("link", { name: "Открыть заказ" })).toHaveCount(
      20,
    );
    await page.getByRole("button", { name: "Показать ещё" }).click();
    await expect(page.getByRole("link", { name: "Открыть заказ" })).toHaveCount(
      21,
    );
    const historyLinks = await page
      .getByRole("link", { name: "Открыть заказ" })
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    const historyIds = historyLinks.map((link) => {
      if (link === null || !link.startsWith("/orders/"))
        throw new Error("История заказа содержит некорректную ссылку.");
      return link.slice("/orders/".length);
    });
    expect(historyIds).toHaveLength(new Set(historyIds).size);
    expect(new Set(historyIds)).toEqual(
      new Set([order.id, ...historyOrderIds]),
    );

    const stranger = await browser.newPage();
    await stranger.goto("/");
    await stranger.getByRole("button", { name: checkoutCategoryName }).click();
    await stranger.getByRole("button", { name: checkoutProductName }).click();
    await stranger.getByRole("button", { name: /M · 320 ₽/ }).click();
    await stranger.getByRole("button", { name: /Добавить/ }).click();
    await stranger.getByRole("link", { name: /Корзина/ }).click();
    await stranger.getByRole("button", { name: "Оформить заказ" }).click();
    await login(
      stranger,
      `${checkoutPhonePrefix}${randomUUID().replace(/\D/g, "").slice(0, 7).padStart(7, "0")}`,
    );
    await stranger.goto(`/orders/${order.id}`);
    await expect(
      stranger.getByText(checkoutProductName, { exact: true }),
    ).toHaveCount(0);
    await stranger.close();

    await openCappuccinoCart(page);
    await database.setVariantPriceMinor(
      state.variantPriceMinor + checkoutRepeatPriceDeltaMinor,
    );
    await page.goto(`/orders/${order.id}`);
    await page.getByRole("button", { name: "Повторить заказ" }).click();
    await expect(
      page.getByRole("heading", { name: "Заменить корзину?" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Заменить корзину" }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(
      page.getByLabel(`Позиция корзины: ${checkoutProductName}`),
    ).toContainText(
      `${(state.variantPriceMinor + checkoutRepeatPriceDeltaMinor) / 100} ₽`,
    );

    await database.setVariantAvailable(false);
    await page.goto(`/orders/${order.id}`);
    await page.getByRole("button", { name: "Повторить заказ" }).click();
    const unavailableItems = page.getByRole("alert");
    await expect(unavailableItems).toContainText(
      "Некоторые позиции больше недоступны:",
    );
    await expect(unavailableItems).toContainText(checkoutProductName);
    await expect(page).toHaveURL(`/orders/${order.id}`);
    await page.goto("/cart");
    await expect(
      page.getByLabel(`Позиция корзины: ${checkoutProductName}`),
    ).toContainText(
      `${(state.variantPriceMinor + checkoutRepeatPriceDeltaMinor) / 100} ₽`,
    );
  } finally {
    await database.deleteOrders(historyOrderIds);
    await database.restore(state);
    await database.close();
  }
});

test("history visual evidence на 390 и 700", async ({ page }) => {
  const database = new CheckoutDatabase();
  const phone = `${checkoutPhonePrefix}${randomUUID().replace(/\D/g, "").slice(0, 7).padStart(7, "0")}`;
  let historyOrderIds: readonly string[] = [];
  try {
    await openCappuccinoCart(page);
    await page.getByRole("button", { name: "Оформить заказ" }).click();
    const customerId = await login(page, phone);
    const orderRequest = page.waitForRequest((request) =>
      request.url().endsWith("/api/v1/orders"),
    );
    await page.getByRole("button", { name: "Оформить заказ" }).click();
    await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);
    const key = (await orderRequest).headers()["idempotency-key"] ?? "";
    const order = await requireOrder(database, customerId, key);
    const history = await database.createIssuedHistory(customerId, order.id);
    historyOrderIds = history.map((historyOrder) => historyOrder.id);

    for (const width of [...checkoutResponsiveWidths, 700]) {
      await page.setViewportSize({ height: checkoutViewportHeight, width });
      await page.goto("/orders");
      await expect(
        page.getByRole("heading", { name: "История" }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Открыть заказ" }),
      ).toHaveCount(20);
      await expectNoOverflow(page, width);

      if (width === 390 || width === 700) {
        await page.evaluate(async () => {
          await document.fonts.ready;
          if (document.activeElement instanceof HTMLElement)
            document.activeElement.blur();
        });
        await expect(page).toHaveScreenshot(`orders-history-${width}.png`, {
          animations: "disabled",
          maxDiffPixelRatio: 0.01,
        });
      }
    }

    const lastHistoryLink = page
      .getByRole("link", { name: "Открыть заказ" })
      .last();
    const loadMore = page.getByRole("button", { name: "Показать ещё" });
    await lastHistoryLink.focus();
    await page.keyboard.press("Tab");
    await expect(loadMore).toBeFocused();
    await expect
      .poll(() =>
        loadMore.evaluate((element) => element.matches(":focus-visible")),
      )
      .toBe(true);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("link", { name: "Открыть заказ" })).toHaveCount(
      21,
    );
    await expectNoOverflow(page, 700);
  } finally {
    await database.deleteOrders(historyOrderIds);
    await database.close();
  }
});

test("cart empty and filled match visual baselines", async ({ page }) => {
  await page.setViewportSize({
    width: 390,
    height: checkoutViewportHeight,
  });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/cart");
  await expect(page.getByText("Пока ничего не добавлено")).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
  });
  await expect(page).toHaveScreenshot("cart-empty-390.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.01,
  });

  await openCappuccinoCart(page);
  await expect(
    page.getByLabel(`Позиция корзины: ${checkoutProductName}`),
  ).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
  });
  await expect(page).toHaveScreenshot("cart-filled-390.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.01,
  });

  await page.setViewportSize({
    width: 700,
    height: checkoutViewportHeight,
  });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/cart");
  await expect(page.getByText("Пока ничего не добавлено")).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
  });
  await expect(page).toHaveScreenshot("cart-empty-700.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.01,
  });

  await openCappuccinoCart(page);
  await expect(
    page.getByLabel(`Позиция корзины: ${checkoutProductName}`),
  ).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
  });
  await expect(page).toHaveScreenshot("cart-filled-700.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.01,
  });
});

async function openCappuccinoCart(page: Page, menuUrl = "/"): Promise<void> {
  await page.goto(menuUrl);
  await page
    .locator(".menu-root__grid > li")
    .filter({ has: page.getByText(checkoutCategoryName, { exact: true }) })
    .getByRole("button")
    .click();
  await page.getByRole("button", { name: checkoutProductName }).click();
  await page.getByRole("button", { name: /M · 320 ₽/ }).click();
  await page.getByRole("button", { name: /Добавить/ }).click();
  await page.getByRole("link", { name: /Корзина/ }).click();
}

async function requireOrder(
  database: CheckoutDatabase,
  customerId: string,
  idempotencyKey: string,
): Promise<OrderRow> {
  const order = await database.readOrder(customerId, idempotencyKey);
  if (order === null) throw new Error("Заказ не найден в database.");
  return order;
}

async function expectOrderPage(page: Page, order: OrderRow): Promise<void> {
  const total = `${order.totalMinor / 100} ₽`;
  await expect(page).toHaveURL(new RegExp(`/orders/${order.id}$`));
  await expect(
    page.getByRole("heading", { name: `Заказ №${order.orderNumber}` }),
  ).toBeVisible();
  await expect(
    page.getByText(`${order.quantity} × 320 ₽`, { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Размер M", { exact: true })).toBeVisible();
  await expect(
    page.getByText("+ Обычное молоко", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Итого", { exact: true }).locator(".."),
  ).toContainText(total);
}

async function login(page: Page, phone: string): Promise<string> {
  await page.getByLabel("Номер телефона").fill(phone);
  await page.getByRole("button", { name: "Отправить код" }).click();
  const currentUser = page.waitForResponse(
    (response) => response.url().endsWith("/me") && response.status() === 200,
  );
  await page.getByLabel("Код из сообщения").fill(checkoutOtp);
  await page
    .locator(".auth-form:visible")
    .getByRole("button", { name: "Подтвердить", exact: true })
    .click();
  const value: unknown = await (await currentUser).json();
  if (!isCurrentUser(value))
    throw new Error("Ответ /me не содержит customer id.");
  return value.id;
}

function collectBrowserIssues(page: Page): () => BrowserIssue[] {
  const issues: BrowserIssue[] = [];
  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().endsWith("/auth/refresh"))
      issues.push({
        source: "response",
        text: `${response.status()} ${response.url()}`,
      });
  });
  page.on("requestfailed", (request) =>
    issues.push({ source: "request", text: request.url() }),
  );
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().includes("401 (Unauthorized)")
    )
      issues.push({ source: "console", text: message.text() });
  });
  page.on("pageerror", (error) =>
    issues.push({ source: "page", text: error.message }),
  );
  return () => issues;
}

async function expectNoOverflow(page: Page, width: number): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(width);
}

async function expectElementNotOccluded(
  page: Page,
  locator: Locator,
): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toBeVisible();
  await expect
    .poll(async () => {
      const box = await locator.boundingBox();
      const viewport = page.viewportSize();
      if (box === null || viewport === null) return false;
      if (
        box.x < 0 ||
        box.y < 0 ||
        box.x + box.width > viewport.width ||
        box.y + box.height > viewport.height
      ) {
        return false;
      }

      return locator.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const hit = document.elementFromPoint(
          rect.x + rect.width / 2,
          rect.y + rect.height / 2,
        );

        return hit !== null && element.contains(hit);
      });
    })
    .toBe(true);
}

function collectConsoleAndPageIssues(page: Page): () => BrowserIssue[] {
  const issues: BrowserIssue[] = [];
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().includes("401 (Unauthorized)")
    ) {
      issues.push({ source: "console", text: message.text() });
    }
  });
  page.on("pageerror", (error) =>
    issues.push({ source: "page", text: error.message }),
  );

  return () => issues;
}
function isCurrentUser(value: unknown): value is CurrentUser {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string"
  );
}
