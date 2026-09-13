import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import { frontOfficeE2eComposeProjectName } from "../../playwright.config.constants";
import {
  authenticationTestTimeout,
  cartStorageKey,
  developmentOtp,
  frontOfficeApiOrigin,
  frontOfficeOrigin,
  invalidCurrentUserResponseMessage,
  phonePrefix,
  testCartItems,
} from "./auth.e2e.constants";
import type { CurrentUserResponse } from "./auth.e2e.types";

const phones = new Set<string>();

test.setTimeout(authenticationTestTimeout);

test.afterEach(() => {
  const values = [...phones];
  phones.clear();

  if (values.length === 0) return;

  runDatabaseCommand(createDatabaseCleanupStatement(values));
});

test("сохраняет гостевую корзину через вход, refresh и logout", async ({
  context,
  page,
}) => {
  const phone = createPhone();
  const consoleMessages: string[] = [];
  page.on("console", (message) => consoleMessages.push(message.text()));
  await page.setViewportSize({ height: 844, width: 1024 });
  await page.addInitScript(
    ({ items, storageKey }) => {
      localStorage.setItem(storageKey, JSON.stringify(items));
    },
    { items: testCartItems, storageKey: cartStorageKey },
  );

  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "Корзина" })).toBeVisible();
  await expect(page.getByText("E2E напиток")).toBeVisible();
  await expect(page.getByLabel("Количество", { exact: true })).toContainText(
    "2",
  );

  await page.getByRole("button", { name: "Подтвердить телефон" }).click();
  await expect(page).toHaveURL(/\/auth\/phone\?returnTo=\/cart/);
  const firstUser = await login(page, phone);
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByLabel("Количество", { exact: true })).toContainText(
    "2",
  );

  const refreshedRequests: string[] = [];
  page.on("request", (request) => refreshedRequests.push(request.url()));
  const refreshedUser = currentUser(page);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Корзина" })).toBeVisible();
  await expect
    .poll(() => refreshedRequests.some((url) => url.endsWith("/auth/refresh")))
    .toBe(true);
  await expect
    .poll(() => refreshedRequests.some((url) => url.endsWith("/me")))
    .toBe(true);
  expect(await refreshedUser).toBe(firstUser);

  const oldRefresh = (await context.cookies()).find(
    (cookie) => cookie.name === "expressa_refresh",
  );
  expect(oldRefresh).toBeDefined();
  const logoutResponse = page.waitForResponse((response) =>
    response.url().endsWith("/auth/logout"),
  );
  await page.getByRole("button", { name: "Аккаунт" }).click();
  await page.getByRole("button", { name: "Выйти из аккаунта" }).click();
  expect((await logoutResponse).status()).toBe(204);
  await expect(page).toHaveURL(/\/$/);
  expect(await context.cookies()).not.toContainEqual(
    expect.objectContaining({ name: "expressa_refresh" }),
  );
  expect(
    await page.evaluate(
      (storageKey) => localStorage.getItem(storageKey),
      cartStorageKey,
    ),
  ).toBeNull();
  const oldRefreshResponse = await page.request.post(
    `${frontOfficeApiOrigin}/api/v2/auth/refresh`,
    {
      headers: {
        Cookie: `expressa_refresh=${oldRefresh?.value}`,
        Origin: frontOfficeOrigin,
      },
    },
  );
  expect(oldRefreshResponse.status()).toBe(401);

  await page.goto("/orders");
  await expect(page).toHaveURL(/\/auth\/phone\?returnTo=\/orders/);
  expect(await login(page, phone)).toBe(firstUser);
  expect(consoleMessages.join("\n")).not.toContain(developmentOtp);
});

