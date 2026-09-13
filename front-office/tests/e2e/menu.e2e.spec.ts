import { expect, test, type Locator, type Page } from "@playwright/test";
import { Pool } from "pg";

import { frontOfficeE2eDatabaseUrl } from "../../playwright.config.constants";
import {
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
import { CheckoutDatabase } from "./checkout.database";
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
      1,
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
      2,
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
      4,
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

  for (const width of [1024, 1440]) {
    await openCleanMenu(page, width);
    await page
      .getByRole("button", {
        name: `Открыть категорию ${screenNames.coffee}`,
      })
      .click();
    await expectDesktopContextualRow(
      page,
      width,
      ".menu-group__context-row",
      ".menu-group__header",
    );

    await page.getByRole("button", { name: productNames.cappuccino }).click();
    await expectDesktopContextualRow(
      page,
      width,
      ".product-detail__context-row",
      ".product-detail__header",
    );
  }
});

test("мобильная шапка сохраняет все действия и бренд внутри viewport", async ({
  page,
}) => {
  for (const width of [320, 359, 390, 700, 1023]) {
    await openMenuForHeaderBounds(page, width);

    await page.getByRole("button", { name: "Корзина" }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expectMobileHeaderBounds(page, width, false);

    await page.getByLabel("Перейти в меню").click();
    await expect(page.getByRole("region", { name: "Меню" })).toBeVisible();
    await page.getByRole("button", { name: "Открыть категорию Кофе" }).click();
    await expect(
      page.getByRole("heading", { name: screenNames.coffee }),
    ).toBeVisible();
    await expectMobileHeaderBounds(page, width, true);

    await page.getByRole("button", { name: productNames.cappuccino }).click();
    await expect(
      page.getByRole("heading", { name: productNames.cappuccino }),
    ).toBeVisible();
    await page.getByRole("button", { name: /Добавить/ }).click();
    await expect(
      page.getByRole("heading", { name: screenNames.coffee }),
    ).toBeVisible();
    await expect(
      page.locator(".shell-navigation__cart-button .shell-navigation__badge"),
    ).toContainText("1");
    await expectMobileHeaderBounds(page, width, true);
  }
});

test("бренд возвращает category и product в корень меню без reload", async ({
  page,
}) => {
  for (const width of [320, 359, 390, 700, 1023]) {
    await openCleanMenu(page, width);
    await page
      .getByRole("button", { name: `Открыть категорию ${screenNames.coffee}` })
      .click();
    await expect(
      page.getByRole("heading", { name: screenNames.coffee }),
    ).toBeVisible();
    await page.getByLabel("Перейти в меню").click();
    await expect(
      page.getByRole("heading", { name: screenNames.menu }),
    ).toBeVisible();

    await openProduct(page, screenNames.coffee, productNames.cappuccino);
    await page.getByLabel("Перейти в меню").click();
    await expect(
      page.getByRole("heading", { name: screenNames.menu }),
    ).toBeVisible();
  }
});

test("product footer reaches the mobile usable bottom and remains reachable across boundaries", async ({
  page,
}) => {
  for (const width of [320, 359, 390, 700, 1023, 1024, 1440]) {
    await openCleanMenu(page, width);
    await openProduct(page, screenNames.coffee, productNames.cappuccino);

    const footer = page.locator(".product-detail__footer");
    const add = footer.getByRole("button", { name: /Добавить/ });
    await expect(add).toBeVisible();
    await expectControlNotOccluded(page, add, "Добавить");

    const geometry = await footerGeometry(footer);
    if (width < 1024) {
      expect(geometry.footerPosition).toBe("sticky");
      expect(
        Math.abs(geometry.footerBottom - geometry.viewportBottom),
      ).toBeLessThanOrEqual(2);
      expect(geometry.addBottom).toBeLessThanOrEqual(geometry.viewportBottom);
      // In desktop Chromium env(safe-area-inset-bottom) is zero. The token
      // fallback must still leave an operable bottom inset for the CTA.
      expect(geometry.paddingBottom).toBeGreaterThanOrEqual(16);
    } else {
      expect(geometry.footerPosition).toBe("static");
    }
  }

  const longModifiers = new LongModifierFixture();
  try {
    await longModifiers.create();
    for (const width of [390, 700, 1023]) {
      await openCleanMenu(page, width);
      await openProduct(page, screenNames.coffee, productNames.cappuccino);

      const footer = page.locator(".product-detail__footer");
      const finalModifier = page.getByRole("button", {
        name: "Последняя добавка · 0 ₽",
      });
      await finalModifier.scrollIntoViewIfNeeded();
      await expectControlNotOccluded(page, finalModifier, "Последняя добавка");
      const modifierGeometry = await finalModifier.evaluate((element) => {
        const modifier = element.getBoundingClientRect();
        const footer = document
          .querySelector(".product-detail__footer")
          ?.getBoundingClientRect();
        return { footerTop: footer?.top ?? 0, modifierBottom: modifier.bottom };
      });
      expect(modifierGeometry.modifierBottom).toBeLessThanOrEqual(
        modifierGeometry.footerTop,
      );

      const add = footer.getByRole("button", { name: /Добавить/ });
      await expectControlNotOccluded(page, add, "Добавить");
    }
  } finally {
    await longModifiers.remove();
    await longModifiers.close();
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
      .getByRole("button", { name: `Открыть категорию ${screenNames.coffee}` })
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
      "http://127.0.0.1:3000/api/v2/public/menu",
    ),
  ).toBe(false);
  expect(
    isExpectedUnauthenticatedRefresh(
      401,
      "https://foreign.example/api/v2/auth/refresh",
    ),
  ).toBe(false);
});

