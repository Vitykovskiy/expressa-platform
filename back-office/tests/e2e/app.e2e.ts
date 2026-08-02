import { expect, test } from "@playwright/test";

test("очередь открывается как статическая оболочка", async ({ page }) => {
  await page.goto("/queue");

  await expect(page).toHaveURL(/\/queue$/);
  await expect(page.getByRole("heading", { name: "Очередь" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Меню" })).toBeVisible();

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Очередь" })).toBeFocused();
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
