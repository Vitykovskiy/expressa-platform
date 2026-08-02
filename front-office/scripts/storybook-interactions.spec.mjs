import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { openStory } from "./storybook-test-utils.mjs";

const reference = JSON.parse(
  readFileSync(new URL("./reference-index.json", import.meta.url), "utf8"),
);
const storyIds = Object.values(reference.entries)
  .filter((entry) => entry.type === "story")
  .map((entry) => entry.id);

test.describe.configure({ mode: "parallel" });

for (const storyId of storyIds) {
  test(`reference story завершается: ${storyId}`, async ({ page }) => {
    await openStory(page, storyId);

    await expect
      .poll(() =>
        page.evaluate(
          () => globalThis.__STORYBOOK_PREVIEW__?.currentRender?.phase,
        ),
      )
      .toBe("finished");
    await expect(page.locator("#error-message")).toBeEmpty();
  });
}

test("responsive screens сохраняют ширину reference", async ({ page }) => {
  const responsiveStories = [
    "customer-screens-menuroot--default",
    "customer-screens-productdetail--default",
    "customer-screens-ordershistory--populated",
  ];

  for (const storyId of responsiveStories) {
    for (const width of [390, 479, 480, 767, 768, 1023, 1024, 1280, 1440]) {
      await page.setViewportSize({ height: 844, width });
      await openStory(page, storyId);
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width);
    }
  }
});
