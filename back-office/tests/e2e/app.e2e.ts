import { expect, test } from "@playwright/test";

test("анонимный пользователь перенаправляется с защищённой очереди на вход", async ({
  page,
}) => {
  await page.goto("/queue");

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Вход в backoffice" }),
  ).toBeVisible();
  const phoneInput = page.getByRole("textbox", { name: "Телефон" });

  await expect(phoneInput).toBeFocused();
  await expect(phoneInput).toHaveAttribute(
    "aria-describedby",
    /^auth-phone-(hint|error)$/,
  );
  await phoneInput.fill("+79990000000");
  await expect(
    page.getByRole("button", { name: "Отправить код" }),
  ).toBeEnabled();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Отправить код" }),
  ).toBeFocused();
  await expect(page.getByRole("button", { name: "Очередь" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Меню" })).toHaveCount(0);
});

test("production-сборка содержит PWA-манифест и service worker", async ({
  page,
}) => {
  await page.goto("/login");

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    /manifest\.webmanifest/,
  );

  const [manifest, serviceWorker] = await Promise.all([
    page.request.get("/manifest.webmanifest"),
    page.request.get("/sw.js"),
  ]);

  expect(manifest.ok()).toBe(true);
  expect((await manifest.json()) as { name?: string }).toMatchObject({
    name: "Expressa back-office",
  });
  expect(serviceWorker.ok()).toBe(true);
});
