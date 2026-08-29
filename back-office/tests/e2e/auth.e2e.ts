import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, unlinkSync } from "node:fs";

import { expect, test } from "@playwright/test";

import {
  authBackendUrl,
  authBackendReadyUrl,
  authBackendPidPath,
  authComposeProjectName,
  authDatabaseUrl,
  authOrigin,
  authServerEnvironment,
} from "../../playwright.config.constants";
import {
  authApiPath,
  authResponseTimeoutMessage,
  backendShutdownAttempts,
  backendShutdownDelayMilliseconds,
  databaseCleanupStatement,
  developmentOtp,
  expectedUnauthorizedConsoleMessage,
  otpRequestPath,
  otpVerifyPath,
  phonePrefix,
  refreshPath,
} from "./auth.e2e.constants";
import type {
  AuthEvidence,
  AuthPage,
  AuthResponse,
  StaffRole,
} from "./auth.e2e.types";

const phones = new Set<string>();

test.afterAll(async () => {
  await stopAuthBackend();
  execFileSync(
    "docker",
    [
      "compose",
      "-p",
      authComposeProjectName,
      "-f",
      "../backend/compose.local.yml",
      "-f",
      "playwright.auth.compose.yml",
      "down",
      "--volumes",
    ],
    { stdio: "inherit" },
  );
  unlinkSync(authBackendPidPath);
});

test.afterEach(() => {
  const values = [...phones];
  phones.clear();
  if (values.length === 0) return;

  execFileSync(
    "docker",
    [
      "compose",
      "-p",
      authComposeProjectName,
      "-f",
      "../backend/compose.local.yml",
      "-f",
      "playwright.auth.compose.yml",
      "exec",
      "-T",
      "postgres",
      "psql",
      "-U",
      "expressa",
      "-d",
      "expressa",
      "-c",
      databaseCleanupStatement(values),
    ],
    { stdio: "inherit" },
  );
});

test("auth и роли back-office работают через backend", async ({ page }) => {
  const customer = phone();
  const barista = phone();
  const administrator = phone();
  createStaff(barista, "barista");
  createStaff(administrator, "administrator");

  const evidence = observeAuthentication(page);

  await login(page, customer, evidence);
  await expect(
    page.getByRole("heading", { name: "Доступ запрещён" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Очередь" })).toHaveCount(0);

  await page.getByRole("button", { name: "Попробовать снова" }).click();
  const firstRefresh = await login(page, barista, evidence);
  await expect(page.getByRole("heading", { name: "Заказы" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Доступность" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Меню" })).toHaveCount(0);
  await page.goto("/menu");
  await expect(page).toHaveURL(/\/queue$/);

  const refreshResponsesBeforeReload = countResponses(evidence, refreshPath);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Заказы" })).toBeVisible();
  const refreshed = await findResponse(
    evidence,
    refreshPath,
    refreshResponsesBeforeReload,
  );
  const currentRefresh = await refreshCookie(refreshed);
  expect(
    (
      await page.request.post(`${authBackendUrl}/api/v2/auth/refresh`, {
        headers: { cookie: firstRefresh, origin: authOrigin },
      })
    ).status(),
  ).toBe(401);
  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    (
      await page.request.post(`${authBackendUrl}/api/v2/auth/refresh`, {
        headers: { cookie: currentRefresh, origin: authOrigin },
      })
    ).status(),
  ).toBe(401);

  await login(page, administrator, evidence);
  await expect(page.getByRole("button", { name: "Меню" })).toBeVisible();
  await expectOtpNotExposed(evidence);
});

async function login(
  page: AuthPage,
  phone: string,
  evidence: AuthEvidence,
): Promise<string> {
  const readiness = await page.request.get(authBackendReadyUrl);
  expect(readiness.ok()).toBe(true);
  await page.goto("/login");
  await page.getByLabel("Телефон").fill(phone);
  const sendCode = page.getByRole("button", { name: "Отправить код" });
  await expect(sendCode).toBeEnabled();
  const [requested] = await Promise.all([
    page.waitForResponse((response) => response.url().includes(otpRequestPath)),
    sendCode.click(),
  ]);
  evidence.responseBodies.push(await requested.text());
  await expectOtpStep(page, evidence);
  expect(requested.status()).toBe(202);
  await page.getByLabel("Код из сообщения").fill(developmentOtp);
  const verify = page.getByRole("button", { name: "Подтвердить" });
  await expect(verify).toBeEnabled();
  const [verified] = await Promise.all([
    page.waitForResponse((response) => response.url().includes(otpVerifyPath)),
    verify.click(),
  ]);
  evidence.responseBodies.push(await verified.text());
  expect(verified.status()).toBe(200);
  return refreshCookie(verified);
}

function phone(): string {
  const value = `${phonePrefix}${randomUUID().replace(/\D/g, "").slice(0, 7).padStart(7, "0")}`;
  phones.add(value);
  return value;
}

function createStaff(phone: string, role: StaffRole): void {
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
      phone,
      "--role",
      role,
    ],
    {
      env: {
        ...process.env,
        AUTH_ACCESS_TOKEN_SECRET: "back-office-e2e-access-token-secret",
        AUTH_DEVELOPMENT_OTP: developmentOtp,
        AUTH_OTP_PEPPER: "back-office-e2e-otp-pepper",
        CORS_ORIGINS: authOrigin,
        DATABASE_URL: authDatabaseUrl,
        NODE_ENV: "local",
        PORT: "3000",
        VAPID_PRIVATE_KEY: authServerEnvironment.VAPID_PRIVATE_KEY,
        VAPID_PUBLIC_KEY: authServerEnvironment.VAPID_PUBLIC_KEY,
        VAPID_SUBJECT: authServerEnvironment.VAPID_SUBJECT,
      },
      stdio: "inherit",
    },
  );
}

