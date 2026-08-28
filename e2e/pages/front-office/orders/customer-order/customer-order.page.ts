import { expect, test, type Page } from "@playwright/test";

import { OrderDetailsComponent } from "./order-details/order-details.component";

export class CustomerOrderPage {
  public readonly details: OrderDetailsComponent;

  constructor(private readonly page: Page) {
    this.details = new OrderDetailsComponent(page);
  }

  async open(url: string, orderId: string): Promise<void> {
    await test.step("Открыть заказ customer", async () => {
      await this.page.goto(`${url}/orders/${orderId}`);
      await expect(
        this.page.getByRole("heading", { level: 1 }),
        "Страница заказа открыта.",
      ).toBeVisible();
    });
  }
}
