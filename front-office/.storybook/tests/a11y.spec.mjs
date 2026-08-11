import { createRequire } from "node:module";
import { expect, test } from "@playwright/test";
import { openStory } from "./test-utils.mjs";

const require = createRequire(import.meta.url);
const axeCorePath = require.resolve("axe-core");
const outOfScopeRules = [
  "color-contrast",
  "landmark-main-is-top-level",
  "landmark-no-duplicate-main",
  "landmark-unique",
];
const storyIds = [
  "customer-screens-auth--phone",
  "customer-screens-cart--populated",
  "customer-screens-menuroot--default",
  "customer-screens-productdetail--default",
  "customer-screens-slotpicker--selected",
  "customer-screens-ordershistory--populated",
  "customer-journeys-customershell--authenticated-navigation-stack",
];

for (const storyId of storyIds) {
  test(`a11y в поддерживаемой границе: ${storyId}`, async ({ page }) => {
    await openStory(page, storyId);
    await page.addScriptTag({ path: axeCorePath });

    const violations = await page.evaluate(async (disabledRules) => {
      const result = await globalThis.axe.run("#storybook-root", {
        rules: Object.fromEntries(
          disabledRules.map((rule) => [rule, { enabled: false }]),
        ),
      });
      return result.violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map((node) => node.target),
      }));
    }, outOfScopeRules);

    expect(violations).toEqual([]);
  });
}
