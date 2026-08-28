import { expect, test, type Locator, type Page } from "@playwright/test";

import { orderHeadingPattern, orderIdPattern } from "./order-details.constants";
import { OrderStatus } from "./order-details.types";

import type { OrderSnapshot } from "@support/data/order-snapshot.types";

export class OrderDetailsComponent {
  private readonly orderItems: Locator;
  private readonly orderTotal: Locator;
  private readonly paymentMethod: Locator;

  constructor(private readonly page: Page) {
    this.orderItems = page
      .getByRole("list", { name: "Состав заказа", exact: true })
      .getByRole("listitem");
    this.orderTotal = page.getByTestId("order-total");
    this.paymentMethod = page.getByText("Оплата на кассе при получении", {
      exact: true,
    });
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
      lineTotal: await this.orderItems
        .getByTestId("order-item-line-total")
        .innerText(),
      total: await this.orderTotal.innerText(),
      status: await this.readStatus(),
    };
  }

  async readItemsCount(): Promise<number> {
    return this.orderItems.count();
  }

  async readReference(): Promise<Pick<OrderSnapshot, "id" | "number">> {
    return {
      id: this.readId(),
      number: await this.readNumber(),
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

  async assertStatus(status: OrderStatus): Promise<void> {
    await expect(
      this.page.getByText(status, { exact: true }),
      `Заказ находится на стадии «${status}».`,
    ).toBeVisible();
  }

  async readPaymentMethod(): Promise<string> {
    return this.paymentMethod.innerText();
  }

  async isUnavailableMessageVisible(): Promise<boolean> {
    return this.page
      .getByText("Заказ недоступен.", { exact: true })
      .isVisible();
  }

  async areItemsAbsent(): Promise<boolean> {
    return (await this.orderItems.count()) === 0;
  }

  async isTotalAbsent(): Promise<boolean> {
    return (await this.orderTotal.count()) === 0;
  }

  async areStatusesAbsent(): Promise<boolean> {
    for (const status of Object.values(OrderStatus)) {
      if ((await this.page.getByText(status, { exact: true }).count()) !== 0) {
        return false;
      }
    }

    return true;
  }

  async assertUnavailable(): Promise<void> {
    await expect(
      this.page.getByText("Заказ недоступен.", { exact: true }),
      "Показано сообщение о недоступности заказа.",
    ).toBeVisible();
    await expect(
      this.orderItems,
      "Состав недоступного заказа не показан.",
    ).toHaveCount(0);
    await expect(
      this.orderTotal,
      "Сумма недоступного заказа не показана.",
    ).toHaveCount(0);
  }

  async enableNotifications(): Promise<void> {
    await test.step("Включить уведомления о заказе", async () => {
      const enableButton = this.page.getByRole("button", {
        name: "Включить уведомления",
        exact: true,
      });

      await expect(
        enableButton,
        "Включение уведомлений доступно.",
      ).toBeEnabled();
      await enableButton.click();
      await expect(
        this.page.getByRole("button", {
          name: "Отключить уведомления",
          exact: true,
        }),
        "Уведомления о заказе включены.",
      ).toBeVisible();
    });
  }

  async assertNotificationsUnsupported(): Promise<void> {
    await expect(
      this.page.getByText("Уведомления не поддерживаются этим браузером.", {
        exact: true,
      }),
      "Показано ограничение уведомлений браузера.",
    ).toBeVisible();
  }

  async repeatOrder(): Promise<void> {
    await test.step("Повторить заказ", async () => {
      const repeatButton = this.page.getByRole("button", {
        name: "Повторить заказ",
        exact: true,
      });

      await expect(repeatButton, "Повтор заказа доступен.").toBeEnabled();
      await repeatButton.click();
      await expect(
        this.page
          .getByRole("heading", { name: "Корзина", exact: true })
          .or(this.repeatUnavailableAlert()),
        "Повтор заказа завершён открытием корзины или сообщением о недоступных позициях.",
      ).toBeVisible();
    });
  }

  async readRepeatUnavailableProductNames(): Promise<readonly string[]> {
    await expect(
      this.repeatUnavailableAlert(),
      "Показано ограничение повторения заказа.",
    ).toBeVisible();

    return this.repeatUnavailableAlert().getByRole("listitem").allInnerTexts();
  }

  async readRepeatUnavailableReason(productName: string): Promise<string> {
    const item = this.repeatUnavailableAlert()
      .getByRole("listitem")
      .filter({ hasText: productName });
    const text = await item.innerText();
    const reason = text.replace(productName, "").trim();

    if (reason === "") {
      throw new Error(
        `Причина недоступности позиции «${productName}» не показана.`,
      );
    }

    return reason;
  }

  private heading(number: string): Locator {
    return this.page.getByRole("heading", {
      name: `Заказ №${number}`,
      exact: true,
    });
  }

  private repeatUnavailableAlert(): Locator {
    return this.page.getByRole("alert");
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
