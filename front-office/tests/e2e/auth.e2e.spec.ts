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

  await page.getByText("Оформить заказ", { exact: true }).click();
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
  await page.getByRole("button", { name: "Выйти" }).click();
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
  for (const width of [390, 700]) {
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
    await expect(
      page.getByRole("button", { name: "Подтвердить телефон" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Корзина" })).toBeVisible();
    await expect(phone).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Отправить код" }),
    ).toBeDisabled();
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
    await page.getByRole("button", { name: "Отправить код" }).click();

    const otp = page.getByLabel("Код из сообщения", { exact: true });
    await expect(
      page.getByRole("heading", { name: "Введите код из сообщения" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Подтвердить телефон" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Корзина" })).toBeVisible();
    await expect(otp).toBeFocused();
    await expect(
      page
        .locator(".auth-form:visible")
        .getByRole("button", { name: "Подтвердить", exact: true }),
    ).toBeDisabled();

    const geometry = await page.evaluate(() => {
      const rect = (element: Element | null) => {
        if (!element) throw new Error("Не найден элемент auth-геометрии.");

        return element.getBoundingClientRect();
      };
      const field = document.querySelector<HTMLInputElement>(
        'input[aria-label="Код из сообщения"]',
      );
      const authScreen = document.querySelector(".auth-screen");
      const authContent = document.querySelector(".auth-content");
      const app = document.querySelector("#app");
      const header = document.querySelector(".shell-navigation__mobile-header");
      const shellContent = document.querySelector(".customer-shell__content");
      const stateIcon = document.querySelector(".state-icon");
      const primary = document.querySelector<HTMLButtonElement>(
        '.auth-form button[type="submit"]',
      );
      const fieldRect = rect(field?.closest(".v-field"));
      const fieldFieldRect = rect(field?.parentElement);
      const controlRect = rect(field?.closest(".v-input__control"));
      const authScreenRect = rect(authScreen);
      const authContentRect = rect(authContent);
      const iconRect = rect(stateIcon);
      const primaryRect = rect(primary);
      const computed = getComputedStyle(field?.closest(".v-field") as Element);

      return {
        centerResidual: Math.abs(
          authContentRect.y +
            authContentRect.height / 2 -
            (authScreenRect.y + authScreenRect.height / 2),
        ),
        fieldHeights: [
          fieldFieldRect.height,
          fieldRect.height,
          controlRect.height,
        ],
        fontFamily: getComputedStyle(authContent).fontFamily,
        iconHeight: iconRect.height,
        appScrollTop: app?.scrollTop,
        authScreenTop: authScreenRect.top,
        headerTop: header?.getBoundingClientRect().top,
        headerVisibleAtCenter:
          header !== null &&
          header.contains(
            document.elementFromPoint(
              header.getBoundingClientRect().x +
                header.getBoundingClientRect().width / 2,
              header.getBoundingClientRect().y +
                header.getBoundingClientRect().height / 2,
            ),
          ),
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        paddingBottom: computed.getPropertyValue("--v-field-padding-bottom"),
        paddingTop: computed.getPropertyValue("--v-input-padding-top"),
        primaryHeight: primaryRect.height,
        scrollY: window.scrollY,
        shellContentScrollTop: shellContent?.scrollTop,
      };
    });

    expect(geometry.fieldHeights).toEqual([54, 54, 54]);
    expect(geometry.iconHeight).toBe(76);
    expect(geometry.primaryHeight).toBe(52);
    expect(geometry.appScrollTop).toBe(0);
    expect(geometry.authScreenTop).toBe(width < 480 ? 56 : 80);
    expect(geometry.headerTop).toBe(width < 480 ? 0 : 24);
    expect(geometry.headerVisibleAtCenter).toBe(true);
    expect(geometry.paddingBottom).toBe("0");
    expect(geometry.paddingTop).toBe("0");
    expect(geometry.centerResidual).toBeLessThanOrEqual(2);
    expect(geometry.fontFamily).toContain("Nunito");
    expect(geometry.overflow).toBe(false);
    expect(geometry.scrollY).toBe(0);
    expect(geometry.shellContentScrollTop).toBe(0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page).toHaveScreenshot(`auth-otp-empty-${width}.png`, {
      animations: "disabled",
      fullPage: false,
      maxDiffPixelRatio: 0.01,
    });

    await context.close();
  }
});

async function login(page: Page, phone: string): Promise<string> {
  const otpResponse = page.waitForResponse((response) =>
    response.url().endsWith("/auth/otp/request"),
  );
  await page.getByLabel("Номер телефона").fill(phone);
  await page.getByRole("button", { name: "Отправить код" }).click();
  const response = await otpResponse;
  expect(response.status()).toBe(202);
  expect(await response.text()).not.toContain(developmentOtp);
  const user = currentUser(page);
  await page.getByLabel("Код из сообщения").fill(developmentOtp);
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
