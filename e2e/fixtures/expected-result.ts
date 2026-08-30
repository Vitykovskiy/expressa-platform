import { test } from "@playwright/test";
import type { Page } from "@playwright/test";

export async function expectedResult(
  description: string,
  page: Page,
  assertions: () => Promise<void>,
): Promise<void> {
  await test.step(description, async (step) => {
    await assertions();
    await step.attach(`Ожидается: ${description}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });
}
