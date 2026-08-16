import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync, unlinkSync } from "node:fs";

import {
  expect,
  test,
  type Locator,
  type Request,
  type Response,
} from "@playwright/test";

import {
  catalogBackendPidPath,
  catalogComposeProjectName,
  catalogDatabaseUrl,
  catalogFrontendUrl,
  catalogOrigin,
  catalogServerEnvironment,
} from "../../playwright.config.constants";
import {
  catalogBackendUrl,
  catalogCategoryName,
  catalogModifierGroupName,
  catalogModifierOptionName,
  catalogModifierSecondOptionName,
  catalogProductNames,
  catalogSecondCategoryName,
  catalogUpdatedMediumPrice,
  catalogViewportHeight,
  catalogViewportWidths,
  developmentOtp,
  phonePrefix,
} from "./catalog.e2e.constants";
import type {
  BrowserIssue,
  CatalogPage,
  CatalogProductResponse,
} from "./catalog.e2e.types";

test.afterAll(async () => {
  await stopBackend();
  execFileSync(
    "docker",
    [
      "compose",
      "-p",
      catalogComposeProjectName,
      "-f",
      "../backend/compose.local.yml",
      "down",
      "--volumes",
    ],
    { stdio: "inherit" },
  );
});

test("production runtime компилирует Vuetify-диалог категории", async ({
  browser,
}) => {
  const administrator = phone();
  createStaff(administrator, "administrator");

  const context = await browser.newContext({
    viewport: { height: catalogViewportHeight, width: 1280 },
  });
  const page = await context.newPage();
  const issues = collectBrowserIssues(page);

  await login(page, administrator);
  await page.getByRole("button", { name: "Меню" }).click();
  await page
    .locator(".menu-page__actions")
    .getByRole("button", { name: "Добавить группу" })
    .click();

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".v-overlay--active .add-dialog")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator("*")
        .evaluateAll((elements) =>
          elements
            .map((element) => element.localName)
            .filter((name) => name.startsWith("v-")),
        ),
    )
    .toEqual([]);
  await expect(issues()).toEqual([]);
  await context.close();
});

