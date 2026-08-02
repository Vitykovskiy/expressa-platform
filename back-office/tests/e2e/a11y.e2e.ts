import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const storyIds = [
  "admin-auth-authscreen--phone-validation",
  "admin-orders-screen--all-statuses",
  "admin-availability-availabilityscreen--default",
  "admin-menu-parts--expanded-option-group",
  "admin-settings-settingsscreen--initial-values",
  "admin-users-usersscreen--flow",
  "admin-shell--administrator",
] as const;
const outOfScopeRules = [
  "color-contrast",
  "landmark-one-main",
  "page-has-heading-one",
  "region",
];

for (const storyId of storyIds) {
  test(`${storyId} проходит поддерживаемую a11y-проверку`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${storyId}&viewMode=story`);
    await page.locator("#storybook-root").waitFor();

    const results = await new AxeBuilder({ page })
      .disableRules(outOfScopeRules)
      .analyze();

    expect(results.violations).toEqual([]);
  });
}
