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
    ["/auth/phone", "Введите номер телефона"],
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  }

  for (const path of [
    "/orders/8a0c5df9-a520-4d94-8912-eba5350cf4dc",
    "/orders",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(
      new RegExp(`/auth/phone\\?returnTo=${path.replaceAll("/", "\\/")}$`),
    );
    await expect(
      page.getByRole("heading", { name: "Введите номер телефона" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "История заказов" }),
    ).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Заказ" })).toHaveCount(0);
  }

  await page.goto("/auth/code");
  await expect(page).toHaveURL(/\/auth\/phone(?:\?|$)/);
  await expect(
    page.getByRole("heading", { name: "Введите номер телефона" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Подтверждение кода" }),
  ).toHaveCount(0);
});

test("собранное приложение публикует PWA manifest", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    /manifest/,
  );
  await expect(
    page.getByRole("heading", { name: "Что будем заказывать?" }),
  ).toBeVisible();
});

test("сохраняет рабочую ширину на контрольных viewport", async ({ page }) => {
  for (const width of [320, 390, 479, 480, 767, 768, 1023, 1024, 1280, 1440]) {
    await page.setViewportSize({ height: 844, width });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Что будем заказывать?" }),
    ).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width);
  }
});
