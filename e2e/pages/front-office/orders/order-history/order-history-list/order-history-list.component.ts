import { expect, test } from "@playwright/test";

import { OrderHistoryStatus } from "./order-history-list.types";

import type { Locator, Page } from "@playwright/test";
import type { OrderHistoryEntry } from "./order-history-list.types";
import type { OrderSnapshot } from "@support/data/order-snapshot.types";

export class OrderHistoryListComponent {
  private readonly historyList: Locator;
  private readonly historyItems: Locator;
  private readonly refreshButton: Locator;
  private readonly loadMoreButton: Locator;
  private readonly emptyState: Locator;

  constructor(private readonly page: Page) {
    this.historyList = page.getByRole("list", {
      name: "История заказов",
      exact: true,
    });
    this.historyItems = this.historyList.getByRole("listitem");
    this.refreshButton = page.getByRole("button", {
      name: "Обновить историю заказов",
      exact: true,
    });
    this.loadMoreButton = page.getByRole("button", {
      name: "Показать ещё",
      exact: true,
    });
    this.emptyState = page.getByText("История заказов пуста", { exact: true });
  }

  async refresh(): Promise<void> {
    await test.step("Обновить историю заказов", async () => {
      if ((await this.refreshButton.count()) === 0) {
        await expect(
          this.emptyState,
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
        this.historyList.or(this.emptyState),
        "История заказов или её пустое состояние показаны.",
      ).toBeVisible();
    });
  }

  async waitUntilLoaded(): Promise<void> {
    await test.step("Дождаться загрузки истории заказов", async () => {
      await expect(
        this.historyList.or(this.emptyState),
        "История заказов или её пустое состояние показаны.",
      ).toBeVisible();
    });
  }

  async loadMore(): Promise<void> {
    await test.step("Показать следующую часть истории заказов", async () => {
      const displayedOrders = await this.historyItems.count();

      await expect(
        this.loadMoreButton,
        "Загрузка следующей части истории доступна.",
      ).toBeEnabled();
      await this.loadMoreButton.click();
      await expect(
        this.historyItems,
        "Следующая часть истории заказов добавлена.",
      ).not.toHaveCount(displayedOrders);
    });
  }

  async assertEmpty(): Promise<void> {
    await expect(
      this.emptyState,
      "Показано пустое состояние истории заказов.",
    ).toBeVisible();
    await expect(this.historyList, "Список истории не показан.").toHaveCount(0);
  }

  async readOrderCount(): Promise<number> {
    if ((await this.historyList.count()) === 0) return 0;

    return this.historyItems.count();
  }

  async isOrderAbsent(number: string): Promise<boolean> {
    return (await this.orderByNumber(number).count()) === 0;
  }

  async assertDoesNotContain(snapshot: OrderSnapshot): Promise<void> {
    await expect(
      this.orderByNumber(snapshot.number),
      `Заказ ${snapshot.number} не показан в истории.`,
    ).toHaveCount(0);
  }

  async openOrder(
    snapshot: Pick<OrderSnapshot, "id" | "number">,
  ): Promise<void> {
    await test.step(`Открыть заказ ${snapshot.number} в истории`, async () => {
      await expect(
        this.orderByNumber(snapshot.number),
        `Заказ ${snapshot.number} показан в истории ровно один раз.`,
      ).toHaveCount(1);
      await expect(
        this.openOrderLink(snapshot.number),
        "Открытие заказа доступно.",
      ).toBeEnabled();
      await this.openOrderLink(snapshot.number).click();
      await expect(
        this.orderHeading(snapshot.number),
        "Открыты детали исходного заказа.",
      ).toBeVisible();
    });
  }

  async readOrder(snapshot: OrderSnapshot): Promise<OrderHistoryEntry> {
    await expect(
      this.orderByNumber(snapshot.number),
      `Заказ ${snapshot.number} показан в истории ровно один раз.`,
    ).toHaveCount(1);

    return this.readEntry(
      await this.orderByNumber(snapshot.number).innerText(),
    );
  }

  async readOrders(): Promise<readonly OrderHistoryEntry[]> {
    return (await this.historyItems.allInnerTexts()).map((entry) =>
      this.readEntry(entry),
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

  private orderByNumber(number: string): Locator {
    return this.historyItems.filter({
      has: this.page.getByText(`Заказ №${number}`, { exact: true }),
    });
  }

  private openOrderLink(number: string): Locator {
    return this.orderByNumber(number).getByRole("link", {
      name: "Открыть заказ",
      exact: true,
    });
  }

  private orderHeading(number: string): Locator {
    return this.page.getByRole("heading", {
      name: `Заказ №${number}`,
      exact: true,
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
