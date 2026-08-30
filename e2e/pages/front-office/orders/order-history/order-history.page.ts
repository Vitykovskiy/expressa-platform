import { expect, test } from "@playwright/test";

import { OrderHistoryListComponent } from "@pages/front-office/orders/order-history/order-history-list/order-history-list.component";

import type { Locator, Page } from "@playwright/test";

export class OrderHistoryPage {
  public readonly history: OrderHistoryListComponent;

  private readonly historyNavigation: Locator;
  private readonly historyHeading: Locator;

  constructor(private readonly page: Page) {
    this.history = new OrderHistoryListComponent(page);
    this.historyNavigation = page.getByRole("button", {
      name: /^(История|\+\d{11}: история заказов)$/u,
    });
    this.historyHeading = page.getByRole("heading", {
      name: "История",
      exact: true,
    });
  }

  async open(): Promise<void> {
    await test.step("Открыть историю заказов", async () => {
      await expect(
        this.historyNavigation,
        "Переход в историю доступен.",
      ).toBeEnabled();
      await this.historyNavigation.click();
      await expect(
        this.historyHeading,
        "Открыта история заказов.",
      ).toBeVisible();
    });
  }
}