test("administrator создаёт и публикует каталог для public menu", async ({
  browser,
}) => {
  const administrator = phone();
  const barista = phone();
  createStaff(administrator, "administrator");
  createStaff(barista, "barista");

  const adminContext = await browser.newContext({
    viewport: { height: catalogViewportHeight, width: 1280 },
  });
  const adminPage = await adminContext.newPage();
  const adminIssues = collectBrowserIssues(adminPage);
  await login(adminPage, administrator);
  await expect(adminPage.getByRole("button", { name: "Меню" })).toBeVisible();
  await adminPage.getByRole("button", { name: "Меню" }).click();
  await expect(adminPage.getByRole("heading", { name: "Меню" })).toBeVisible();

  await createCategory(adminPage);
  await createCategory(adminPage, catalogSecondCategoryName);
  await createModifierGroup(adminPage);
  await assignModifierGroup(adminPage);
  await createProduct(adminPage, catalogProductNames.drinkSizes, "DRINK", [
    "24000",
    "28000",
    "32000",
  ]);
  await createProduct(
    adminPage,
    catalogProductNames.drinkOnlyS,
    "DRINK",
    ["20000"],
    ["S"],
  );
  const editableDrink = await createProduct(
    adminPage,
    catalogProductNames.editableDrink,
    "DRINK",
    ["20000", "26000"],
    ["S", "M"],
    catalogSecondCategoryName,
  );
  await editProductSizes(adminPage, editableDrink);
  await createProduct(adminPage, catalogProductNames.other, "OTHER", ["18000"]);
  await reorderCatalog(adminPage);
  const frontContext = await browser.newContext({
    viewport: { height: catalogViewportHeight, width: 1280 },
  });
  const frontPage = await frontContext.newPage();
  const frontIssues = collectBrowserIssues(frontPage, {
    expectedOrderTotalChanged: true,
  });
  await prepareStaleCart(frontPage);
  await updateMediumPrice(adminPage);
  await confirmUpdatedTotal(frontPage);
  for (const width of catalogViewportWidths) {
    await adminPage.setViewportSize({ height: catalogViewportHeight, width });
    await expectNoHorizontalOverflow(adminPage, width);
  }
  await expect(adminIssues()).toEqual([]);

  const deniedContext = await browser.newContext({
    viewport: { height: catalogViewportHeight, width: 1280 },
  });
  const deniedPage = await deniedContext.newPage();
  await login(deniedPage, barista);
  await deniedPage.goto("/menu");
  await expect(deniedPage).toHaveURL(/\/queue$/);
  await deniedContext.close();

  for (const width of catalogViewportWidths) {
    await frontPage.setViewportSize({ height: catalogViewportHeight, width });
    await frontPage.goto(catalogFrontendUrl);
    await expect(
      frontPage.getByRole("heading", { name: /Что будем заказывать/ }),
    ).toBeVisible();
    await frontPage.getByRole("button", { name: catalogCategoryName }).click();
    await expect(
      frontPage.getByRole("button", { name: catalogProductNames.drinkSizes }),
    ).toContainText("S · 240 ₽");
    await expect(
      frontPage.getByRole("button", { name: catalogProductNames.drinkSizes }),
    ).toContainText("M · 281 ₽");
    await expect(
      frontPage.getByRole("button", { name: catalogProductNames.drinkSizes }),
    ).toContainText("L · 320 ₽");
    await expect(
      frontPage.getByRole("button", { name: catalogProductNames.drinkOnlyS }),
    ).toContainText("S · 200 ₽");
    await expect(
      frontPage.getByRole("button", { name: catalogProductNames.drinkOnlyS }),
    ).not.toContainText("M ·");
    await expect(
      frontPage.getByRole("button", { name: catalogProductNames.drinkOnlyS }),
    ).not.toContainText("L ·");
    await expect(
      frontPage.getByRole("button", { name: catalogProductNames.other }),
    ).toContainText("180 ₽");
    await expect(
      frontPage.getByRole("button", { name: catalogProductNames.other }),
    ).not.toContainText("S ·");
    await frontPage.goto(catalogFrontendUrl);
    await expect(
      frontPage.getByRole("heading", { name: /Что будем заказывать/ }),
    ).toBeVisible();
    await frontPage
      .getByRole("button", { name: catalogSecondCategoryName })
      .click();
    const editableDrink = frontPage.getByRole("button", {
      name: catalogProductNames.editableDrink,
    });
    await expect(editableDrink).toContainText("L · 300 ₽");
    await expect(editableDrink).toContainText("S · 200 ₽");
    expect(
      await editableDrink
        .locator(".product-card__price")
        .evaluateAll((prices) =>
          prices.map((price) => price.textContent?.replace(/\s+/g, " ").trim()),
        ),
    ).toEqual(["L · 300 ₽", "S · 200 ₽"]);
    await expectNoHorizontalOverflow(frontPage, width);
  }
  await frontPage.goto(catalogFrontendUrl);
  await frontPage.getByRole("button", { name: catalogCategoryName }).click();
  await frontPage
    .getByRole("button", { name: catalogProductNames.drinkSizes })
    .press("Enter");
  await expect(
    frontPage.getByRole("heading", { name: catalogProductNames.drinkSizes }),
  ).toBeVisible();
  await expect(
    frontPage.getByRole("button", { name: /Обычное молоко · 0 ₽/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await frontPage.keyboard.press("Tab");
  await expect(frontPage.locator(":focus")).toBeVisible();
  await expect(frontIssues()).toEqual([]);
  await frontContext.close();
  await adminContext.close();
});

async function login(page: CatalogPage, phoneNumber: string): Promise<void> {
  await expect(
    (await page.request.get(`${catalogBackendUrl}/health/ready`)).ok(),
  ).toBe(true);
  await page.goto("/login");
  await page.getByLabel("Телефон").fill(phoneNumber);
  await page.getByRole("button", { name: "Отправить код" }).click();
  await page.getByLabel("Код из сообщения").fill(developmentOtp);
  await page.getByRole("button", { name: "Подтвердить" }).click();
  await expect(page.getByRole("heading", { name: "Очередь" })).toBeVisible();
}

async function createCategory(
  page: CatalogPage,
  name = catalogCategoryName,
): Promise<void> {
  await page
    .locator(".menu-page__actions")
    .getByRole("button", { name: "Добавить группу" })
    .click();
  const dialog = page.locator(".add-dialog:visible");
  await dialog.getByLabel("Название категории").fill(name);
  const [response] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.request().method() === "POST" &&
        candidate.url().endsWith("/api/v1/backoffice/catalog/categories"),
    ),
    dialog.getByRole("button", { name: "Добавить категорию" }).click(),
  ]);
  expect(response.status()).toBe(201);
  await expect(categoryToggle(page, name)).toBeVisible();
}

