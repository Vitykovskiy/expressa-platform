import { expect, test, type Page } from "@playwright/test";

import { ProductConfiguratorComponent } from "./product-configurator/product-configurator.component";

export class PublicMenuPage {
  public readonly product: ProductConfiguratorComponent;

  constructor(private readonly page: Page) {
    this.product = new ProductConfiguratorComponent(page);
  }

  async open(url: string): Promise<void> {
    await test.step("Открыть меню", async () => {
      await this.page.goto(url);
      await expect(
        this.page.getByRole("heading", {
          name: "Что будем заказывать?",
          exact: true,
        }),
        "Открыто меню для клиента.",
      ).toBeVisible();
    });
  }
}
