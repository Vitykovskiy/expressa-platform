import { randomUUID } from "node:crypto";

import { expect, test, type Locator, type Page } from "@playwright/test";

import { CheckoutDatabase } from "./checkout.database";
import {
  checkoutCategoryName,
  checkoutRepeatPriceDelta,
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
    await page.getByRole("button", { name: /Корзина/ }).click();
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
      if (request.url().endsWith("/api/v2/orders"))
        idempotencyKey = request.headers()["idempotency-key"] ?? "";
    });
    await page.getByRole("button", { name: "Оформить заказ" }).click();
    await expect(page.getByText("Оформлен")).toBeVisible();
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
    await page.getByRole("button", { name: /^Корзина(?:\s+\d+)?$/ }).click();
    await page.getByRole("button", { name: "Оформить заказ" }).click();
    const customerId = await login(
      page,
      `${checkoutPhonePrefix}${randomUUID().replace(/\D/g, "").slice(0, 7).padStart(7, "0")}`,
    );
    const previousTotal = `${state.variantPrice} ₽`;
    const nextPrice = state.variantPrice + 1;
    const nextTotal = `${nextPrice} ₽`;
    await database.setVariantPrice(nextPrice);
    let key = "";
    const orderRouteTransitions: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/api/v2/orders"))
        key = request.headers()["idempotency-key"] ?? "";
    });
    page.on("framenavigated", (frame) => {
      if (
        frame === page.mainFrame() &&
        /\/orders\/[0-9a-f-]{36}$/i.test(frame.url())
      )
        orderRouteTransitions.push(frame.url());
    });
    await page.getByRole("button", { name: "Оформить заказ" }).click();
    await expect(page.getByText("Итог изменился")).toBeVisible();
    const mobileChangedTotal = page.getByLabel("Изменение итога заказа");
    await expect(
      mobileChangedTotal.getByText(previousTotal, { exact: true }),
    ).toBeVisible();
    await expect(
      mobileChangedTotal.getByText(nextTotal, { exact: true }),
    ).toBeVisible();
    expect(await database.countOrders(customerId, key)).toBe(0);
    const reconfirmationInstruction = page.getByText(
      "Проверьте предыдущий и новый итог, затем подтвердите заказ ещё раз.",
      { exact: true },
    );
    const confirmation = page.getByRole("button", {
      name: new RegExp(
        `^(Подтвердить новый итог|Оформляем заказ)(?: · ${nextTotal})?$`,
      ),
    });
    for (const { width, height } of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize({ width, height });
      const changedTotal =
        width < 1024 ? mobileChangedTotal : page.getByLabel("Сводка заказа");
      const previousTotalGroup = changedTotal.getByRole("group", {
        name: "Предыдущий итог",
      });
      const nextTotalGroup = changedTotal.getByRole("group", {
        name: "Новый итог",
      });
      await expect(changedTotal).toBeVisible();
      await expect(confirmation).toHaveCount(1);
      await expect(confirmation).toBeVisible();
      for (const essentialText of [
        reconfirmationInstruction,
        previousTotalGroup.getByText("Предыдущий итог", { exact: true }),
        previousTotalGroup.getByText(previousTotal, { exact: true }),
        nextTotalGroup.getByText("Новый итог", { exact: true }),
        nextTotalGroup.getByText(nextTotal, { exact: true }),
      ]) {
        await expect(essentialText).toBeVisible();
        const contrast = await essentialText.evaluate((element) => {
          const parseColor = (value: string) => {
            const [red = 0, green = 0, blue = 0, alpha = 1] =
              value.match(/[\d.]+/g)?.map(Number) ?? [];
            return { alpha, blue, green, red };
          };
          const linear = (channel: number) => {
            const value = channel / 255;
            return value <= 0.04045
              ? value / 12.92
              : ((value + 0.055) / 1.055) ** 2.4;
          };
          const luminance = ({
            blue,
            green,
            red,
          }: ReturnType<typeof parseColor>) =>
            0.2126 * linear(red) +
            0.7152 * linear(green) +
            0.0722 * linear(blue);
          const backgroundLayers = [];
          let parent = element.parentElement;
          while (parent !== null) {
            backgroundLayers.unshift(
              parseColor(getComputedStyle(parent).backgroundColor),
            );
            parent = parent.parentElement;
          }
          const background = backgroundLayers.reduce(
            (base, layer) => ({
              blue: layer.blue * layer.alpha + base.blue * (1 - layer.alpha),
              green: layer.green * layer.alpha + base.green * (1 - layer.alpha),
              red: layer.red * layer.alpha + base.red * (1 - layer.alpha),
            }),
            { blue: 255, green: 255, red: 255 },
          );
          const foreground = parseColor(getComputedStyle(element).color);
          const compositedForeground = {
            blue:
              foreground.blue * foreground.alpha +
              background.blue * (1 - foreground.alpha),
            green:
              foreground.green * foreground.alpha +
              background.green * (1 - foreground.alpha),
            red:
              foreground.red * foreground.alpha +
              background.red * (1 - foreground.alpha),
          };
          return {
            background: [
              Math.round(background.red),
              Math.round(background.green),
              Math.round(background.blue),
            ],
            foreground: [
              Math.round(compositedForeground.red),
              Math.round(compositedForeground.green),
              Math.round(compositedForeground.blue),
            ],
            ratio:
              (Math.max(
                luminance(compositedForeground),
                luminance(background),
              ) +
                0.05) /
              (Math.min(
                luminance(compositedForeground),
                luminance(background),
              ) +
                0.05),
          };
        });
        expect(contrast.background).not.toEqual(contrast.foreground);
        expect(contrast.ratio).toBeGreaterThanOrEqual(4.5);
      }
      for (let tabPresses = 0; tabPresses < 20; tabPresses += 1) {
        await page.keyboard.press("Tab");
        if (
          await confirmation.evaluate(
            (element) => document.activeElement === element,
          )
        )
          break;
      }
      await expect(confirmation).toBeFocused();
      await expect
        .poll(() =>
          confirmation.evaluate((element) => element.matches(":focus-visible")),
        )
        .toBe(true);
      await expectNoOverflow(page, width);
    }
    const confirmationRequests: string[] = [];
    let releaseConfirmation!: () => void;
    let signalConfirmationStarted!: () => void;
    const confirmationDelivery = new Promise<void>((resolve) => {
      releaseConfirmation = resolve;
    });
    const confirmationStarted = new Promise<void>((resolve) => {
      signalConfirmationStarted = resolve;
    });
    await page.route("**/api/v2/orders", async (route) => {
      confirmationRequests.push(
        route.request().headers()["idempotency-key"] ?? "",
      );
      if (confirmationRequests.length > 1) {
        await route.abort();
        return;
      }

      signalConfirmationStarted();
      await confirmationDelivery;
      await route.continue();
    });
    await confirmation.click();
    await confirmationStarted;
    await expect(confirmation).toBeDisabled();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    expect(confirmationRequests).toHaveLength(1);
    expect(await database.countOrdersForCustomer(customerId)).toBe(0);
    releaseConfirmation();
    await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);
    expect(await database.countOrders(customerId, key)).toBe(1);
    const order = await requireOrder(database, customerId, key);
    expect(orderRouteTransitions).toEqual([
      expect.stringMatching(new RegExp(`/orders/${order.id}$`)),
    ]);
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
    await page.getByRole("button", { name: /^Корзина(?:\s+\d+)?$/ }).click();
    await page.getByRole("button", { name: "Оформить заказ" }).click();
    const customerId = await login(
      page,
      `${checkoutPhonePrefix}${randomUUID().replace(/\D/g, "").slice(0, 7).padStart(7, "0")}`,
    );
    await database.setVariantAvailable(false);
    let key = "";
    const orderRouteTransitions: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/api/v2/orders"))
        key = request.headers()["idempotency-key"] ?? "";
    });
    page.on("framenavigated", (frame) => {
      if (
        frame === page.mainFrame() &&
        /\/orders\/[0-9a-f-]{36}$/i.test(frame.url())
      )
        orderRouteTransitions.push(frame.url());
    });
    await page.getByRole("button", { name: "Оформить заказ" }).click();
    const item = page.getByLabel(`Позиция корзины: ${checkoutProductName}`);
    await expect(item).toContainText("Сейчас недоступно");
    await expect(
      page.getByRole("button", { name: "Оформить заказ" }),
    ).toBeDisabled();
    const unavailableExplanation = page.getByText(
      "Удалите недоступные позиции, чтобы продолжить.",
    );
    for (const { width, height } of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize({ width, height });
      const contrast = await unavailableExplanation.evaluate((element) => {
        const color = (value: string) =>
          (value.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 1]) as [
            number,
            number,
            number,
            number,
          ];
        const [red, green, blue, alpha = 1] = color(
          getComputedStyle(element).color,
        );
        const [backgroundRed, backgroundGreen, backgroundBlue] = color(
          getComputedStyle(element.parentElement ?? document.body)
            .backgroundColor,
        );
        const linear = (channel: number) => {
          const value = channel / 255;
          return value <= 0.04045
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
        };
        const luminance = (values: readonly number[]) =>
          0.2126 * linear(values[0] ?? 0) +
          0.7152 * linear(values[1] ?? 0) +
          0.0722 * linear(values[2] ?? 0);
        const composited = [
          red * alpha + backgroundRed * (1 - alpha),
          green * alpha + backgroundGreen * (1 - alpha),
          blue * alpha + backgroundBlue * (1 - alpha),
        ];
        return {
          background: getComputedStyle(element.parentElement ?? document.body)
            .backgroundColor,
          composited: composited.map(Math.round),
          fontSize: getComputedStyle(element).fontSize,
          fontWeight: getComputedStyle(element).fontWeight,
          ratio:
            (Math.max(
              luminance(composited),
              luminance([backgroundRed, backgroundGreen, backgroundBlue]),
            ) +
              0.05) /
            (Math.min(
              luminance(composited),
              luminance([backgroundRed, backgroundGreen, backgroundBlue]),
            ) +
              0.05),
        };
      });
      expect(contrast.background).toBe("rgb(255, 255, 255)");
      expect(contrast.composited).toEqual([15, 40, 128]);
      expect(contrast.fontSize).toBe("16px");
      expect(contrast.fontWeight).toBe("400");
      expect(contrast.ratio).toBeGreaterThanOrEqual(4.5);
      const disabledCheckout = page.getByRole("button", {
        name: "Оформить заказ",
      });
      const remove = page.getByRole("button", {
        name: `Удалить ${checkoutProductName}`,
      });
      const decrement = page.getByRole("button", {
        name: `Уменьшить количество ${checkoutProductName}`,
      });
      const increment = page.getByRole("button", {
        name: `Увеличить количество ${checkoutProductName}`,
      });
      await expect(disabledCheckout).toBeVisible();
      await expect(disabledCheckout).toHaveCount(1);
      await expect(disabledCheckout).toBeDisabled();
      await expect(remove).toBeEnabled();
      await expect(decrement).toBeDisabled();
      await expect(increment).toBeDisabled();
      for (let tabPresses = 0; tabPresses < 20; tabPresses += 1) {
        await page.keyboard.press("Tab");
        await expect(disabledCheckout).not.toBeFocused();
        if (
          await remove.evaluate((element) => document.activeElement === element)
        )
          break;
      }
      await expect(remove).toBeFocused();
      await expect
        .poll(() =>
          remove.evaluate((element) => element.matches(":focus-visible")),
        )
        .toBe(true);
      await expectNoOverflow(page, width);
    }
    expect(key).toMatch(/^[0-9a-f-]{36}$/i);
    expect(await database.countOrders(customerId, key)).toBe(0);
    expect(orderRouteTransitions).toEqual([]);
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
    const closedIntakeExplanation = intakePage.getByText(
      "Приём новых заказов сейчас закрыт.",
    );
    const orderRouteTransitions: string[] = [];
    intakePage.on("framenavigated", (frame) => {
      if (
        frame === intakePage.mainFrame() &&
        /\/orders\/[0-9a-f-]{36}$/i.test(frame.url())
      )
        orderRouteTransitions.push(frame.url());
    });
    for (const { width, height } of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      await intakePage.setViewportSize({ width, height });
      const contrast = await closedIntakeExplanation.evaluate((element) => {
        const color = (value: string) =>
          (value.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 1]) as [
            number,
            number,
            number,
            number,
          ];
        const [red, green, blue, alpha = 1] = color(
          getComputedStyle(element).color,
        );
        const [backgroundRed, backgroundGreen, backgroundBlue] = color(
          getComputedStyle(element.parentElement ?? document.body)
            .backgroundColor,
        );
        const linear = (channel: number) => {
          const value = channel / 255;
          return value <= 0.04045
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
        };
        const luminance = (values: readonly number[]) =>
          0.2126 * linear(values[0] ?? 0) +
          0.7152 * linear(values[1] ?? 0) +
          0.0722 * linear(values[2] ?? 0);
        const composited = [
          red * alpha + backgroundRed * (1 - alpha),
          green * alpha + backgroundGreen * (1 - alpha),
          blue * alpha + backgroundBlue * (1 - alpha),
        ];
        return {
          background: getComputedStyle(element.parentElement ?? document.body)
            .backgroundColor,
          composited: composited.map(Math.round),
          fontSize: getComputedStyle(element).fontSize,
          fontWeight: getComputedStyle(element).fontWeight,
          ratio:
            (Math.max(
              luminance(composited),
              luminance([backgroundRed, backgroundGreen, backgroundBlue]),
            ) +
              0.05) /
            (Math.min(
              luminance(composited),
              luminance([backgroundRed, backgroundGreen, backgroundBlue]),
            ) +
              0.05),
        };
      });
      expect(contrast.background).toBe("rgb(255, 255, 255)");
      expect(contrast.composited).toEqual([15, 40, 128]);
      expect(contrast.fontSize).toBe("16px");
      expect(contrast.fontWeight).toBe("400");
      expect(contrast.ratio).toBeGreaterThanOrEqual(4.5);
      const disabledCheckout = intakePage.getByRole("button", {
        name: "Оформить заказ",
      });
      const remove = intakePage.getByRole("button", {
        name: `Удалить ${checkoutProductName}`,
      });
      const increment = intakePage.getByRole("button", {
        name: `Увеличить количество ${checkoutProductName}`,
      });
      await expect(disabledCheckout).toBeVisible();
      await expect(disabledCheckout).toHaveCount(1);
      await expect(disabledCheckout).toBeDisabled();
      await expect(remove).toBeEnabled();
      await expect(increment).toBeEnabled();
      for (let tabPresses = 0; tabPresses < 20; tabPresses += 1) {
        await intakePage.keyboard.press("Tab");
        await expect(disabledCheckout).not.toBeFocused();
        if (
          await remove.evaluate((element) => document.activeElement === element)
        )
          break;
      }
      await expect(remove).toBeFocused();
      await expect
        .poll(() =>
          remove.evaluate((element) => element.matches(":focus-visible")),
        )
        .toBe(true);
      await expectNoOverflow(intakePage, width);
    }
    expect(await database.countOrdersForCustomer(customerId)).toBe(0);
    expect(orderRouteTransitions).toEqual([]);
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
    const requestBodies: string[] = [];
    const successRoutes: string[] = [];
    let releaseFirstDelivery!: () => void;
    let releaseRetryDelivery!: () => void;
    let signalFirstPersisted!: () => void;
    let signalRetryStarted!: () => void;
    const firstDeliveryGate = new Promise<void>((resolve) => {
      releaseFirstDelivery = resolve;
    });
    const retryDeliveryGate = new Promise<void>((resolve) => {
      releaseRetryDelivery = resolve;
    });
    const firstPersisted = new Promise<void>((resolve) => {
      signalFirstPersisted = resolve;
    });
    const retryStarted = new Promise<void>((resolve) => {
      signalRetryStarted = resolve;
    });
    page.on("framenavigated", (frame) => {
      if (
        frame === page.mainFrame() &&
        /\/orders\/[0-9a-f-]{36}$/i.test(frame.url())
      )
        successRoutes.push(frame.url());
    });
    await page.route("**/api/v2/orders", async (route) => {
      const requestIndex = idempotencyKeys.length;
      idempotencyKeys.push(route.request().headers()["idempotency-key"] ?? "");
      requestBodies.push(route.request().postData() ?? "");
      if (requestIndex > 1) {
        await route.continue();
        return;
      }

      if (requestIndex === 1) {
        signalRetryStarted();
        await retryDeliveryGate;
        await route.continue();
        return;
      }

      const response = await route.fetch();
      expect(response.status()).toBe(201);
      expect(await database.countOrders(customerId, idempotencyKeys[0]!)).toBe(
        1,
      );
      signalFirstPersisted();
      await firstDeliveryGate;
      await route.abort("connectionaborted");
    });

    await page.getByRole("button", { name: "Оформить заказ" }).click();
    await firstPersisted;
    const firstPendingAction = page.locator(".cart-screen__checkout:visible");
    await expect(firstPendingAction).toHaveCount(1);
    await expect(firstPendingAction).toBeDisabled();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    expect(idempotencyKeys).toHaveLength(1);
    releaseFirstDelivery();
    const recoveryInstruction = page.getByText(
      "Не удалось отправить заказ. Повторите попытку.",
    );
    await expect(recoveryInstruction).toBeVisible();
    for (const { width, height } of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize({ width, height });
      const recoveryAction = page.locator(".cart-screen__checkout:visible");
      await expect(recoveryAction).toHaveCount(1);
      await expect(recoveryAction).toBeEnabled();
      for (let tabPresses = 0; tabPresses < 20; tabPresses += 1) {
        await page.keyboard.press("Tab");
        if (
          await recoveryAction.evaluate(
            (element) => document.activeElement === element,
          )
        )
          break;
      }
      await expect(recoveryAction).toBeFocused();
      await expect
        .poll(() =>
          recoveryAction.evaluate((element) =>
            element.matches(":focus-visible"),
          ),
        )
        .toBe(true);
      await expectNoOverflow(page, width);
      const contrast = await recoveryInstruction.evaluate((element) => {
        const parseColor = (value: string) => {
          const [red = 0, green = 0, blue = 0, alpha = 1] =
            value.match(/[\d.]+/g)?.map(Number) ?? [];
          return { alpha, blue, green, red };
        };
        const linear = (channel: number) => {
          const value = channel / 255;
          return value <= 0.04045
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
        };
        const luminance = ({
          red,
          green,
          blue,
        }: ReturnType<typeof parseColor>) =>
          0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
        const foreground = parseColor(getComputedStyle(element).color);
        const background = parseColor(
          getComputedStyle(element.parentElement ?? document.body)
            .backgroundColor,
        );
        const compositedForeground = {
          blue:
            foreground.blue * foreground.alpha +
            background.blue * (1 - foreground.alpha),
          green:
            foreground.green * foreground.alpha +
            background.green * (1 - foreground.alpha),
          red:
            foreground.red * foreground.alpha +
            background.red * (1 - foreground.alpha),
        };
        const ratio =
          (Math.max(luminance(compositedForeground), luminance(background)) +
            0.05) /
          (Math.min(luminance(compositedForeground), luminance(background)) +
            0.05);

        return {
          background: getComputedStyle(element.parentElement ?? document.body)
            .backgroundColor,
          compositedForeground: [
            Math.round(compositedForeground.red),
            Math.round(compositedForeground.green),
            Math.round(compositedForeground.blue),
          ],
          fontSize: getComputedStyle(element).fontSize,
          fontWeight: getComputedStyle(element).fontWeight,
          ratio,
        };
      });

      expect(contrast.background).toBe("rgb(255, 255, 255)");
      expect(contrast.compositedForeground).toEqual([15, 40, 128]);
      expect(contrast.fontSize).toBe("16px");
      expect(contrast.fontWeight).toBe("400");
      expect(contrast.ratio).toBeGreaterThanOrEqual(4.5);
    }
    await page.locator(".cart-screen__checkout:visible").click();
    await retryStarted;
    const retryPendingAction = page.locator(".cart-screen__checkout:visible");
    await expect(retryPendingAction).toHaveCount(1);
    await expect(retryPendingAction).toBeDisabled();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    expect(idempotencyKeys).toHaveLength(2);
    expect(idempotencyKeys[0]).toMatch(/^[0-9a-f-]{36}$/i);
    expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
    expect(requestBodies[1]).toBe(requestBodies[0]);
    expect(await database.countOrders(customerId, idempotencyKeys[0])).toBe(1);
    const retryResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().endsWith("/api/v2/orders"),
    );
    releaseRetryDelivery();
    expect((await retryResponse).status()).toBe(201);
    const replayedOrder = await requireOrder(
      database,
      customerId,
      idempotencyKeys[0],
    );
    await expectOrderPage(page, replayedOrder);
    expect(successRoutes).toEqual([
      expect.stringMatching(new RegExp(`/orders/${replayedOrder.id}$`)),
    ]);

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

