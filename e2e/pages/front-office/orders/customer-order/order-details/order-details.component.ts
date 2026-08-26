import { expect, test, type Locator, type Page } from "@playwright/test";

import { orderHeadingPattern, orderIdPattern } from "./order-details.constants";
import { OrderStatus } from "./order-details.types";

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

  async readSnapshot(): Promise<OrderSnapshot> {
    const [item] = await this.orderItems.allInnerTexts();

    if (item === undefined || (await this.orderItems.count()) !== 1) {
      throw new Error("Не удалось прочитать единственную позицию заказа.");
    }

    const values = this.readItemValues(item);

    return {
      id: this.readId(),
      number: await this.readNumber(),
      ...values,
      total: await this.orderTotal.innerText(),
      status: await this.readStatus(),
    };
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
        this.page.getByText(OrderStatus.ISSUED, { exact: true }),
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
    const heading = await title.innerText();

    if (!orderHeadingPattern.test(heading)) {
      throw new Error("Заголовок заказа не содержит числовой номер.");
    }

    const number = heading.replace("Заказ №", "");

    return number;
  }

  private readItemValues(
    item: string,
  ): Pick<OrderSnapshot, "productName" | "size" | "modifierName" | "quantity"> {
    const [productName, quantity, size, modifierName, lineTotal, ...rest] = item
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);

    if (
      productName === undefined ||
      quantity === undefined ||
      size === undefined ||
      modifierName === undefined ||
      lineTotal === undefined ||
      rest.length !== 0 ||
      !size.startsWith("Размер ") ||
      !modifierName.startsWith("+ ")
    ) {
      throw new Error("Не удалось прочитать состав позиции заказа.");
    }

    return { productName, size, modifierName, quantity };
  }

  private async readStatus(): Promise<OrderStatus> {
    for (const status of Object.values(OrderStatus)) {
      if (await this.page.getByText(status, { exact: true }).isVisible()) {
        return status;
      }
    }

    throw new Error("Не удалось прочитать статус заказа.");
  }
}
