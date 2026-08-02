import { expect, test, type Locator, type Page } from "@playwright/test";

const widths = [320, 390, 479, 480, 767, 768, 1023, 1024, 1280, 1440];
const controlStories = [
  ["button", "controls-back-office--button", "Button"],
  ["icon-button", "controls-back-office--icon-button", "IconButton"],
  ["text-field", "controls-back-office--text-field", "TextField"],
  ["select", "controls-back-office--select", "Select"],
  ["toggle", "controls-back-office--toggle", "Toggle"],
  ["tabs", "controls-back-office--tabs", "Tabs"],
  ["search", "controls-back-office--search-field", "SearchField"],
  ["dialog", "controls-back-office--confirm", "ConfirmDialog"],
  ["order-status", "controls-back-office--order-stages", "Стадии заказа"],
] as const;
const storyPath = (name: string): string =>
  `/iframe.html?id=${name}&viewMode=story`;

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

test("статическая навигация показывает все рабочие разделы", async ({
  page,
}) => {
  await page.goto(storyPath("compositions-navigation--default"));

  await expect(page.getByRole("link", { name: "Очередь" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Доступность" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Меню" })).toBeVisible();
});

for (const width of widths) {
  for (const [group, story, name] of controlStories) {
    test(`${group} сохраняет доступную компоновку на ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ height: 900, width });
      await page.goto(storyPath(story));

      await expect(page.getByRole("heading", { name })).toBeVisible();
      await expect(
        page
          .locator("#storybook-root")
          .evaluate((element) => element.scrollWidth),
      ).resolves.toBeLessThanOrEqual(width);
    });
  }
}

test("диалог закрывается Escape и возвращает фокус вызвавшей кнопке", async ({
  page,
}) => {
  await page.goto(storyPath("controls-back-office--confirm"));
  const opener = page.getByRole("button", { name: "Выдать заказ #1048" });
  await opener.click();
  await expect(
    page.getByRole("dialog", { name: "Выдать заказ?" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Выдать заказ?" }),
  ).toBeHidden();
  await expect(opener).toBeFocused();
});

test("Select и Toggle работают с клавиатуры при ширине 1280px", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1280 });

  await page.goto(storyPath("controls-back-office--select"));
  const select = page.getByRole("combobox", {
    name: "Категория",
    exact: true,
  });
  await focusWithTab(page, select);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.getByRole("option", { name: "Чай" })).toBeVisible();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Выбрана категория: tea");

  await page.goto(storyPath("controls-back-office--toggle"));
  const toggle = page.getByRole("checkbox", {
    name: "Принимать новые заказы",
  });
  await focusWithTab(page, toggle);
  await page.keyboard.press("Space");
  await expect(toggle).not.toBeChecked();
});
