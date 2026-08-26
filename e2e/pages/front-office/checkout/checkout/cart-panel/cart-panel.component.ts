import { expect, test, type Locator, type Page } from "@playwright/test";

import type { ProductOrderScenarioData } from "@support/data/product-order-scenario-data";

export class CartPanelComponent {
  private readonly cartButton;
  private readonly items;
  private readonly checkoutButton;

  constructor(private readonly page: Page) {
    this.cartButton = page.getByRole("button", { name: /^Корзина ·/u });
    this.items = page.getByRole("list", { name: "Позиции в корзине" });
    this.checkoutButton = page.getByRole("button", {
      name: "Оформить заказ",
      exact: true,
    });
  }

  async open(): Promise<void> {
    await test.step("Открыть корзину", async () => {
      await expect(this.cartButton, "Кнопка корзины показана.").toBeVisible();
      await this.cartButton.click();
      await expect(
        this.page.getByRole("heading", { name: "Корзина", exact: true }),
        "Открыта корзина.",
      ).toBeVisible();
    });
  }

  async assertOrder(order: ProductOrderScenarioData): Promise<void> {
    await test.step("Проверить состав корзины", async () => {
      const item = this.item(order.productName);

      await expect(this.items, "Список позиций корзины показан.").toBeVisible();
      await expect(item, "Выбранный товар сохранён в корзине.").toHaveCount(1);
      await expect(
        item.getByText(`Размер ${order.productSize}`, { exact: true }),
        "Размер товара сохранён в корзине.",
      ).toBeVisible();
      await expect(
        item.getByText(`+ ${order.modifierName}`, { exact: true }),
        "Обязательная добавка сохранена в корзине.",
      ).toBeVisible();
      await this.assertQuantity(item, order.productQuantity);
      await expect(
        item.getByTestId("cart-item-line-total"),
        "Итог позиции корзины сохранён.",
      ).toHaveText(formatTotal(order));
    });
  }

  async setQuantity(productName: string, quantity: number): Promise<void> {
    await test.step(`Установить количество товара «${productName}»: ${quantity}`, async () => {
      const item = this.item(productName);
      const currentQuantity = await this.quantity(item);

      await expect(
        item,
        `Товар «${productName}» доступен в корзине.`,
      ).toBeVisible();
      for (let value = currentQuantity; value < quantity; value += 1) {
        await item
          .getByRole("button", {
            name: `Увеличить количество ${productName}`,
          })
          .click();
      }
      await this.assertQuantity(item, quantity);
    });
  }

  async startCheckout(): Promise<void> {
    await test.step("Перейти к подтверждению номера", async () => {
      await expect(
        this.checkoutButton,
        "Кнопка оформления доступна.",
      ).toBeEnabled();
      await this.checkoutButton.click();
      await expect(
        this.page.getByLabel("Номер телефона", { exact: true }),
        "Открыто подтверждение номера телефона.",
      ).toBeVisible();
    });
  }

  async placeOrder(): Promise<void> {
    await test.step("Оформить заказ", async () => {
      await expect(
        this.checkoutButton,
        "Кнопка оформления доступна.",
      ).toBeEnabled();
      await this.checkoutButton.click();
      await expect(this.page, "Открыт созданный заказ.").toHaveURL(
        /\/orders\/[0-9a-f-]{36}$/u,
      );
      await expect(
        this.page.getByText("Заказ принят", { exact: true }),
        "Заказ принят.",
      ).toBeVisible();
    });
  }

  private item(productName: string): Locator {
    return this.items.getByRole("listitem", {
      name: `Позиция корзины: ${productName}`,
    });
  }

  private async assertQuantity(item: Locator, quantity: number): Promise<void> {
    await expect(
      item.getByLabel("Количество", { exact: true }),
      `Количество товара равно ${quantity}.`,
    ).toContainText(String(quantity));
  }

  private async quantity(item: Locator): Promise<number> {
    const value = await item
      .getByLabel("Количество", { exact: true })
      .textContent();
    const quantity = Number(value);

    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      throw new Error("Количество товара в корзине не распознано.");
    }

    return quantity;
  }
}

function formatTotal(order: ProductOrderScenarioData): string {
  return `${((Number(order.productPrice) / 100) * order.productQuantity).toString()} ₽`;
}