async function createModifierGroup(page: CatalogPage): Promise<void> {
  const editor = page.locator(".modifier-group-editor");
  const aggregateRequests: Request[] = [];
  const optionReorderRequests: Request[] = [];
  const trackModifierRequests = (request: Request) => {
    if (
      request.method() === "POST" &&
      request.url().endsWith("/api/v1/backoffice/catalog/modifier-groups")
    )
      aggregateRequests.push(request);
    if (request.url().includes("/modifier-groups/options/reorder"))
      optionReorderRequests.push(request);
  };
  page.on("request", trackModifierRequests);
  await openMenuManagement(page);
  await page.getByRole("button", { name: "Новая группа опций" }).click();
  await editor
    .getByLabel("Название", { exact: true })
    .fill(catalogModifierGroupName);
  await editor.getByLabel("Выбор обязателен").click();
  await editor.getByRole("button", { name: "Добавить вариант" }).click();
  const options = editor.locator(".modifier-option-editor");
  await options
    .nth(0)
    .getByLabel("Название", { exact: true })
    .fill(catalogModifierOptionName);
  await options.nth(0).getByLabel("Изменение цены, коп.").fill("0");
  await options.nth(0).getByLabel("Выбран по умолчанию").click();
  await editor.getByRole("button", { name: "Добавить вариант" }).click();
  await options
    .nth(1)
    .getByLabel("Название", { exact: true })
    .fill(catalogModifierSecondOptionName);
  await options.nth(1).getByLabel("Изменение цены, коп.").fill("0");
  await editor
    .getByRole("button", {
      name: `Переместить ${catalogModifierOptionName} вниз`,
    })
    .click();
  expect(await modifierOptionNames(editor)).toEqual([
    catalogModifierSecondOptionName,
    catalogModifierOptionName,
  ]);
  const [response] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.request().method() === "POST" &&
        candidate.url().endsWith("/api/v1/backoffice/catalog/modifier-groups"),
    ),
    editor.getByRole("button", { name: "Сохранить группу" }).click(),
  ]);
  expect(response.status()).toBe(201);
  expect(aggregateRequests).toHaveLength(1);
  expect(optionReorderRequests).toHaveLength(0);
  expect(JSON.parse(response.request().postData() ?? "")).toMatchObject({
    options: [
      { name: catalogModifierSecondOptionName, sortOrder: 0 },
      { name: catalogModifierOptionName, sortOrder: 1 },
    ],
  });
  page.off("request", trackModifierRequests);
  await expect(modifierGroupEditButton(page)).toBeVisible();
  await page.goto("/menu");
  await openMenuManagement(page);
  await modifierGroupEditButton(page).click();
  await expect
    .poll(() => modifierOptionNames(page.locator(".modifier-group-editor")))
    .toEqual([catalogModifierSecondOptionName, catalogModifierOptionName]);
  await editor.getByRole("button", { name: "Отмена" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
}

async function assignModifierGroup(page: CatalogPage): Promise<void> {
  await openMenuManagement(page);
  await page
    .getByRole("heading", { name: "Назначения категорий", exact: true })
    .locator("..")
    .getByRole("button", { name: catalogCategoryName, exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: catalogModifierGroupName, exact: true })
    .check();
  await page.getByRole("button", { name: "Сохранить назначения" }).click();
}

function categoryToggle(page: CatalogPage, name = catalogCategoryName) {
  return page.locator(".menu-category__toggle", {
    hasText: name,
  });
}

function modifierGroupEditButton(page: CatalogPage) {
  return page.getByRole("button", {
    name: `Редактировать группу опций ${catalogModifierGroupName}`,
    exact: true,
  });
}

async function createProduct(
  page: CatalogPage,
  name: string,
  type: "DRINK" | "OTHER",
  prices: readonly string[],
  configuredSizes: readonly ("S" | "M" | "L")[] = ["S", "M", "L"],
  categoryName = catalogCategoryName,
): Promise<CatalogProductResponse> {
  await page
    .locator(".menu-page__actions")
    .getByRole("button", { name: "Добавить товар" })
    .click();
  const dialog = page.locator(".add-dialog:visible");
  await dialog
    .getByLabel("Категория", { exact: true })
    .selectOption({ label: categoryName });
  await dialog.getByLabel("Тип товара").selectOption(type);
  await dialog.getByLabel("Название товара").fill(name);
  if (type === "DRINK") {
    const sizes = ["S", "M", "L"] as const;
    for (const size of sizes) {
      if (!configuredSizes.includes(size)) {
        await dialog.getByLabel(`Использовать размер ${size}`).click();
        continue;
      }
      const price = prices[configuredSizes.indexOf(size)] ?? "";
      await dialog.getByLabel(`Цена ${size}, коп.`).fill(price);
    }
  } else {
    await dialog.getByLabel("Цена, коп.").fill(prices[0] ?? "");
  }
  const [response] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.request().method() === "POST" &&
        candidate.url().endsWith("/api/v1/backoffice/catalog/products"),
    ),
    dialog.getByRole("button", { name: "Добавить товар" }).click(),
  ]);
  if (response.status() !== 201)
    throw new Error(
      `Создание товара вернуло ${response.status()}: ${await response.text()}`,
    );
  const payload = JSON.parse(response.request().postData() ?? "");
  if (type === "DRINK")
    expect(payload.variants).toEqual(
      configuredSizes.map((size, sortOrder) => ({
        isAvailable: true,
        priceMinor: Number(prices[sortOrder]),
        size,
        sortOrder,
      })),
    );
  const product = await readCatalogProduct(response);
  if (
    (await categoryToggle(page, categoryName).getAttribute("aria-expanded")) !==
    "true"
  )
    await categoryToggle(page, categoryName).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  return product;
}