test("недоступный товар сохраняет читаемый статус", async ({ page }) => {
  const database = new CheckoutDatabase();
  const state = await database.readState();
  try {
    await database.setProductAvailable(false);

    for (const { width, height } of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      await page.evaluate(() => {
        localStorage.clear();
        history.replaceState({}, "", location.href);
      });
      await page.reload();
      await page
        .getByRole("button", {
          name: `Открыть категорию ${screenNames.coffee}`,
        })
        .click();

      const unavailableProduct = page.getByRole("button", {
        name: productNames.cappuccino,
      });
      const status = unavailableProduct.getByText("Временно недоступно", {
        exact: true,
      });
      const cart = page.getByRole("button", { name: "Корзина" });
      const cartBadge = page.locator(
        ".shell-navigation__cart-button .shell-navigation__badge",
      );
      await expect(unavailableProduct).toBeDisabled();
      await expect(status).toBeVisible();
      await expect(cart).toBeVisible();
      await expect(cartBadge).toHaveCount(0);
      await unavailableProduct.focus();
      await expect(unavailableProduct).not.toBeFocused();
      await unavailableProduct.click({ force: true });
      await expect(
        page.getByRole("heading", { name: screenNames.coffee }),
      ).toBeVisible();
      await expect(cart).toBeVisible();
      await expect(cartBadge).toHaveCount(0);
      await expectNoHorizontalOverflow(page, width);

      const contrast = await status.evaluate((element) => {
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
        const backgroundElement =
          element.closest(".product-card") ?? document.body;
        const background = parseColor(
          getComputedStyle(backgroundElement).backgroundColor,
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
          background: getComputedStyle(backgroundElement).backgroundColor,
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
      expect(contrast.fontSize).toBe("13px");
      expect(contrast.fontWeight).toBe("600");
      expect(contrast.ratio).toBeGreaterThanOrEqual(4.5);
    }
  } finally {
    await database.restore(state);
    await database.close();
  }
});

async function openCleanMenu(page: Page, width: number): Promise<void> {
  await page.setViewportSize({ height: menuViewportHeight, width });
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    history.replaceState({}, "", location.href);
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: screenNames.menu }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page, width);
}

async function openMenuForHeaderBounds(
  page: Page,
  width: number,
): Promise<void> {
  await page.setViewportSize({ height: menuViewportHeight, width });
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    history.replaceState({}, "", location.href);
  });
  await page.reload();
  if (
    (await page.getByRole("heading", { name: screenNames.menu }).count()) === 0
  ) {
    await page.getByLabel("Перейти в меню").click();
  }
  await expect(page.getByRole("region", { name: "Меню" })).toBeVisible();
  await expectNoHorizontalOverflow(page, width);
}

