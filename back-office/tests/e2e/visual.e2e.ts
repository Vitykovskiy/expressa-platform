import { expect, test } from "@playwright/test";

const visualStories = [
  ["admin-orders", "admin-orders-screen--all-statuses"],
  ["admin-availability", "admin-availability-availabilityscreen--default"],
  ["admin-shell", "admin-shell--administrator"],
] as const;

for (const [name, storyId] of visualStories) {
  test(`визуальный снимок ${name}`, async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto(`/iframe.html?id=${storyId}&viewMode=story`);
    await page.locator("#storybook-root").waitFor();
    await page.evaluate(() => document.fonts.ready);

    await expect(page.locator("#storybook-root")).toHaveScreenshot(
      `${name}.png`,
      { animations: "disabled" },
    );
  });
}