async function editProductSizes(
  page: CatalogPage,
  product: CatalogProductResponse,
): Promise<void> {
  const initialS = product.variants.find((variant) => variant.size === "S");
  const initialM = product.variants.find((variant) => variant.size === "M");
  expect(initialS?.sortOrder).toBe(0);
  expect(initialM?.sortOrder).toBe(1);
  expect(initialS?.id).toMatch(/^[0-9a-f-]{36}$/i);
  expect(initialM?.id).toMatch(/^[0-9a-f-]{36}$/i);

  await page
    .getByRole("button", {
      name: `Редактировать товар ${catalogProductNames.editableDrink}`,
    })
    .click();
  const dialog = page
    .locator(".edit-dialog:visible")
    .filter({ hasText: "Размеры и цены, коп." });
  await dialog.getByLabel("Использовать размер M").click();
  await dialog.getByLabel("Использовать размер L").click();
  const largeSize = dialog
    .locator(".size-row")
    .filter({ hasText: "Использовать размер L" });
  await largeSize.getByLabel("Цена L, коп.").fill("30000");
  await largeSize.getByLabel("Размер L доступен", { exact: true }).click();
  await dialog.getByRole("button", { name: "Поднять размер L" }).click();
  const [response] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.request().method() === "PATCH" &&
        /\/api\/v1\/backoffice\/catalog\/products\/.+/.test(candidate.url()),
    ),
    dialog.getByRole("button", { name: "Сохранить изменения" }).click(),
  ]);
  expect(response.status()).toBe(200);
  expect(JSON.parse(response.request().postData() ?? "").variants).toEqual([
    { isAvailable: true, priceMinor: 30000, size: "L", sortOrder: 0 },
    {
      id: initialS?.id,
      isAvailable: true,
      priceMinor: 20000,
      size: "S",
      sortOrder: 1,
    },
  ]);
  const updated = await readCatalogProduct(response);
  expect(updated.variants.map((variant) => variant.size)).toEqual(["L", "S"]);
  expect(updated.variants[1]?.id).toBe(initialS?.id);

  await page.goto("/menu");
  await categoryToggle(page, catalogSecondCategoryName).click();
  await expect(
    page.getByRole("button", {
      name: `Редактировать товар ${catalogProductNames.editableDrink}`,
    }),
  ).toContainText("L: 300 ₽ · S: 200 ₽");
}

async function readCatalogProduct(
  response: Response,
): Promise<CatalogProductResponse> {
  const value: unknown = await response.json();
  if (!isCatalogProductResponse(value))
    throw new Error("Ответ catalog product не содержит UUID и варианты.");
  return value;
}

