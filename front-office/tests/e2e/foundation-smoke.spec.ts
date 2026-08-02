import { expect, test } from "@playwright/test";

test("открывает канонические маршруты без успешного ответа backend", async ({
  page,
}) => {
  await page.route("**/*", async (route) => {
    if (route.request().url().startsWith("http://127.0.0.1:3000/")) {
      await route.abort("failed");
      return;
    }

    await route.continue();
  });

  await page.goto("/");
  await expect(page).toHaveTitle("Expressa");
  await expect(page.getByRole("heading", { name: "Меню" })).toBeVisible();

  for (const [path, title] of [
    ["/cart", "Корзина"],
    ["/auth/phone", "Вход по телефону"],
    ["/auth/code", "Подтверждение кода"],
    ["/orders/8a0c5df9-a520-4d94-8912-eba5350cf4dc", "Заказ"],
    ["/orders", "История заказов"],
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  }
});

test("собранное приложение публикует PWA manifest", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    /manifest/,
  );
  await expect(page.getByRole("heading", { name: "Меню" })).toBeVisible();
});

test("сохраняет рабочую ширину на контрольных viewport", async ({ page }) => {
  for (const width of [320, 390, 479, 480, 767, 768, 1023, 1024, 1280, 1440]) {
    await page.setViewportSize({ height: 844, width });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Меню" })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width);
  }
});
