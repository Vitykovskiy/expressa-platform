import { expect, test } from "@playwright/test";
import { openStory } from "./test-utils.mjs";

test("Customer menu visual baseline", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await openStory(page, "customer-screens-menuroot--default");

  await expect(page.locator("#storybook-root")).toHaveScreenshot(
    "customer-menu-root.png",
  );
});

test("Customer journey visual baseline", async ({ page }) => {
  await page.setViewportSize({ height: 1024, width: 1024 });
  await openStory(
    page,
    "customer-journeys-customershell--authenticated-navigation-stack",
  );

  await expect(page.locator("#storybook-root")).toHaveScreenshot(
    "customer-authenticated-journey.png",
  );
});
