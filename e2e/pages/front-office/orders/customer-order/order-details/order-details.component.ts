import { expect, test, type Locator, type Page } from "@playwright/test";

import { orderHeadingPattern, orderIdPattern } from "./order-details.constants";
import { OrderPaymentMethod, OrderStatus } from "./order-details.types";

import type { OrderSnapshot } from "@support/data/order-snapshot.types";

export class OrderDetailsComponent {
  private readonly loadingState: Locator;
  private readonly orderTitle: Locator;
  private readonly orderItems: Locator;
  private readonly orderTotal: Locator;
  private readonly paymentMethod: Locator;
  private readonly unavailableMessage: Locator;
  private readonly enableNotificationsButton: Locator;
  private readonly disableNotificationsButton: Locator;
  private readonly notificationsUnsupportedMessage: Locator;
  private readonly repeatButton: Locator;
  private readonly cartTitle: Locator;

  constructor(private readonly page: Page) {
    this.loadingState = page.getByRole("status", {
      name: "Загружаем заказ",
      exact: true,
    });
    this.orderTitle = page.getByRole("heading", { level: 1 });
    this.orderItems = page
      .getByRole("list", { name: "Состав заказа", exact: true })
      .getByRole("listitem");
    this.orderTotal = page.getByTestId("order-total");
    this.paymentMethod = page.getByText(OrderPaymentMethod.CASH_ON_PICKUP, {
      exact: true,
    });
    this.unavailableMessage = page.getByText("Заказ недоступен.", {
      exact: true,
    });
    this.enableNotificationsButton = page.getByRole("button", {
      name: "Включить уведомления",
      exact: true,
    });
    this.disableNotificationsButton = page.getByRole("button", {
      name: "Отключить уведомления",
      exact: true,
    });
    this.notificationsUnsupportedMessage = page.getByText(
      "Уведомления не поддерживаются этим браузером.",
      { exact: true },
    );
    this.repeatButton = page.getByRole("button", {
      name: "Повторить заказ",
      exact: true,
    });
    this.cartTitle = page.getByRole("heading", {
      name: "Корзина",
      exact: true,
    });
  }

  async waitReady(): Promise<void> {
    await expect(this.loadingState, "Загрузка заказа завершена.").toHaveCount(
      0,
    );
    await expect(this.orderTitle, "Страница заказа открыта.").toBeVisible();
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
      lineTotal: await this.itemLineTotal(this.orderItems).innerText(),
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
        this.itemProduct(item, snapshot.productName),
        "Товар соответствует сохранённому снимку.",
      ).toBeVisible();
      await expect(
        this.itemSize(item, snapshot.size),
        "Размер соответствует сохранённому снимку.",
      ).toBeVisible();
      await expect(
        this.itemModifier(item, snapshot.modifierName),
        "Добавка соответствует сохранённому снимку.",
      ).toBeVisible();
      await expect(
        this.itemQuantity(item, snapshot.quantity),
        "Количество и цена соответствуют сохранённому снимку.",
      ).toBeVisible();
      await expect(
        this.itemLineTotal(item),
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
        this.status(OrderStatus.ISSUED),
        "Заказ выдан клиенту.",
      ).toBeVisible();
      await this.assertMatches(snapshot);
    });
  }

  async assertStatus(status: OrderStatus): Promise<void> {
    await expect(
      this.status(status),
      `Заказ находится на стадии «${status}».`,
    ).toBeVisible();
  }

  async readPaymentMethod(): Promise<OrderPaymentMethod> {
    const paymentMethod = await this.paymentMethod.innerText();

    if (paymentMethod !== OrderPaymentMethod.CASH_ON_PICKUP) {
      throw new Error("Не удалось прочитать способ оплаты заказа.");
    }

    return paymentMethod;
  }

  async isUnavailableMessageVisible(): Promise<boolean> {
    return this.unavailableMessage.isVisible();
  }

  async areItemsAbsent(): Promise<boolean> {
    return (await this.orderItems.count()) === 0;
  }

  async isTotalAbsent(): Promise<boolean> {
    return (await this.orderTotal.count()) === 0;
  }

  async areStatusesAbsent(): Promise<boolean> {
    for (const status of Object.values(OrderStatus)) {
      if ((await this.status(status).count()) !== 0) {
        return false;
      }
    }

    return true;
  }

  async assertUnavailable(): Promise<void> {
    await expect(
      this.unavailableMessage,
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
      await expect(
        this.enableNotificationsButton,
        "Включение уведомлений доступно.",
      ).toBeEnabled();
      await this.enableNotificationsButton.click();
      await expect(
        this.disableNotificationsButton,
        "Уведомления о заказе включены.",
      ).toBeVisible();
    });
  }

  async assertNotificationsUnsupported(): Promise<void> {
    await expect(
      this.notificationsUnsupportedMessage,
      "Показано ограничение уведомлений браузера.",
    ).toBeVisible();
  }

  async repeatOrder(): Promise<void> {
    await test.step("Повторить заказ", async () => {
      await expect(this.repeatButton, "Повтор заказа доступен.").toBeEnabled();
      await this.repeatButton.click();
      await expect(this.page, "Открыт путь корзины.").toHaveURL(
        (url) => url.pathname === "/cart",
      );
      await expect(
        this.cartTitle,
        "Повтор заказа завершён открытием корзины.",
      ).toBeVisible();
    });
  }

  private heading(number: string): Locator {
    return this.page.getByRole("heading", {
      name: `Заказ №${number}`,
      exact: true,
    });
  }

  private status(status: OrderStatus): Locator {
    return this.page.getByText(status, { exact: true });
  }

  private itemProduct(item: Locator, productName: string): Locator {
    return item.getByText(productName, { exact: true });
  }

  private itemSize(item: Locator, size: string): Locator {
    return item.getByText(size, { exact: true });
  }

  private itemModifier(item: Locator, modifierName: string): Locator {
    return item.getByText(modifierName, { exact: true });
  }

  private itemQuantity(item: Locator, quantity: string): Locator {
    return item.getByText(quantity, { exact: true });
  }

  private itemLineTotal(item: Locator): Locator {
    return item.getByTestId("order-item-line-total");
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
    const heading = await this.orderTitle.innerText();

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
      if (await this.status(status).isVisible()) {
        return status;
      }
    }

    throw new Error("Не удалось прочитать статус заказа.");
  }
}