test("фиксирует пустые экраны phone и OTP", async ({ browser }) => {
  for (const width of [
    320, 359, 360, 390, 479, 480, 700, 767, 768, 1023, 1024, 1440,
  ]) {
    const context = await browser.newContext({
      deviceScaleFactor: 1,
      viewport: { height: 844, width },
    });
    const page = await context.newPage();

    await page.route("**/api/v2/auth/refresh", (route) =>
      route.fulfill({
        body: "{}",
        contentType: "application/json",
        status: 401,
      }),
    );
    await page.route("**/api/v2/auth/otp/request", (route) =>
      route.fulfill({
        body: JSON.stringify({ expiresInSeconds: 300, retryAfterSeconds: 60 }),
        contentType: "application/json",
        status: 202,
      }),
    );
    await page.goto("/auth/phone");
    await page.emulateMedia({ reducedMotion: "reduce" });

    const phone = page.getByLabel("Номер телефона", { exact: true });
    await expect(
      page.getByRole("heading", { name: "Введите номер телефона" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Корзина" })).toBeVisible();
    await expect(phone).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Получить код" }),
    ).toBeDisabled();
    await expect(page.getByText("Отправить код", { exact: true })).toHaveCount(
      0,
    );
    await expect(
      page.getByText(
        "Подтверждение номера нужно для оформления заказа и истории заказов.",
        {
          exact: true,
        },
      ),
    ).toHaveCount(0);
    await expect(page.getByText("Номер телефона", { exact: true })).toHaveCount(
      0,
    );
    await expectMobileAuthHeader(page, width);
    const phonePresentation = await page.evaluate(() => {
      const authScreen = document.querySelector(".auth-screen");
      const authContent = document.querySelector(".auth-content");
      if (!authScreen || !authContent) {
        throw new Error("Не найдена auth-презентация.");
      }

      const screenRect = authScreen.getBoundingClientRect();
      const contentRect = authContent.getBoundingClientRect();

      return {
        centerResidual: Math.abs(
          contentRect.y +
            contentRect.height / 2 -
            (screenRect.y + screenRect.height / 2),
        ),
        fontFamily: getComputedStyle(authContent).fontFamily,
        scrollY: window.scrollY,
      };
    });

    expect(phonePresentation.centerResidual).toBeLessThanOrEqual(2);
    expect(phonePresentation.fontFamily).toContain("Nunito");
    expect(phonePresentation.scrollY).toBe(0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page).toHaveScreenshot(`auth-phone-empty-${width}.png`, {
      animations: "disabled",
      fullPage: false,
      maxDiffPixelRatio: 0.01,
    });

    await phone.fill("+79991234567");
    await page.getByRole("button", { name: "Получить код" }).click();

    const otp = page.getByLabel("Шестизначный код из сообщения", {
      exact: true,
    });
    await expect(
      page.getByRole("heading", { name: "Введите код" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Корзина" })).toBeVisible();
    await expect(otp).toBeFocused();
    await expect(
      page
        .locator(".auth-form:visible")
        .getByRole("button", { name: "Подтвердить", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByText("Введите код из сообщения", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Код из сообщения", { exact: true }),
    ).toHaveCount(0);
    await expect(page.getByText("Введите 6 цифр", { exact: true })).toHaveCount(
      0,
    );
    await expectMobileAuthHeader(page, width);

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page).toHaveScreenshot(`auth-otp-empty-${width}.png`, {
      animations: "disabled",
      fullPage: false,
      maxDiffPixelRatio: 0.01,
    });
    if (width < 1024) {
      await page.getByLabel("Перейти в меню").click();
      await expect(page).toHaveURL(/\/$/);
    }

    await context.close();
  }
});

async function expectMobileAuthHeader(
  page: Page,
  width: number,
): Promise<void> {
  const mobileHeader = page.locator(".shell-navigation__mobile-header");
  if (width >= 1024) {
    await expect(mobileHeader).toBeHidden();
    return;
  }

  const labels = ["Перейти в меню", "Аккаунт", "История заказов", "Корзина"];
  for (const label of labels) {
    await expect(mobileHeader.getByLabel(label, { exact: true })).toBeVisible();
  }

  const geometry = await mobileHeader.evaluate((header, expectedLabels) => {
    const rect = (element: Element) => {
      const { bottom, height, left, right, top, width } =
        element.getBoundingClientRect();
      return { bottom, height, left, right, top, width };
    };
    return {
      brand: (() => {
        const brand = header.querySelector(".shell-navigation__brand");
        if (brand === null) throw new Error("Не найден бренд header.");
        return {
          iconCount: brand.querySelectorAll("svg").length,
          left: brand.getBoundingClientRect().left,
        };
      })(),
      controls: expectedLabels.map((label) => {
        const control = header.querySelector(`[aria-label="${label}"]`);
        if (control === null) throw new Error(`Не найдена кнопка ${label}.`);
        return rect(control);
      }),
      header: rect(header),
      contentLeft:
        header.getBoundingClientRect().left +
        Number.parseFloat(getComputedStyle(header).paddingLeft),
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  }, labels);

  expect(geometry.viewportWidth).toBe(width);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(width);
  expect(geometry.brand.iconCount).toBe(0);
  expect(
    Math.abs(geometry.brand.left - geometry.contentLeft),
  ).toBeLessThanOrEqual(1);
  for (const control of geometry.controls) {
    expect(control.left).toBeGreaterThanOrEqual(0);
    expect(control.right).toBeLessThanOrEqual(width);
    expect(control.top).toBeGreaterThanOrEqual(geometry.header.top);
    expect(control.bottom).toBeLessThanOrEqual(geometry.header.bottom);
    expect(control.width).toBeGreaterThanOrEqual(44);
    expect(control.height).toBeGreaterThanOrEqual(44);
  }
}

async function login(page: Page, phone: string): Promise<string> {
  const otpResponse = page.waitForResponse((response) =>
    response.url().endsWith("/auth/otp/request"),
  );
  await page.getByLabel("Номер телефона").fill(phone);
  await page.getByRole("button", { name: "Получить код" }).click();
  const response = await otpResponse;
  expect(response.status()).toBe(202);
  expect(await response.text()).not.toContain(developmentOtp);
  const user = currentUser(page);
  await page.getByLabel("Шестизначный код из сообщения").fill(developmentOtp);
  await page
    .locator(".auth-form:visible")
    .getByRole("button", { name: "Подтвердить", exact: true })
    .click();

  return user;
}

async function currentUser(page: Page): Promise<string> {
  const response = await page.waitForResponse(
    (candidate) =>
      candidate.url().endsWith("/me") && candidate.status() === 200,
  );
  const body = parseCurrentUserResponse(await response.json());

  return body.id;
}

function parseCurrentUserResponse(value: unknown): CurrentUserResponse {
  if (!isCurrentUserResponse(value)) {
    throw new Error(invalidCurrentUserResponseMessage);
  }

  return value;
}

function isCurrentUserResponse(value: unknown): value is CurrentUserResponse {
  return isRecord(value) && typeof value.id === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createPhone(): string {
  const phone = `${phonePrefix}${randomUUID().replace(/\D/g, "").slice(0, 7).padStart(7, "0")}`;
  phones.add(phone);
  return phone;
}

function runDatabaseCommand(statement: string): void {
  execFileSync(
    "docker",
    [
      "compose",
      "-p",
      frontOfficeE2eComposeProjectName,
      "-f",
      "../backend/compose.local.yml",
      "exec",
      "-T",
      "postgres",
      "psql",
      "-U",
      "expressa",
      "-d",
      "expressa",
      "-c",
      statement,
    ],
    { stdio: "inherit" },
  );
}

function createDatabaseCleanupStatement(phones: readonly string[]): string {
  const quotedPhones = phones.map((phone) => `'${phone}'`).join(", ");

  return `DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE phone_e164 IN (${quotedPhones})); DELETE FROM otp_challenges WHERE phone_e164 IN (${quotedPhones}); DELETE FROM users WHERE phone_e164 IN (${quotedPhones});`;
}