async function openProduct(
  page: Page,
  categoryName: string,
  productName: string,
): Promise<number> {
  await page
    .getByRole("button", { name: `Открыть категорию ${categoryName}` })
    .click();
  await expect(page.getByRole("heading", { name: categoryName })).toBeVisible();
  const scrollY = await page.evaluate(() => window.scrollY);
  await page
    .locator(".product-card")
    .filter({ has: page.getByText(productName, { exact: true }) })
    .click();
  await expect(page.getByRole("heading", { name: productName })).toBeVisible();

  return scrollY;
}

async function addAndExpectCategory(
  page: Page,
  categoryName: string,
  width: number,
  expectedItemCount: number,
  scrollY: number,
  configuredPrice: string,
): Promise<void> {
  const add = page.getByRole("button", { name: /Добавить/ });
  await expect(add).toBeVisible();
  await expect(add).toContainText(configuredPrice);
  await expectControlNotOccluded(page, add, "Добавить");
  await add.click();

  await expect(page.getByRole("heading", { name: categoryName })).toBeVisible();
  const cart = page.getByRole("button", { name: /Корзина/ });
  await expect(cart).toBeVisible();
  await expect(cart.locator(".shell-navigation__badge")).toContainText(
    String(expectedItemCount),
  );
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollY);
  await expectControlNotOccluded(page, cart, String(expectedItemCount));
  await expectNoHorizontalOverflow(page, width);
}

