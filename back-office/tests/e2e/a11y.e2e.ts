import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const widths = [479, 480, 767, 768, 1023, 1024, 1280, 1440] as const;
const existingStories = [
  "foundations-page-shell--default",
  "feedback-error-notice--request-rejected",
  "compositions-navigation--default",
  "controls-back-office--button",
  "controls-back-office--text-field",
  "controls-back-office--select",
  "controls-back-office--toggle",
  "controls-back-office--tabs",
  "controls-back-office--search-field",
  "controls-back-office--confirm",
  "controls-back-office--order-stages",
] as const;
const domainStories = [
  "orders-canonical--queue-stages-and-details",
  "availability-canonical--independent-toggles-and-audit",
  "menu-canonical--drinks-prices-and-modifiers",
  "feedback-canonical--loading-error-and-permissions",
] as const;
const compositionStories = [
  "compositions-staffloginpage--barista",
  "compositions-orderspage--working",
  "compositions-orderdetailsview--working",
  "compositions-availabilitypage--working",
  "compositions-menupage--navigation",
  "compositions-categoryeditorpage--validation-and-success",
  "compositions-producteditorpage--sizes-and-one-price",
] as const;
const compositionWidths = [768, 1280, 1440] as const;

for (const story of existingStories) {
  test(`история ${story} не имеет нарушений доступности`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${story}&viewMode=story`);

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });
}

for (const story of domainStories) {
  for (const width of widths) {
    test(`история ${story} при ширине ${width}px не имеет нарушений доступности`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/iframe.html?id=${story}&viewMode=story`);

      const results = await new AxeBuilder({ page }).analyze();

      expect(results.violations).toEqual([]);
    });
  }
}

for (const story of compositionStories) {
  for (const width of compositionWidths) {
    test(`композиция ${story} при ширине ${width}px не имеет нарушений доступности`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/iframe.html?id=${story}&viewMode=story`);

      const results = await new AxeBuilder({ page }).analyze();

      expect(results.violations).toEqual([]);
    });
  }
}