function isCatalogProductResponse(
  value: unknown,
): value is CatalogProductResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "variants" in value &&
    Array.isArray(value.variants) &&
    value.variants.every(
      (variant) =>
        typeof variant === "object" &&
        variant !== null &&
        "id" in variant &&
        typeof variant.id === "string" &&
        "isAvailable" in variant &&
        typeof variant.isAvailable === "boolean" &&
        "priceMinor" in variant &&
        typeof variant.priceMinor === "number" &&
        "size" in variant &&
        (variant.size === "S" ||
          variant.size === "M" ||
          variant.size === "L") &&
        "sortOrder" in variant &&
        typeof variant.sortOrder === "number",
    )
  );
}

async function reorderCatalog(page: CatalogPage): Promise<void> {
  await openMenuManagement(page);
  const [categoryResponse] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.request().method() === "POST" &&
        candidate
          .url()
          .endsWith("/api/v1/backoffice/catalog/categories/reorder"),
    ),
    page
      .getByRole("button", {
        name: `Переместить категорию ${catalogCategoryName} вниз`,
      })
      .click(),
  ]);
  expect(categoryResponse.status()).toBe(200);
  await expect
    .poll(() => categoryNames(page))
    .toEqual([catalogSecondCategoryName, catalogCategoryName]);

  const [productResponse] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.request().method() === "POST" &&
        candidate.url().endsWith("/api/v1/backoffice/catalog/products/reorder"),
    ),
    page
      .getByRole("button", {
        name: `Переместить товар ${catalogProductNames.other} вверх`,
      })
      .click(),
  ]);
  expect(productResponse.status()).toBe(200);
  await expect
    .poll(() => productNames(page))
    .toEqual([
      catalogProductNames.drinkSizes,
      catalogProductNames.other,
      catalogProductNames.drinkOnlyS,
    ]);

  await page.goto("/menu");
  await expect
    .poll(() => categoryNames(page))
    .toEqual([catalogSecondCategoryName, catalogCategoryName]);
  await categoryToggle(page).click();
  await expect
    .poll(() => productNames(page))
    .toEqual([
      catalogProductNames.drinkSizes,
      catalogProductNames.other,
      catalogProductNames.drinkOnlyS,
    ]);
}

async function openMenuManagement(page: CatalogPage): Promise<void> {
  const toggle = page.getByRole("button", { name: "Управление меню" });

  if ((await toggle.getAttribute("aria-expanded")) !== "true") {
    await toggle.click();
  }

  await expect(
    page.getByRole("region", { name: "Управление меню" }),
  ).toBeVisible();
}

async function updateMediumPrice(page: CatalogPage): Promise<void> {
  await page
    .getByRole("button", {
      name: `Редактировать товар ${catalogProductNames.drinkSizes}`,
    })
    .click();
  const dialog = page
    .locator(".edit-dialog:visible")
    .filter({ hasText: "Размеры и цены, коп." });
  await dialog.getByLabel("Цена M, коп.").fill(catalogUpdatedMediumPrice);
  const [response] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.request().method() === "PATCH" &&
        /\/api\/v1\/backoffice\/catalog\/products\/.+/.test(candidate.url()),
    ),
    dialog.getByRole("button", { name: "Сохранить изменения" }).click(),
  ]);
  expect(response.status()).toBe(200);
  await page.goto("/menu");
  await categoryToggle(page).click();
  await expect(
    page.getByRole("button", {
      name: `Редактировать товар ${catalogProductNames.drinkSizes}`,
    }),
  ).toContainText("M: 281 ₽");
}

async function prepareStaleCart(page: CatalogPage): Promise<void> {
  await page.goto(catalogFrontendUrl);
  await page.getByRole("button", { name: catalogCategoryName }).click();
  await page
    .getByRole("button", { name: catalogProductNames.drinkSizes })
    .click();
  await page.getByRole("button", { name: /M · 280 ₽/ }).click();
  await page.getByRole("button", { name: /Добавить/ }).click();
  await page.getByRole("link", { name: /Корзина/ }).click();
  await expect(
    page.getByLabel(`Позиция корзины: ${catalogProductNames.drinkSizes}`),
  ).toContainText("Размер M");
  await page.getByRole("button", { name: "Оформить заказ" }).click();
  await expect(page).toHaveURL(/\/auth\/phone\?returnTo=\/cart$/);
  await page.getByLabel("Номер телефона").fill(phone());
  await page.getByRole("button", { name: "Отправить код" }).click();
  await page.getByLabel("Код из сообщения").fill(developmentOtp);
  await page.getByRole("button", { name: "Подтвердить" }).click();
  await expect(page).toHaveURL(/\/cart$/);
}

