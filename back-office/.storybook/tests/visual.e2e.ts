import { expect, test, type Page } from "@playwright/test";

const visualStories = [
  ["admin-orders", "admin-orders-screen--all-statuses"],
  [
    "admin-availability",
    "admin-availability-availabilityscreen--default-visual",
  ],
  ["admin-shell", "admin-shell--administrator-visual"],
] as const;

async function waitForStoryRender(page: Page) {
  await page.waitForFunction(
    () =>
      (
        window as Window & {
          __STORYBOOK_PREVIEW__?: {
            currentRender?: { phase?: string };
          };
        }
      ).__STORYBOOK_PREVIEW__?.currentRender?.phase === "finished",
  );
}

for (const [name, storyId] of visualStories) {
  test(`визуальный снимок ${name}`, async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto(`/iframe.html?id=${storyId}&viewMode=story`);
    await page.locator("#storybook-root").waitFor();
    await page.evaluate(() => document.fonts.ready);
    await waitForStoryRender(page);

    await expect(page).toHaveScreenshot(`${name}.png`, {
      animations: "disabled",
    });
  });
}
