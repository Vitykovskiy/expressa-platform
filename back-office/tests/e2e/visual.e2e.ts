import { expect, test, type Locator, type Page } from "@playwright/test";

const widths = [479, 480, 767, 768, 1023, 1024, 1280, 1440] as const;
const stories = [
  "orders-canonical--queue-stages-and-details",
  "availability-canonical--independent-toggles-and-audit",
  "menu-canonical--drinks-prices-and-modifiers",
  "feedback-canonical--loading-error-and-permissions",
] as const;
const compositionStories = [
  "compositions-staffloginpage--barista",
  "compositions-orderspage--working",
  "compositions-orderdetailsview--working",
  "compositions-availabilitypage--working",
  "compositions-menupage--navigation",
  "compositions-categoryeditorpage--validation-and-success",
  "compositions-producteditorpage--sizes-and-one-price",
] as const;
const compositionWidths = [768, 1280, 1440] as const;
const visualStories = [
  ["page-shell", "foundations-page-shell--default"],
  ["error-notice", "feedback-error-notice--request-rejected"],
  ["navigation", "compositions-navigation--default"],
] as const;

async function expectNoHorizontalOverflow(page: Page) {
  expect(
    await page
      .locator("#storybook-root")
      .evaluate((root) => root.scrollWidth <= root.clientWidth),
  ).toBe(true);
  expect(
    await page
      .locator("html")
      .evaluate(
        (documentElement) =>
          documentElement.scrollWidth <= documentElement.clientWidth,
      ),
  ).toBe(true);
}

async function gridColumnCount(locator: Locator) {
  return locator.evaluate(
    (element) =>
      getComputedStyle(element).gridTemplateColumns.split(" ").length,
  );
}

async function focusWithTab(page: Page, target: Locator) {
  await expect(target).toBeVisible();

  for (let index = 0; index < 64; index += 1) {
    await page.keyboard.press("Tab");
    if (
      await target.evaluate((element) => document.activeElement === element)
    ) {
      return;
    }
  }

  throw new Error("Не удалось сфокусировать элемент клавишей Tab");
}

for (const story of stories) {
  for (const width of widths) {
    test(`история ${story} при ширине ${width}px не имеет горизонтального переполнения`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/iframe.html?id=${story}&viewMode=story`);

      await expectNoHorizontalOverflow(page);
    });
  }
}

for (const story of compositionStories) {
  for (const width of compositionWidths) {
    test(`композиция ${story} при ширине ${width}px не имеет переполнения`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/iframe.html?id=${story}&viewMode=story`);

      await expectNoHorizontalOverflow(page);
    });
  }
}

test("вход сотрудника подтверждается по Tab и Enter", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(
    "/iframe.html?id=compositions-staffloginpage--barista&viewMode=story",
  );

  const phone = page.getByRole("textbox", { name: "Номер телефона" });
  await focusWithTab(page, phone);
  await phone.fill("+79991234567");
  await page.keyboard.press("Enter");

  await expect(
    page.getByRole("textbox", { name: "Одноразовый код" }),
  ).toBeVisible();
});

test("очередь заказов меняет число колонок на границе 480px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 479, height: 900 });
  await page.goto(
    "/iframe.html?id=orders-canonical--queue-stages-and-details&viewMode=story",
  );
  const orderCard = page.getByRole("button", { name: /Заказ №1048/ }).first();

  expect(await gridColumnCount(orderCard)).toBe(2);

  await page.setViewportSize({ width: 480, height: 900 });

  expect(await gridColumnCount(orderCard)).toBe(4);
});

test("очередь заказов фильтруется по Tab и Enter", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(
    "/iframe.html?id=compositions-orderspage--working&viewMode=story",
  );

  const stage = page.getByRole("combobox", { name: "Стадия" });
  await expect(page.getByRole("button", { name: /Заказ №1048/ })).toBeHidden();
  await focusWithTab(page, stage);
  await page.keyboard.press("Home");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: /Заказ №1048/ })).toBeVisible();

  await page.keyboard.press("End");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");

  await expect(page.getByRole("button", { name: /Заказ №1046/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Заказ №1048/ })).toBeHidden();
});

test("доступность меняется по Tab и Space", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(
    "/iframe.html?id=compositions-availabilitypage--working&viewMode=story",
  );

  const toggle = page.getByRole("checkbox", { name: "Доступно" }).first();
  const initialValue = await toggle.isChecked();

  await focusWithTab(page, toggle);
  await page.keyboard.press("Space");

  expect(await toggle.isChecked()).toBe(!initialValue);
});

test("меню открывает редактор по Tab и Enter", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(
    "/iframe.html?id=compositions-menupage--navigation&viewMode=story",
  );

  await focusWithTab(page, page.getByRole("button", { name: /Кофе/ }));
  await page.keyboard.press("Enter");

  await expect(page.getByRole("status")).toHaveText("category coffee");
});

test("категория сохраняется по Tab и Enter", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(
    "/iframe.html?id=compositions-categoryeditorpage--validation-and-success&viewMode=story",
  );

  const name = page.getByRole("textbox", { name: "Название категории" });
  await focusWithTab(page, name);
  await name.fill("Чай");
  await page.keyboard.press("Enter");

  await expect(page.getByText("Категория сохранена")).toBeVisible();
});

test("обратная связь закрывает уведомление по Tab и Enter", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(
    "/iframe.html?id=feedback-canonical--loading-error-and-permissions&viewMode=story",
  );

  await expect(page.getByText("Уведомления разрешены")).toBeVisible();
  await focusWithTab(
    page,
    page.getByRole("button", { name: "Закрыть уведомление" }),
  );
  await page.keyboard.press("Enter");

  await expect(page.getByText("Изменения сохранены")).not.toBeVisible();
});

for (const [name, story] of visualStories) {
  test(`визуальный снимок ${name}`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${story}&viewMode=story`);
    await expect(page.locator("#storybook-root")).toHaveScreenshot(
      `${name}.png`,
      {
        animations: "disabled",
      },
    );
  });
}