async function refreshCookie(response: AuthResponse): Promise<string> {
  const cookie = await response.headerValue("set-cookie");
  if (cookie === null) throw new Error("Refresh cookie is missing");
  return cookie.split(";")[0] ?? "";
}

function observeAuthentication(page: AuthPage): AuthEvidence {
  const evidence: AuthEvidence = {
    consoleErrors: [],
    consoleMessages: [],
    requests: [],
    requestFailures: [],
    responseBodies: [],
    responses: [],
  };

  page.on("console", (message) => {
    evidence.consoleMessages.push(message.text());
    if (message.type() === "error") evidence.consoleErrors.push(message.text());
  });
  page.on("request", (request) => {
    if (request.url().includes(authApiPath))
      evidence.requests.push(`${request.method()} ${request.url()}`);
  });
  page.on("requestfailed", (request) =>
    evidence.requestFailures.push(
      `${request.method()} ${request.url()}: ${request.failure()?.errorText ?? "unknown"}`,
    ),
  );
  page.on("response", (response) => {
    if (!response.url().includes(authApiPath)) return;

    evidence.responses.push(response);
  });

  return evidence;
}

function countResponses(evidence: AuthEvidence, path: string): number {
  return evidence.responses.filter((response) => response.url().includes(path))
    .length;
}

async function findResponse(
  evidence: AuthEvidence,
  path: string,
  previousCount: number,
): Promise<AuthResponse> {
  await expect
    .poll(() => countResponses(evidence, path))
    .toBeGreaterThan(previousCount);

  const response = evidence.responses.filter((value) =>
    value.url().includes(path),
  )[previousCount];

  if (response === undefined) throw new Error(authResponseTimeoutMessage);
  return response;
}

async function expectOtpNotExposed(evidence: AuthEvidence): Promise<void> {
  expect(
    [...evidence.responseBodies, ...evidence.consoleMessages].join("\n"),
  ).not.toContain(developmentOtp);
  expect(
    evidence.consoleErrors.filter(
      (message) => message !== expectedUnauthorizedConsoleMessage,
    ),
  ).toEqual([]);
}

async function expectOtpStep(
  page: AuthPage,
  evidence: AuthEvidence,
): Promise<void> {
  try {
    await expect(page.getByLabel("Код из сообщения")).toBeVisible();
  } catch (error) {
    const responseStatuses = evidence.responses.map(
      (response) => `${response.status()} ${response.url()}`,
    );
    const diagnostics = [
      await page.locator("body").innerText(),
      ...responseStatuses,
      ...evidence.requests,
      ...evidence.requestFailures,
      ...evidence.consoleMessages,
    ];

    throw new Error(`${String(error)}\n${diagnostics.join("\n")}`, {
      cause: error,
    });
  }
}

async function stopAuthBackend(): Promise<void> {
  const backendPid = Number.parseInt(
    readFileSync(authBackendPidPath, "utf8"),
    10,
  );

  if (!Number.isSafeInteger(backendPid) || backendPid < 1) {
    throw new Error("Не удалось определить PID backend E2E.");
  }

  process.kill(backendPid, "SIGTERM");

  for (let attempt = 0; attempt < backendShutdownAttempts; attempt += 1) {
    if (!isProcessRunning(backendPid)) return;
    await new Promise((resolve) =>
      setTimeout(resolve, backendShutdownDelayMilliseconds),
    );
  }

  throw new Error("Backend E2E не завершился штатно.");
}

function isProcessRunning(processId: number): boolean {
  try {
    process.kill(processId, 0);
    return true;
  } catch {
    return false;
  }
}
