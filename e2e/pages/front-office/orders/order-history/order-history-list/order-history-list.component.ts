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
      if ((await this.refreshButton.count()) === 0) {
        await expect(
          this.emptyState(),
          "Показано пустое состояние истории заказов.",
        ).toBeVisible();
        return;
      }

      await expect(
        this.refreshButton,
        "Обновление истории доступно.",
      ).toBeEnabled();
      await this.refreshButton.click();
      await expect(
        this.historyList.or(this.emptyState()),
        "История заказов или её пустое состояние показаны.",
      ).toBeVisible();
    });
  }

  async waitUntilLoaded(): Promise<void> {
    await test.step("Дождаться загрузки истории заказов", async () => {
      await expect(
        this.historyList.or(this.emptyState()),
        "История заказов или её пустое состояние показаны.",
      ).toBeVisible();
    });
  }

  async loadMore(): Promise<void> {
    await test.step("Показать следующую часть истории заказов", async () => {
      const loadMoreButton = this.page.getByRole("button", {
        name: "Показать ещё",
        exact: true,
      });
      const displayedOrders = await this.historyList
        .getByRole("listitem")
        .count();

      await expect(
        loadMoreButton,
        "Загрузка следующей части истории доступна.",
      ).toBeEnabled();
      await loadMoreButton.click();
      await expect(
        this.historyList.getByRole("listitem"),
        "Следующая часть истории заказов добавлена.",
      ).not.toHaveCount(displayedOrders);
    });
  }

  async assertEmpty(): Promise<void> {
    await expect(
      this.emptyState(),
      "Показано пустое состояние истории заказов.",
    ).toBeVisible();
    await expect(this.historyList, "Список истории не показан.").toHaveCount(0);
  }

  async readOrderCount(): Promise<number> {
    if ((await this.historyList.count()) === 0) return 0;

    return this.historyList.getByRole("listitem").count();
  }

  async isOrderAbsent(number: string): Promise<boolean> {
    return (await this.orderByNumber(number).count()) === 0;
  }

  async assertDoesNotContain(snapshot: OrderSnapshot): Promise<void> {
    await expect(
      this.order(snapshot),
      `Заказ ${snapshot.number} не показан в истории.`,
    ).toHaveCount(0);
  }

  async openOrder(
    snapshot: Pick<OrderSnapshot, "id" | "number">,
  ): Promise<void> {
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

  async readOrders(): Promise<readonly OrderHistoryEntry[]> {
    return (await this.historyList.getByRole("listitem").allInnerTexts()).map(
      (entry) => this.readEntry(entry),
    );
  }

  async readOrderNumbers(): Promise<readonly string[]> {
    const orders = await this.readOrders();

    return orders.map((order) => order.number);
  }

  async hasUniqueOrderNumbers(): Promise<boolean> {
    const numbers = await this.readOrderNumbers();

    return new Set(numbers).size === numbers.length;
  }

  private order(snapshot: Pick<OrderSnapshot, "id" | "number">): Locator {
    return this.orderByNumber(snapshot.number);
  }

  private orderByNumber(number: string): Locator {
    return this.historyList.getByRole("listitem").filter({
      has: this.page.getByText(`Заказ №${number}`, { exact: true }),
    });
  }

  private emptyState(): Locator {
    return this.page.getByText("История заказов пуста", { exact: true });
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