async function expectCartConfiguration(page: Page): Promise<void> {
  await page.getByRole("button", { name: /Корзина/ }).click();
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

async function expectMobileHeaderBounds(
  page: Page,
  width: number,
  screenOwnsBack: boolean,
): Promise<void> {
  const labels = ["Перейти в меню", "Аккаунт", "История заказов", "Корзина"];

  const geometry = await page.evaluate((expectedLabels) => {
    const header = document.querySelector(".shell-navigation__mobile-header");
    const brand = header?.querySelector(".shell-navigation__brand");
    if (header === null || brand === null) {
      throw new Error("Не найдена мобильная шапка.");
    }

    const rectangle = (element: Element) => {
      const { bottom, height, left, right, top, width } =
        element.getBoundingClientRect();
      return { bottom, height, left, right, top, width };
    };
    const controls = expectedLabels.map((label) => {
      const control = header.querySelector(`[aria-label="${label}"]`);
      if (control === null) {
        throw new Error(`Не найдена кнопка ${label}.`);
      }
      return { label, rect: rectangle(control) };
    });

    return {
      brand: {
        iconCount: brand.querySelectorAll("svg").length,
        rect: rectangle(brand),
        text: brand.textContent?.replace("☕", "").trim(),
      },
      controls,
      header: rectangle(header),
      contentLeft:
        header.getBoundingClientRect().left +
        Number.parseFloat(getComputedStyle(header).paddingLeft),
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  }, labels);

  expect(geometry.viewportWidth).toBe(width);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(width);
  expect(geometry.brand.text).toBe("Экспресса");
  expect(geometry.brand.iconCount).toBe(0);
  expect(geometry.brand.rect.left).toBeGreaterThanOrEqual(0);
  expect(geometry.brand.rect.right).toBeLessThanOrEqual(width);
  expect(geometry.brand.rect.top).toBeGreaterThanOrEqual(geometry.header.top);
  expect(geometry.brand.rect.bottom).toBeLessThanOrEqual(
    geometry.header.bottom,
  );
  expect(
    Math.abs(geometry.brand.rect.left - geometry.contentLeft),
  ).toBeLessThanOrEqual(1);
  await expect(
    page
      .locator(".shell-navigation__mobile-header")
      .getByLabel("Назад", { exact: true }),
  ).toHaveCount(0);
  if (screenOwnsBack) {
    await expect(page.getByLabel("Назад", { exact: true })).toBeVisible();
    const contextRow = page.locator(
      ".menu-group__context-row, .product-detail__context-row",
    );
    await expect(contextRow).toHaveCount(1);
    await expect(contextRow.getByLabel("Назад", { exact: true })).toHaveCount(
      1,
    );
    const contextPlacement = await contextRow.evaluate((row) => {
      const header = document.querySelector(".shell-navigation__mobile-header");
      const title = row.parentElement?.querySelector("h1");
      if (header === null || title === null)
        throw new Error("Не найдена геометрия contextual Back меню.");
      return {
        followsHeader: row.compareDocumentPosition(header) === 2,
        precedesTitle: Boolean(row.compareDocumentPosition(title) & 4),
        headerBottom: header.getBoundingClientRect().bottom,
        rowTop: row.getBoundingClientRect().top,
        rowBottom: row.getBoundingClientRect().bottom,
        titleTop: title.getBoundingClientRect().top,
      };
    });
    expect(contextPlacement.followsHeader).toBe(true);
    expect(contextPlacement.precedesTitle).toBe(true);
    expect(contextPlacement.rowTop).toBeGreaterThanOrEqual(
      contextPlacement.headerBottom,
    );
    expect(contextPlacement.rowBottom).toBeLessThanOrEqual(
      contextPlacement.titleTop,
    );
  }

  for (const { rect } of geometry.controls) {
    expect(rect.left).toBeGreaterThanOrEqual(0);
    expect(rect.right).toBeLessThanOrEqual(width);
    expect(rect.top).toBeGreaterThanOrEqual(geometry.header.top);
    expect(rect.bottom).toBeLessThanOrEqual(geometry.header.bottom);
    expect(rect.width).toBeGreaterThanOrEqual(44);
    expect(rect.height).toBeGreaterThanOrEqual(44);
  }
}

async function expectDesktopContextualRow(
  page: Page,
  width: number,
  rowSelector: string,
  primarySelector: string,
): Promise<void> {
  const row = page.locator(rowSelector);
  await expect(row).toHaveCount(1);
  await expect(row.getByLabel("Назад", { exact: true })).toHaveCount(1);
  await expect(page.getByLabel("Назад", { exact: true })).toHaveCount(1);

  const geometry = await row.evaluate((element, primarySelector) => {
    const shell = document.querySelector(".shell-navigation__sidebar");
    const content = document.querySelector(".customer-shell__content");
    const primary = element.parentElement?.querySelector(primarySelector);
    const back = element.querySelector('[aria-label="Назад"]');
    if (shell === null || content === null || primary === null || back === null)
      throw new Error("Не найдена desktop-геометрия contextual Back.");

    const rect = (candidate: Element) => {
      const { bottom, left, right, top } = candidate.getBoundingClientRect();
      return { bottom, left, right, top };
    };
    return {
      back: rect(back),
      content: rect(content),
      followsNavigation: Boolean(shell.compareDocumentPosition(element) & 4),
      precedesPrimary: Boolean(element.compareDocumentPosition(primary) & 4),
      primary: rect(primary),
      row: rect(element),
      viewportWidth: window.innerWidth,
    };
  }, primarySelector);

  expect(geometry.viewportWidth).toBe(width);
  expect(geometry.followsNavigation).toBe(true);
  expect(geometry.precedesPrimary).toBe(true);
  expect(geometry.row.left).toBeGreaterThanOrEqual(geometry.content.left);
  expect(geometry.row.right).toBeLessThanOrEqual(geometry.content.right);
  expect(Math.abs(geometry.back.left - geometry.row.left)).toBeLessThanOrEqual(
    1,
  );
  expect(geometry.back.right).toBeLessThanOrEqual(geometry.row.right);
  expect(geometry.back.top).toBeGreaterThanOrEqual(geometry.row.top);
  expect(geometry.back.bottom).toBeLessThanOrEqual(geometry.row.bottom);
  expect(geometry.row.bottom).toBeLessThanOrEqual(geometry.primary.top);
}

async function footerGeometry(footer: Locator): Promise<{
  addBottom: number;
  footerBottom: number;
  footerPosition: string;
  paddingBottom: number;
  viewportBottom: number;
}> {
  return footer.evaluate((element) => {
    const footerRect = element.getBoundingClientRect();
    const addRect = element
      .querySelector("button:last-child")
      ?.getBoundingClientRect();
    return {
      addBottom: addRect?.bottom ?? 0,
      footerBottom: footerRect.bottom,
      footerPosition: getComputedStyle(element).position,
      paddingBottom: Number.parseFloat(getComputedStyle(element).paddingBottom),
      viewportBottom: window.innerHeight,
    };
  });
}

async function expectControlNotOccluded(
  page: Page,
  control: Locator,
  expectedText: string,
): Promise<void> {
  await control.scrollIntoViewIfNeeded();

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
        ({ expectedText, x, y }) =>
          document
            .elementFromPoint(x, y)
            ?.closest("button, a")
            ?.textContent?.includes(expectedText) ?? false,
        { expectedText, x: box.x + box.width / 2, y: box.y + box.height / 2 },
      );
    })
    .toBe(true);
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