async function confirmUpdatedTotal(page: CatalogPage): Promise<void> {
  const [changedResponse] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.request().method() === "POST" &&
        candidate.url().endsWith("/api/v1/orders") &&
        candidate.status() === 400,
    ),
    page.getByRole("button", { name: "Оформить заказ" }).click(),
  ]);
  expect(await changedResponse.json()).toMatchObject({
    code: "ORDER_TOTAL_CHANGED",
    details: { totalMinor: Number(catalogUpdatedMediumPrice) },
  });
  await expect(page.getByText("Итог изменился")).toBeVisible();
  const changedTotal = page.getByLabel("Изменение итога заказа");
  await expect(changedTotal).toContainText("280 ₽");
  await expect(changedTotal).toContainText("281 ₽");
  await expect(page).not.toHaveURL(/\/orders\//);

  const [createdResponse] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.request().method() === "POST" &&
        candidate.url().endsWith("/api/v1/orders") &&
        candidate.status() === 201,
    ),
    page.getByRole("button", { name: "Подтвердить новый итог" }).click(),
  ]);
  expect(createdResponse.status()).toBe(201);
  await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);
  await expect(page.getByText("Заказ принят")).toBeVisible();
}

async function categoryNames(page: CatalogPage): Promise<string[]> {
  return page.locator(".menu-category__name").allTextContents();
}

async function productNames(page: CatalogPage): Promise<string[]> {
  return page
    .locator(".menu-category", { hasText: catalogCategoryName })
    .locator(".menu-product-row__name")
    .allTextContents();
}

async function modifierOptionNames(editor: Locator): Promise<string[]> {
  return editor
    .locator(".modifier-option-editor")
    .getByLabel("Название", { exact: true })
    .evaluateAll((inputs) =>
      inputs.map((input) => (input as HTMLInputElement).value),
    );
}

function createStaff(
  phoneNumber: string,
  role: "administrator" | "barista",
): void {
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
      role,
    ],
    {
      env: {
        ...process.env,
        ...catalogServerEnvironment,
        AUTH_ACCESS_TOKEN_SECRET:
          "changeme-back-office-catalog-e2e-access-token-secret",
        AUTH_DEVELOPMENT_OTP: developmentOtp,
        AUTH_OTP_PEPPER: "back-office-catalog-e2e-otp-pepper",
        CORS_ORIGINS: `${catalogOrigin},${catalogFrontendUrl}`,
        ["DATABASE_URL"]: catalogDatabaseUrl,
        NODE_ENV: "local",
        PORT: "3001",
      },
      stdio: "inherit",
    },
  );
}

function phone(): string {
  return `${phonePrefix}${randomUUID().replace(/\D/g, "").slice(0, 7).padStart(7, "0")}`;
}

function collectBrowserIssues(
  page: CatalogPage,
  options: { expectedOrderTotalChanged?: boolean } = {},
): () => BrowserIssue[] {
  const issues: BrowserIssue[] = [];
  page.on("response", (response) => {
    if (
      response.status() === 401 &&
      new URL(response.url()).pathname === "/api/v1/auth/refresh"
    )
      return;
    if (
      response.status() === 400 &&
      new URL(response.url()).pathname === "/api/v1/orders"
    )
      return;
    if (response.status() >= 400)
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
      message.text() ===
        "Failed to load resource: the server responded with a status of 401 (Unauthorized)"
    )
      return;
    if (
      options.expectedOrderTotalChanged &&
      message.type() === "error" &&
      message.text() ===
        "Failed to load resource: the server responded with a status of 400 (Bad Request)"
    )
      return;
    if (message.type() === "error")
      issues.push({ source: "console", text: message.text() });
  });
  page.on("pageerror", (error) =>
    issues.push({ source: "page", text: error.message }),
  );
  return () => issues;
}

async function expectNoHorizontalOverflow(
  page: CatalogPage,
  width: number,
): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(width);
}

async function stopBackend(): Promise<void> {
  const processId = Number.parseInt(
    readFileSync(catalogBackendPidPath, "utf8"),
    10,
  );
  if (Number.isSafeInteger(processId) && processId > 0)
    process.kill(processId, "SIGTERM");
  try {
    unlinkSync(catalogBackendPidPath);
  } catch {
    // Playwright can stop the web server before this hook on startup failure.
  }
}
