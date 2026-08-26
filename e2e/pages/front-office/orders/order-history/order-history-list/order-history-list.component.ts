import { expect, test, type Locator, type Page } from "@playwright/test";

import type { OrderSnapshot } from "@support/data/order-snapshot.types";

export class OrderHistoryListComponent {
  private readonly historyList: Locator;
  private readonly refreshButton: Locator;

  constructor(private readonly page: Page) {
    this.historyList = page.getByRole("list", {
      name: "История заказов",
      exact: true,
    });
    this.refreshButton = page.getByRole("button", {
      name: "Обновить историю заказов",
      exact: true,
    });
  }

  async refresh(): Promise<void> {
    await test.step("Обновить историю заказов", async () => {
      await expect(
        this.refreshButton,
        "Обновление истории доступно.",
      ).toBeEnabled();
      await this.refreshButton.click();
      await expect(
        this.historyList,
        "История заказов загружена.",
      ).toBeVisible();
    });
  }

  async openOrder(snapshot: OrderSnapshot): Promise<void> {
    await test.step(`Открыть заказ ${snapshot.number} в истории`, async () => {
      const order = this.order(snapshot);
      const openOrder = order.getByRole("link", {
        name: "Открыть заказ",
        exact: true,
      });

      await expect(
        order,
        `Заказ ${snapshot.number} показан в истории ровно один раз.`,
      ).toHaveCount(1);
      await expect(openOrder, "Открытие заказа доступно.").toBeEnabled();
      await openOrder.click();
      await expect(
        this.page.getByRole("heading", {
          name: `Заказ №${snapshot.number}`,
          exact: true,
        }),
        "Открыты детали исходного заказа.",
      ).toBeVisible();
    });
  }

  private order(snapshot: OrderSnapshot): Locator {
    return this.historyList.getByRole("listitem").filter({
      has: this.page.getByText(`Заказ №${snapshot.number}`, { exact: true }),
    });
  }
}
