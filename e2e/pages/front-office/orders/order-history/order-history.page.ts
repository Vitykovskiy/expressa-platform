import { expect, test, type Page } from "@playwright/test";

import { OrderHistoryListComponent } from "./order-history-list/order-history-list.component";

export class OrderHistoryPage {
  public readonly history: OrderHistoryListComponent;

  constructor(private readonly page: Page) {
    this.history = new OrderHistoryListComponent(page);
  }

  async open(): Promise<void> {
    await test.step("Открыть историю заказов", async () => {
      const navigation = this.page.getByRole("button", {
        name: "История",
        exact: true,
      });

      await expect(navigation, "Переход в историю доступен.").toBeEnabled();
      await navigation.click();
      await expect(
        this.page.getByRole("heading", { name: "История", exact: true }),
        "Открыта история заказов.",
      ).toBeVisible();
    });
  }
}
