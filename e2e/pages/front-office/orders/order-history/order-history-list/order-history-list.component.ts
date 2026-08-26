import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  OrderHistoryStatus,
  type OrderHistoryEntry,
} from "./order-history-list.component.types";

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

  async readOrder(snapshot: OrderSnapshot): Promise<OrderHistoryEntry> {
    const order = this.order(snapshot);

    await expect(
      order,
      `Заказ ${snapshot.number} показан в истории ровно один раз.`,
    ).toHaveCount(1);

    return this.readEntry(await order.innerText());
  }

  private order(snapshot: OrderSnapshot): Locator {
    return this.historyList.getByRole("listitem").filter({
      has: this.page.getByText(`Заказ №${snapshot.number}`, { exact: true }),
    });
  }

  private readEntry(entry: string): OrderHistoryEntry {
    const [title, status, total, metadata, action, ...rest] = entry
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);
    const [displayedDate, itemCount, ...metadataRest] =
      metadata?.split(" · ") ?? [];

    if (
      title === undefined ||
      status === undefined ||
      total === undefined ||
      displayedDate === undefined ||
      itemCount === undefined ||
      !title.startsWith("Заказ №") ||
      title.length === "Заказ №".length ||
      !/^\d+ (?:позиция|позиции|позиций)$/u.test(itemCount) ||
      action !== "Открыть заказ" ||
      metadataRest.length !== 0 ||
      rest.length !== 0
    ) {
      throw new Error("Не удалось прочитать карточку заказа в истории.");
    }

    return {
      number: title.replace("Заказ №", ""),
      displayedDate,
      total,
      status: this.readStatus(status),
    };
  }

  private readStatus(status: string): OrderHistoryStatus {
    for (const value of Object.values(OrderHistoryStatus)) {
      if (status === value) {
        return value;
      }
    }

    throw new Error("Не удалось прочитать статус заказа в истории.");
  }
}