class LongModifierFixture {
  readonly #pool = new Pool({ connectionString: frontOfficeE2eDatabaseUrl });
  readonly #groupIds = Array.from(
    { length: 8 },
    (_, index) =>
      `00000000-0000-4000-8000-${String(900 + index).padStart(12, "0")}`,
  );
  readonly #optionIds = this.#groupIds.flatMap((_, groupIndex) => [
    `00000000-0000-4000-8000-${String(1_000 + groupIndex * 2).padStart(12, "0")}`,
    `00000000-0000-4000-8000-${String(1_001 + groupIndex * 2).padStart(12, "0")}`,
  ]);

  async create(): Promise<void> {
    for (const [index, groupId] of this.#groupIds.entries()) {
      await this.#pool.query(
        `INSERT INTO modifier_groups (id, name, selection_type, min_select, max_select, is_active)
         VALUES ($1, $2, 'single', 0, 1, true)`,
        [groupId, `Дополнение ${index + 1}`],
      );
      await this.#pool.query(
        `INSERT INTO category_modifier_groups (category_id, group_id, sort_order)
         VALUES ($1, $2, $3)`,
        ["00000000-0000-4000-8000-000000000001", groupId, 100 + index],
      );
      await this.#pool.query(
        `INSERT INTO modifier_options (id, group_id, name, price_delta, sort_order, is_default, is_available)
         VALUES ($1, $2, $3, 0, 10, false, true), ($4, $2, $5, 0, 20, false, true)`,
        [
          this.#optionIds[index * 2],
          groupId,
          `Добавка ${index + 1}`,
          this.#optionIds[index * 2 + 1],
          index === this.#groupIds.length - 1
            ? "Последняя добавка"
            : `Ещё добавка ${index + 1}`,
        ],
      );
    }
  }

  async remove(): Promise<void> {
    await this.#pool.query(
      "DELETE FROM category_modifier_groups WHERE group_id = ANY($1::uuid[])",
      [this.#groupIds],
    );
    await this.#pool.query(
      "DELETE FROM modifier_options WHERE id = ANY($1::uuid[])",
      [this.#optionIds],
    );
    await this.#pool.query(
      "DELETE FROM modifier_groups WHERE id = ANY($1::uuid[])",
      [this.#groupIds],
    );
  }

  async close(): Promise<void> {
    await this.#pool.end();
  }
}
