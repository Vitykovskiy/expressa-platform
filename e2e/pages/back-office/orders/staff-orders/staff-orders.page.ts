import { expect, test, type Locator, type Page } from "@playwright/test";

import { OrderQueueComponent } from "./order-queue/order-queue.component";

export class StaffOrdersPage {
  public readonly queue: OrderQueueComponent;

  private readonly queueNavigationButton: Locator;

  constructor(page: Page) {
    this.queue = new OrderQueueComponent(page);
    this.queueNavigationButton = page.getByRole("button", {
      name: "Очередь",
      exact: true,
    });
  }

  async open(): Promise<void> {
    await test.step("Открыть раздел заказов", async () => {
      await expect(
        this.queueNavigationButton,
        "Раздел «Очередь» доступен.",
      ).toBeEnabled();
      await this.queueNavigationButton.click();
      await this.queue.waitReady();
    });
  }
}
