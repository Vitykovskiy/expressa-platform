import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  OrderQueueStage,
  type OrderQueueTransition,
} from "./order-queue.types";

import type { OrderSnapshot } from "@support/data/order-snapshot.types";

export class OrderQueueComponent {
  private readonly queue: Locator;

  constructor(private readonly page: Page) {
    this.queue = page.getByRole("region", { name: "Очередь заказов" });
  }

  async waitReady(): Promise<void> {
    await expect(this.queue, "Очередь заказов показана.").toBeVisible();
    await expect(
      this.queue.locator('[aria-busy="true"]'),
      "Загрузка очереди завершена.",
    ).toHaveCount(0);
  }

  async openDetails(order: OrderSnapshot): Promise<void> {
    await test.step(`Открыть детали заказа ${order.number}`, async () => {
      const card = this.orderCard(order);

      await expect(card, "Созданный заказ показан в очереди.").toBeVisible();
      await expect(
        card.getByRole("button", { name: "Открыть детали", exact: true }),
        "Кнопка открытия деталей доступна.",
      ).toBeEnabled();
      await card
        .getByRole("button", { name: "Открыть детали", exact: true })
        .click();
      await expect(
        card.getByRole("region", {
          name: `Детали заказа ${order.number}`,
          exact: true,
        }),
        "Детали заказа открыты.",
      ).toBeVisible();
    });
  }

  async accept(order: OrderSnapshot): Promise<void> {
    await test.step(`Принять заказ ${order.number}`, async () => {
      const card = this.orderCard(order);

      await expect(
        card.getByRole("button", { name: "Принять заказ", exact: true }),
        "Кнопка принятия заказа доступна.",
      ).toBeEnabled();
      await card
        .getByRole("button", { name: "Принять заказ", exact: true })
        .click();
      await expect(
        card.getByText(OrderQueueStage.ACCEPTED, { exact: true }),
        "Заказ принят.",
      ).toBeVisible();
    });
  }

  async startPreparing(order: OrderSnapshot): Promise<void> {
    await test.step(`Начать приготовление заказа ${order.number}`, async () => {
      const card = this.orderCard(order);

      await expect(
        card.getByRole("button", {
          name: "Начать приготовление",
          exact: true,
        }),
        "Кнопка начала приготовления доступна.",
      ).toBeEnabled();
      await card
        .getByRole("button", {
          name: "Начать приготовление",
          exact: true,
        })
        .click();
      await expect(
        card.getByText(OrderQueueStage.PREPARING, { exact: true }),
        "Заказ готовится.",
      ).toBeVisible();
    });
  }

  async markReady(order: OrderSnapshot): Promise<void> {
    await test.step(`Отметить заказ ${order.number} готовым`, async () => {
      const card = this.orderCard(order);

      await expect(
        card.getByRole("button", {
          name: "Отметить готовым",
          exact: true,
        }),
        "Кнопка подтверждения готовности доступна.",
      ).toBeEnabled();
      await card
        .getByRole("button", { name: "Отметить готовым", exact: true })
        .click();
      await expect(
        card.getByText(OrderQueueStage.READY, { exact: true }),
        "Заказ готов к выдаче.",
      ).toBeVisible();
    });
  }

  async issue(order: OrderSnapshot): Promise<void> {
    await test.step(`Выдать заказ ${order.number}`, async () => {
      const card = this.orderCard(order);

      await expect(
        card.getByRole("button", { name: "Выдать заказ", exact: true }),
        "Кнопка выдачи заказа доступна.",
      ).toBeEnabled();
      await card
        .getByRole("button", { name: "Выдать заказ", exact: true })
        .click();
      await expect(
        card.getByText(OrderQueueStage.ISSUED, { exact: true }),
        "Заказ выдан.",
      ).toBeVisible();
    });
  }

  async readCurrentStage(order: OrderSnapshot): Promise<OrderQueueStage> {
    const card = this.orderCard(order);

    if (
      await card
        .getByRole("button", { name: "Принять заказ", exact: true })
        .isVisible()
    ) {
      return OrderQueueStage.CREATED;
    }

    if (
      await card
        .getByRole("button", {
          name: "Начать приготовление",
          exact: true,
        })
        .isVisible()
    ) {
      return OrderQueueStage.ACCEPTED;
    }

    if (
      await card
        .getByRole("button", {
          name: "Отметить готовым",
          exact: true,
        })
        .isVisible()
    ) {
      return OrderQueueStage.PREPARING;
    }

    if (
      await card
        .getByRole("button", { name: "Выдать заказ", exact: true })
        .isVisible()
    ) {
      return OrderQueueStage.READY;
    }

    await expect(
      card.getByText(OrderQueueStage.ISSUED, { exact: true }),
      "Выданный заказ показан в очереди.",
    ).toBeVisible();

    return OrderQueueStage.ISSUED;
  }

  async readTransitionHistory(
    order: OrderSnapshot,
  ): Promise<OrderQueueTransition[]> {
    const events = this.orderDetails(order)
      .getByRole("listitem")
      .filter({ hasText: "Автор:" });

    await expect(
      events,
      "История переходов заказа показана в деталях.",
    ).not.toHaveCount(0);

    return (await events.allInnerTexts()).map((event) =>
      this.readTransition(event),
    );
  }

  private orderCard(order: OrderSnapshot): Locator {
    return this.page
      .getByTestId("staff-order-card")
      .and(this.page.locator(`[data-order-id="${order.id}"]`));
  }

  private orderDetails(order: OrderSnapshot): Locator {
    return this.orderCard(order).getByRole("region", {
      name: `Детали заказа ${order.number}`,
      exact: true,
    });
  }

  private readTransition(event: string): OrderQueueTransition {
    const [fromValue, toValue] = event.split(" — ");
    const [to] = toValue?.split(", ") ?? [];

    if (!this.isOrderQueueStage(fromValue) || !this.isOrderQueueStage(to)) {
      throw new Error("Не удалось прочитать переход статуса заказа.");
    }

    return { from: fromValue, to };
  }

  private isOrderQueueStage(
    value: string | undefined,
  ): value is OrderQueueStage {
    return Object.values(OrderQueueStage).includes(value as OrderQueueStage);
  }
}
