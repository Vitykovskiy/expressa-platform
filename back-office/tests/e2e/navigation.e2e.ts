import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

const reference = JSON.parse(
  readFileSync(new URL("./reference-index.json", import.meta.url), "utf8"),
) as { entries: Record<string, { id: string; type: string }> };
const storyIds = Object.values(reference.entries)
  .filter((entry) => entry.type === "story")
  .map((entry) => entry.id);
const storyPath = (storyId: string) =>
  `/iframe.html?id=${storyId}&viewMode=story`;

test.describe.configure({ mode: "parallel" });

for (const storyId of storyIds) {
  test(`reference story завершается: ${storyId}`, async ({ page }) => {
    await page.goto(storyPath(storyId));
    await page.locator("#storybook-root").waitFor();

    await expect
      .poll(() =>
        page.evaluate(() => {
          const storybook = globalThis as typeof globalThis & {
            __STORYBOOK_PREVIEW__?: {
              currentRender?: { phase?: string };
            };
          };

          return storybook.__STORYBOOK_PREVIEW__?.currentRender?.phase;
        }),
      )
      .toBe("finished");
    await expect(page.locator("#error-message")).toBeEmpty();
  });
}

for (const width of [320, 390, 479, 480, 767, 768, 1023, 1024, 1280, 1440]) {
  for (const storyId of [
    "admin-orders-screen--all-statuses",
    "admin-availability-availabilityscreen--default",
    "admin-menu-parts--expanded-option-group",
    "admin-users-usersscreen--flow",
  ]) {
    test(`${storyId} сохраняет ширину ${width}px`, async ({ page }) => {
      await page.setViewportSize({ height: 900, width });
      await page.goto(storyPath(storyId));
      await page.locator("#storybook-root").waitFor();

      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width);
    });
  }
}