test("ошибка 500 объясняет восстановление и не создаёт заказ до повтора", async ({
  page,
}) => {
  const database = new CheckoutDatabase();
  try {
    await page.setViewportSize({ height: 844, width: 390 });
    await openCappuccinoCart(page);
    await page.getByRole("button", { name: "Оформить заказ" }).click();
    const customerId = await login(
      page,
      `${checkoutPhonePrefix}${randomUUID().replace(/\D/g, "").slice(0, 7).padStart(7, "0")}`,
    );
    const idempotencyKeys: string[] = [];
    const orderRoutes: string[] = [];
    let releaseInitialFailure!: () => void;
    let releaseRecovery!: () => void;
    let signalInitialStarted!: () => void;
    let signalRecoveryStarted!: () => void;
    const initialFailureDelivery = new Promise<void>((resolve) => {
      releaseInitialFailure = resolve;
    });
    const recoveryDelivery = new Promise<void>((resolve) => {
      releaseRecovery = resolve;
    });
    const initialStarted = new Promise<void>((resolve) => {
      signalInitialStarted = resolve;
    });
    const recoveryStarted = new Promise<void>((resolve) => {
      signalRecoveryStarted = resolve;
    });
    page.on("framenavigated", (frame) => {
      if (
        frame === page.mainFrame() &&
        /\/orders\/[0-9a-f-]{36}$/i.test(frame.url())
      )
        orderRoutes.push(frame.url());
    });
    await page.route("**/api/v2/orders", async (route) => {
      const requestIndex = idempotencyKeys.length;
      idempotencyKeys.push(route.request().headers()["idempotency-key"] ?? "");
      if (requestIndex === 0) {
        signalInitialStarted();
        await initialFailureDelivery;
        await route.fulfill({
          body: JSON.stringify({
            code: "INTERNAL_SERVER_ERROR",
            details: null,
          }),
          contentType: "application/json",
          status: 500,
        });
        return;
      }

      signalRecoveryStarted();
      await recoveryDelivery;
      await route.continue();
    });

    await page.getByRole("button", { name: "Оформить заказ" }).click();
    await initialStarted;
    const pendingInitialAction = page.locator(".cart-screen__checkout:visible");
    await expect(pendingInitialAction).toHaveCount(1);
    await expect(pendingInitialAction).toBeDisabled();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    expect(idempotencyKeys).toHaveLength(1);
    releaseInitialFailure();
    const errorTitle = page.getByText("Не удалось оформить заказ", {
      exact: true,
    });
    const recoveryInstruction = page.getByText(
      "Сервис временно недоступен. Повторите оформление заказа.",
      { exact: true },
    );
    await expect(errorTitle).toBeVisible();
    await expect(recoveryInstruction).toBeVisible();
    expect(await database.countOrdersForCustomer(customerId)).toBe(0);
    expect(orderRoutes).toEqual([]);
    expect(idempotencyKeys).toHaveLength(1);

    for (const { width, height } of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize({ width, height });
      const recoveryAction = page.locator(".cart-screen__checkout:visible");
      await expect(recoveryAction).toHaveCount(1);
      await expect(recoveryAction).toBeEnabled();
      await expect(errorTitle).not.toHaveText(
        await recoveryInstruction.textContent(),
      );
      const contrast = await recoveryInstruction.evaluate((element) => {
        const parseColor = (value: string) => {
          const [red = 0, green = 0, blue = 0, alpha = 1] =
            value.match(/[\d.]+/g)?.map(Number) ?? [];
          return { alpha, blue, green, red };
        };
        const linear = (channel: number) => {
          const value = channel / 255;
          return value <= 0.04045
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
        };
        const luminance = ({
          red,
          green,
          blue,
        }: ReturnType<typeof parseColor>) =>
          0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
        const foreground = parseColor(getComputedStyle(element).color);
        const background = parseColor(
          getComputedStyle(element.parentElement ?? document.body)
            .backgroundColor,
        );
        const compositedForeground = {
          blue:
            foreground.blue * foreground.alpha +
            background.blue * (1 - foreground.alpha),
          green:
            foreground.green * foreground.alpha +
            background.green * (1 - foreground.alpha),
          red:
            foreground.red * foreground.alpha +
            background.red * (1 - foreground.alpha),
        };
        const ratio =
          (Math.max(luminance(compositedForeground), luminance(background)) +
            0.05) /
          (Math.min(luminance(compositedForeground), luminance(background)) +
            0.05);

        return {
          background: getComputedStyle(element.parentElement ?? document.body)
            .backgroundColor,
          compositedForeground: [
            Math.round(compositedForeground.red),
            Math.round(compositedForeground.green),
            Math.round(compositedForeground.blue),
          ],
          fontSize: getComputedStyle(element).fontSize,
          fontWeight: getComputedStyle(element).fontWeight,
          ratio,
        };
      });
      expect(contrast.background).toBe("rgb(255, 255, 255)");
      expect(contrast.compositedForeground).toEqual([15, 40, 128]);
      expect(contrast.fontSize).toBe("16px");
      expect(contrast.fontWeight).toBe("400");
      expect(contrast.ratio).toBeGreaterThanOrEqual(4.5);
      for (let tabPresses = 0; tabPresses < 20; tabPresses += 1) {
        await page.keyboard.press("Tab");
        if (
          await recoveryAction.evaluate(
            (element) => document.activeElement === element,
          )
        )
          break;
      }
      await expect(recoveryAction).toBeFocused();
      await expectNoOverflow(page, width);
    }

    await page.locator(".cart-screen__checkout:visible").click();
    await recoveryStarted;
    const pendingRecoveryAction = page.locator(
      ".cart-screen__checkout:visible",
    );
    await expect(pendingRecoveryAction).toHaveCount(1);
    await expect(pendingRecoveryAction).toBeDisabled();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    expect(idempotencyKeys).toHaveLength(2);
    expect(idempotencyKeys[0]).toMatch(/^[0-9a-f-]{36}$/i);
    expect(idempotencyKeys[1]).toMatch(/^[0-9a-f-]{36}$/i);
    expect(idempotencyKeys[1]).not.toBe(idempotencyKeys[0]);
    expect(await database.countOrdersForCustomer(customerId)).toBe(0);
    const recoveryResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().endsWith("/api/v2/orders"),
    );
    releaseRecovery();
    expect((await recoveryResponse).status()).toBe(201);
    const order = await requireOrder(database, customerId, idempotencyKeys[1]!);
    expect(order.total).toBe(320);
    await expectOrderPage(page, order);
    expect(orderRoutes).toEqual([
      expect.stringMatching(new RegExp(`/orders/${order.id}$`)),
    ]);
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
    await expectElementNotOccluded(page, page.getByText("Оформлен"));
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
      if (request.url().endsWith("/api/v2/orders"))
        key = request.headers()["idempotency-key"] ?? "";
    });
    await page.getByRole("button", { name: "Оформить заказ" }).click();
    await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);
    await expect(page.getByText("Оформлен")).toBeVisible();
    const order = await requireOrder(database, customerId, key);
    const detailRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith(`/api/v2/orders/${order.id}`))
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
    await stranger.getByRole("button", { name: /Корзина/ }).click();
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
    await database.setVariantPrice(
      state.variantPrice + checkoutRepeatPriceDelta,
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
    ).toContainText(`${state.variantPrice + checkoutRepeatPriceDelta} ₽`);

    await database.setVariantAvailable(false);
    await page.goto(`/orders/${order.id}`);
    await page.getByRole("button", { name: "Повторить заказ" }).click();
    const unavailableItems = page.getByRole("alert");
    await expect(unavailableItems).toContainText(
      "Не все позиции из заказа добавлены",
    );
    await expect(unavailableItems).toContainText(checkoutProductName);
    await expect(page).toHaveURL(/\/cart$/);
    await expect(
      page.getByLabel(`Позиция корзины: ${checkoutProductName}`),
    ).toContainText(`${state.variantPrice + checkoutRepeatPriceDelta} ₽`);
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
      request.url().endsWith("/api/v2/orders"),
    );
    await page.getByRole("button", { name: "Оформить заказ" }).click();
    await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);
    const key = (await orderRequest).headers()["idempotency-key"] ?? "";
    const order = await requireOrder(database, customerId, key);
    await database.stabilizeHistoryVisualOrder(order.id);
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

