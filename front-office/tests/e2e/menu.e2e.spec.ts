import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  cartSummaries,
  configuredProductPrices,
  customerBreakpointWidths,
  expectedUnauthenticatedRefreshConsoleError,
  expectedUnauthenticatedRefreshOrigin,
  expectedUnauthenticatedRefreshPath,
  expectedUnauthenticatedRefreshStatus,
  menuFlowViewportWidths,
  menuViewportHeight,
  productNames,
  screenNames,
} from "./menu.e2e.constants";
import type { BrowserIssue } from "./menu.e2e.types";

test("меню добавляет M, only-S и OTHER на реальном seeded backend", async ({
  page,
}) => {
  const getBrowserIssues = collectBrowserIssues(page);

  for (const width of menuFlowViewportWidths) {
    await openCleanMenu(page, width);
    await expect(page.getByText(productNames.unpublished)).toHaveCount(0);

    const cappuccinoScrollY = await openProduct(
      page,
      screenNames.coffee,
      productNames.cappuccino,
    );
    await expect(
      page.getByRole("button", { name: /M · 320 ₽/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("button", { name: /Обычное молоко · 0 ₽/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: /L · 360 ₽/ }).click();
    await page.getByRole("button", { name: /Овсяное молоко · 80 ₽/ }).click();
    await expect(
      page.getByRole("button", { name: /L · 360 ₽/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("button", { name: /Овсяное молоко · 80 ₽/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await addAndExpectCategory(
      page,
      screenNames.coffee,
      width,
      cartSummaries.afterCappuccino,
      cappuccinoScrollY,
      configuredProductPrices.cappuccino,
    );

    await page.getByRole("button", { exact: true, name: "Назад" }).click();
    await expect(
      page.getByRole("heading", { name: screenNames.menu }),
    ).toBeVisible();
    const espressoScrollY = await openProduct(
      page,
      screenNames.coffee,
      productNames.espresso,
    );
    await expect(
      page.getByRole("button", { name: /S · 200 ₽/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: /Овсяное молоко · 80 ₽/ }).click();
    await expect(
      page.getByRole("button", { name: /Овсяное молоко · 80 ₽/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await addAndExpectCategory(
      page,
      screenNames.coffee,
      width,
      cartSummaries.afterEspresso,
      espressoScrollY,
      configuredProductPrices.espresso,
    );

    await page.getByRole("button", { exact: true, name: "Назад" }).click();
    const croissantScrollY = await openProduct(
      page,
      screenNames.bakery,
      productNames.croissant,
    );
    await expect(page.getByText("220 ₽", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Увеличить количество" }).click();
    await expect(page.getByLabel("Количество", { exact: true })).toContainText(
      "2",
    );
    await addAndExpectCategory(
      page,
      screenNames.bakery,
      width,
      cartSummaries.afterCroissant,
      croissantScrollY,
      configuredProductPrices.croissant,
    );
    await expectCartConfiguration(page);
  }

  expect(getBrowserIssues()).toEqual([]);
});

test("menu не получает horizontal overflow на declared breakpoints", async ({
  page,
}) => {
  for (const width of customerBreakpointWidths) {
    await openCleanMenu(page, width);
    await expectNoHorizontalOverflow(page, width);
  }
});

test("menu root, category and detail match visual baselines", async ({
  page,
}) => {
  for (const width of [390, 700]) {
    await openCleanMenu(page, width);
    await waitForFonts(page);
    await expect(page).toHaveScreenshot(`menu-root-${width}.png`, {
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
    });

    await page
      .locator(".menu-root__grid > li")
      .filter({ has: page.getByText(screenNames.coffee, { exact: true }) })
      .getByRole("button")
      .click();
    await expect(
      page.getByRole("heading", { name: screenNames.coffee }),
    ).toBeVisible();
    await expect(page).toHaveScreenshot(`menu-group-${width}.png`, {
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
    });

    await page.getByRole("button", { name: productNames.cappuccino }).click();
    await expect(
      page.getByRole("heading", { name: productNames.cappuccino }),
    ).toBeVisible();
    await expect(page).toHaveScreenshot(`menu-detail-${width}.png`, {
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
    });
  }
});

test("allowlist не пропускает public menu и foreign origin 401", () => {
  expect(
    isExpectedUnauthenticatedRefresh(
      401,
      "http://127.0.0.1:3000/api/v1/public/menu",
    ),
  ).toBe(false);
  expect(
    isExpectedUnauthenticatedRefresh(
      401,
      "https://foreign.example/api/v1/auth/refresh",
    ),
  ).toBe(false);
});

async function openCleanMenu(page: Page, width: number): Promise<void> {
  await page.setViewportSize({ height: menuViewportHeight, width });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(
    page.getByRole("heading", { name: screenNames.menu }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page, width);
}

async function openProduct(
  page: Page,
  categoryName: string,
  productName: string,
): Promise<number> {
  await page
    .locator(".menu-root__grid > li")
    .filter({ has: page.getByText(categoryName, { exact: true }) })
    .getByRole("button")
    .click();
  await expect(page.getByRole("heading", { name: categoryName })).toBeVisible();
  const scrollY = await page.evaluate(() => window.scrollY);
  await page.getByRole("button", { name: new RegExp(productName) }).click();
  await expect(page.getByRole("heading", { name: productName })).toBeVisible();

  return scrollY;
}

async function addAndExpectCategory(
  page: Page,
  categoryName: string,
  width: number,
  cartSummary: string,
  scrollY: number,
  configuredPrice: string,
): Promise<void> {
  const add = page.getByRole("button", { name: /Добавить/ });
  await expect(add).toBeVisible();
  await expect(add).toContainText(configuredPrice);
  await expect(page.getByRole("link", { name: /Корзина/ })).toHaveCount(0);
  await expectControlNotOccluded(page, add, "Добавить");
  await add.click();

  await expect(page.getByRole("heading", { name: categoryName })).toBeVisible();
  const cart = page.getByRole("link", {
    name: new RegExp(`Корзина · ${cartSummary}`),
  });
  await expect(cart).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollY);
  await expectControlNotOccluded(page, cart, "Корзина");
  await expectNoHorizontalOverflow(page, width);
}

async function expectCartConfiguration(page: Page): Promise<void> {
  await page.getByRole("link", { name: /Корзина · 4 · 1 160 ₽/ }).click();
  await expect(page).toHaveURL(/\/cart$/);

  const cappuccino = page.getByLabel("Позиция корзины: Капучино");
  await expect(cappuccino).toContainText("Размер L");
  await expect(cappuccino).toContainText("+ Овсяное молоко");
  await expect(cappuccino).toContainText(configuredProductPrices.cappuccino);
  await expect(
    cappuccino.getByLabel("Количество", { exact: true }),
  ).toContainText("1");

  const espresso = page.getByLabel("Позиция корзины: Эспрессо");
  await expect(espresso).toContainText("Размер S");
  await expect(espresso).toContainText("+ Овсяное молоко");
  await expect(espresso).toContainText(configuredProductPrices.espresso);
  await expect(
    espresso.getByLabel("Количество", { exact: true }),
  ).toContainText("1");

  const croissant = page.getByLabel("Позиция корзины: Круассан");
  await expect(croissant).toContainText(configuredProductPrices.croissant);
  await expect(
    croissant.getByLabel("Количество", { exact: true }),
  ).toContainText("2");
  await expect(page.getByLabel("Итого заказа")).toContainText("1 160 ₽");
}

async function expectControlNotOccluded(
  page: Page,
  control: Locator,
  expectedText: string,
): Promise<void> {
  await expect
    .poll(async () => {
      const box = await control.boundingBox();
      const viewport = page.viewportSize();
      if (box === null || viewport === null) return false;

      const isInsideViewport =
        box.x >= 0 &&
        box.y >= 0 &&
        box.x + box.width <= viewport.width &&
        box.y + box.height <= viewport.height;
      if (!isInsideViewport) return false;

      return page.evaluate(
        ({ x, y }) =>
          document.elementFromPoint(x, y)?.closest("button, a")?.textContent ??
          "",
        { x: box.x + box.width / 2, y: box.y + box.height / 2 },
      );
    })
    .toContain(expectedText);
}

async function expectNoHorizontalOverflow(
  page: Page,
  width: number,
): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(width);
}

async function waitForFonts(page: Page): Promise<void> {
  await page.evaluate(async () => document.fonts.ready);
}

function collectBrowserIssues(page: Page): () => BrowserIssue[] {
  const issues: BrowserIssue[] = [];
  const allowedUnauthorizedResponses: number[] = [];
  const genericUnauthorizedConsoleErrors: number[] = [];
  page.on("response", (response) => {
    if (response.status() < 400) return;

    const url = new URL(response.url());
    if (isExpectedUnauthenticatedRefresh(response.status(), response.url())) {
      allowedUnauthorizedResponses.push(Date.now());
      return;
    }

    issues.push({
      source: "response",
      text: `${response.status()} ${url.pathname}${url.search}`,
    });
  });
  page.on("requestfailed", (request) => {
    issues.push({
      source: "request",
      text: `${request.failure()?.errorText ?? "Request failed"} ${request.url()}`,
    });
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      if (message.text() === expectedUnauthenticatedRefreshConsoleError) {
        genericUnauthorizedConsoleErrors.push(Date.now());
        return;
      }
      issues.push({ source: "console", text: message.text() });
    }
  });
  page.on("pageerror", (error) => {
    issues.push({ source: "page", text: error.message });
  });

  return () => {
    const unmatchedResponses = [...allowedUnauthorizedResponses];
    const unmatchedConsoleErrors = genericUnauthorizedConsoleErrors.filter(
      (consoleTime) => {
        const responseIndex = unmatchedResponses.findIndex(
          (responseTime) => Math.abs(consoleTime - responseTime) <= 1_000,
        );
        if (responseIndex === -1) return true;
        unmatchedResponses.splice(responseIndex, 1);
        return false;
      },
    );
    if (
      unmatchedConsoleErrors.length === 0 &&
      unmatchedResponses.length === 0
    ) {
      return issues;
    }

    return [
      ...issues,
      {
        source: "console",
        text: `Generic 401 console errors: ${unmatchedConsoleErrors.length}; unmatched ${expectedUnauthenticatedRefreshPath} responses: ${unmatchedResponses.length}.`,
      },
    ];
  };
}

function isExpectedUnauthenticatedRefresh(
  status: number,
  url: string,
): boolean {
  return (
    status === expectedUnauthenticatedRefreshStatus &&
    new URL(url).origin === expectedUnauthenticatedRefreshOrigin &&
    new URL(url).pathname === expectedUnauthenticatedRefreshPath
  );
}
