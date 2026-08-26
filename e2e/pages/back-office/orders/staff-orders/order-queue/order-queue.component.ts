import { expect, test, type Locator, type Page } from "@playwright/test";

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
        card.getByText("Принят", { exact: true }),
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
        card.getByText("Готовится", { exact: true }),
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
        card.getByText("Готов к выдаче", { exact: true }),
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
        card.getByText("Выдан", { exact: true }),
        "Заказ выдан.",
      ).toBeVisible();
    });
  }

  private orderCard(order: OrderSnapshot): Locator {
    return this.page
      .getByTestId("staff-order-card")
      .and(this.page.locator(`[data-order-id="${order.id}"]`));
  }
}