test("Q-047 quantity controls keep their keyboard focus ring visible", async ({
  page,
}) => {
  for (const { width, height } of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize({ height, width });
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await openCappuccinoCart(page);

    const decrement = page.getByRole("button", {
      name: `Уменьшить количество ${checkoutProductName}`,
    });
    const increment = page.getByRole("button", {
      name: `Увеличить количество ${checkoutProductName}`,
    });

    await expect(decrement).toBeDisabled();

    for (let tabPresses = 0; tabPresses < 20; tabPresses += 1) {
      await page.keyboard.press("Tab");
      if (
        await increment.evaluate(
          (element) => document.activeElement === element,
        )
      )
        break;
      await expect(decrement).not.toBeFocused();
    }

    await expect(increment).toBeFocused();
    await expect(increment).toBeEnabled();
    await expectQuantityFocusRing(increment);
    await page.keyboard.press("Enter");
    await expect(decrement).toBeEnabled();

    for (let tabPresses = 0; tabPresses < 20; tabPresses += 1) {
      await page.keyboard.press("Tab");
      if (
        await decrement.evaluate(
          (element) => document.activeElement === element,
        )
      )
        break;
    }

    await expect(decrement).toBeFocused();
    await expectQuantityFocusRing(decrement);

    await expectNoOverflow(page, width);
  }
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
  await page.getByRole("button", { name: /^Корзина(?:\s+\d+)?$/ }).click();
}

async function expectQuantityFocusRing(control: Locator): Promise<void> {
  await expect
    .poll(() =>
      control.evaluate((element) => element.matches(":focus-visible")),
    )
    .toBe(true);
  await expect
    .poll(() =>
      control.evaluate((element) => {
        const styles = getComputedStyle(element);
        const controlRect = element.getBoundingClientRect();
        const ringExtent =
          Number.parseFloat(styles.outlineWidth) +
          Number.parseFloat(styles.outlineOffset);
        const ring = {
          bottom: controlRect.bottom + ringExtent,
          left: controlRect.left - ringExtent,
          right: controlRect.right + ringExtent,
          top: controlRect.top - ringExtent,
        };
        const clippingAncestors: string[] = [];

        for (
          let ancestor = element.parentElement;
          ancestor !== null;
          ancestor = ancestor.parentElement
        ) {
          const ancestorStyles = getComputedStyle(ancestor);
          if (
            ancestorStyles.overflowX === "visible" &&
            ancestorStyles.overflowY === "visible"
          )
            continue;

          const ancestorRect = ancestor.getBoundingClientRect();
          if (
            ring.left < ancestorRect.left ||
            ring.right > ancestorRect.right ||
            ring.top < ancestorRect.top ||
            ring.bottom > ancestorRect.bottom
          )
            clippingAncestors.push(ancestor.tagName);
        }

        return {
          outlineWidth: styles.outlineWidth,
          outlineOffset: styles.outlineOffset,
          ringIsInsideViewport:
            ring.left >= 0 &&
            ring.right <= window.innerWidth &&
            ring.top >= 0 &&
            ring.bottom <= window.innerHeight,
          clippingAncestors,
        };
      }),
    )
    .toEqual({
      outlineWidth: "2px",
      outlineOffset: "2px",
      ringIsInsideViewport: true,
      clippingAncestors: [],
    });
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
  const total = `${order.total} ₽`;
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
