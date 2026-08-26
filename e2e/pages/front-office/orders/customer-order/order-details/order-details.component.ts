import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  currencyFormatter,
  orderHeadingPattern,
  orderIdPattern,
} from "./order-details.constants";

import type { ProductOrderScenarioData } from "@support/data/product-order-scenario-data";
import type { OrderSnapshot } from "@support/data/order-snapshot.types";

export class OrderDetailsComponent {
  private readonly orderItems: Locator;
  private readonly orderTotal: Locator;

  constructor(private readonly page: Page) {
    this.orderItems = page
      .getByRole("list", { name: "Состав заказа", exact: true })
      .getByRole("listitem");
    this.orderTotal = page.getByTestId("order-total");
  }

  async readSnapshot(order: ProductOrderScenarioData): Promise<OrderSnapshot> {
    return test.step(`Сохранить снимок заказа «${order.productName}»`, async () => {
      await expect(
        this.page.getByText("Заказ принят", { exact: true }),
        "Заказ принят.",
      ).toBeVisible();
      await this.assertScenarioOrder(order);

      const number = await this.readNumber();

      return {
        id: this.readId(),
        number,
        productName: order.productName,
        size: `Размер ${order.productSize}`,
        modifierName: `+ ${order.modifierName}`,
        quantity: this.quantity(order),
        total: this.total(order),
      };
    });
  }

  async assertMatches(snapshot: OrderSnapshot): Promise<void> {
    await test.step(`Сверить состав заказа ${snapshot.number}`, async () => {
      await expect(
        this.heading(snapshot.number),
        "Открыт исходный заказ.",
      ).toBeVisible();
      const item = await this.onlyItem();

      await expect(
        item.getByText(snapshot.productName, { exact: true }),
        "Товар соответствует сохранённому снимку.",
      ).toBeVisible();
      await expect(
        item.getByText(snapshot.size, { exact: true }),
        "Размер соответствует сохранённому снимку.",
      ).toBeVisible();
      await expect(
        item.getByText(snapshot.modifierName, { exact: true }),
        "Добавка соответствует сохранённому снимку.",
      ).toBeVisible();
      await expect(
        item.getByText(snapshot.quantity, { exact: true }),
        "Количество и цена соответствуют сохранённому снимку.",
      ).toBeVisible();
      await expect(
        item.getByTestId("order-item-line-total"),
        "Итог позиции соответствует сохранённому снимку.",
      ).toHaveText(snapshot.total);
      await expect(
        this.orderTotal,
        "Итог заказа соответствует сохранённому снимку.",
      ).toHaveText(snapshot.total);
    });
  }

  async assertIssued(snapshot: OrderSnapshot): Promise<void> {
    await test.step(`Проверить выдачу заказа ${snapshot.number}`, async () => {
      await expect(
        this.page.getByText("Заказ выдан", { exact: true }),
        "Заказ выдан клиенту.",
      ).toBeVisible();
      await this.assertMatches(snapshot);
    });
  }

  private heading(number: string): Locator {
    return this.page.getByRole("heading", {
      name: `Заказ №${number}`,
      exact: true,
    });
  }

  private async onlyItem(): Promise<Locator> {
    await expect(
      this.orderItems,
      "В заказе показана ровно одна позиция.",
    ).toHaveCount(1);

    return this.orderItems;
  }

  private async assertScenarioOrder(
    order: ProductOrderScenarioData,
  ): Promise<void> {
    const item = await this.onlyItem();

    await expect(
      item.getByText(order.productName, { exact: true }),
      "Заказ содержит выбранный товар.",
    ).toBeVisible();
    await expect(
      item.getByText(`Размер ${order.productSize}`, { exact: true }),
      "Заказ содержит выбранный размер.",
    ).toBeVisible();
    await expect(
      item.getByText(`+ ${order.modifierName}`, { exact: true }),
      "Заказ содержит обязательную добавку.",
    ).toBeVisible();
    await expect(
      item.getByText(this.quantity(order), { exact: true }),
      "Заказ содержит выбранное количество и цену.",
    ).toBeVisible();
    await expect(
      item.getByTestId("order-item-line-total"),
      "Итог позиции равен цене, умноженной на количество.",
    ).toHaveText(this.total(order));
    await expect(
      this.orderTotal,
      "Итог заказа равен итогу единственной позиции.",
    ).toHaveText(this.total(order));
  }

  private readId(): string {
    const path = new URL(this.page.url()).pathname.split("/").filter(Boolean);
    const [resource, id] = path;

    if (
      resource !== "orders" ||
      id === undefined ||
      path.length !== 2 ||
      !orderIdPattern.test(id)
    ) {
      throw new Error("Идентификатор заказа не найден в адресе страницы.");
    }

    return id;
  }

  private async readNumber(): Promise<string> {
    const title = this.page.getByRole("heading", { level: 1 });
    await expect(title, "Заголовок заказа содержит числовой номер.").toHaveText(
      orderHeadingPattern,
    );
    const number = (await title.innerText()).replace("Заказ №", "");

    return number;
  }

  private quantity(order: ProductOrderScenarioData): string {
    return `${order.productQuantity} × ${currencyFormatter.format(
      Number(order.productPrice) / 100,
    )}`;
  }

  private total(order: ProductOrderScenarioData): string {
    return currencyFormatter.format(
      (Number(order.productPrice) * order.productQuantity) / 100,
    );
  }
}
