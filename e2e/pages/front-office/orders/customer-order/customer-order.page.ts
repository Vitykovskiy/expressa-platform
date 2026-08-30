import { test, type Page } from "@playwright/test";

import { OrderDetailsComponent } from "@pages/front-office/orders/customer-order/order-details/order-details.component";

export class CustomerOrderPage {
  public readonly details: OrderDetailsComponent;

  constructor(private readonly page: Page) {
    this.details = new OrderDetailsComponent(page);
  }

  async open(url: string, orderId: string): Promise<void> {
    await test.step("Открыть заказ customer", async () => {
      const orderUrl = new URL(url);

      orderUrl.pathname = `${orderUrl.pathname.replace(/\/$/u, "")}/orders/${orderId}`;
      await this.page.goto(orderUrl.toString());
      await this.details.waitReady();
    });
  }
}
