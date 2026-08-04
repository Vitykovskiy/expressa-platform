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

  const cooldown = await page.request.post(
    `${frontOfficeApiOrigin}/api/v1/auth/otp/request`,
    { data: { phone }, headers: { Origin: frontOfficeOrigin } },
  );
  expect(cooldown.status()).toBe(429);
  moveOtpChallengeOutsideCooldown(phone);

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
    `${frontOfficeApiOrigin}/api/v1/auth/refresh`,
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
  await page.getByRole("button", { name: "Подтвердить" }).click();

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

function moveOtpChallengeOutsideCooldown(phone: string): void {
  runDatabaseCommand(
    `UPDATE otp_challenges SET sent_at = CURRENT_TIMESTAMP - INTERVAL '61 seconds' WHERE phone_e164 = '${phone}';`,
  );
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
