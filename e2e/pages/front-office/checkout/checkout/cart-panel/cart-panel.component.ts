import { expect, test } from "@playwright/test";

import { ProductSize } from "@pages/front-office/menu/public-menu/product-configurator/product-configurator.types";

import type { Locator, Page } from "@playwright/test";

import {
  CartItemSize,
  type CartRepeatWarning,
} from "./cart-panel.component.types";

export class CartPanelComponent {
  private readonly cartButton: Locator;
  private readonly items: Locator;
  private readonly checkoutButton: Locator;
  private readonly repeatWarnings: Locator;

  constructor(private readonly page: Page) {
    this.cartButton = page
      .getByRole("button", { name: /^(?:Корзина|Корзина \d+)$/u })
      .filter({ visible: true });
    this.items = page.getByRole("list", { name: "Позиции в корзине" });
    this.checkoutButton = page.getByRole("button", {
      name: /^Оформить заказ/u,
    });
    this.repeatWarnings = page.getByRole("alert", {
      name: "Не все позиции из заказа добавлены",
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

  async readItemName(
    productName: string,
    variant?: ProductSize,
    modifiers: readonly string[] = [],
  ): Promise<string> {
    return this.item(productName, variant, modifiers)
      .getByRole("heading", { level: 2 })
      .innerText();
  }

  async readItemVariant(
    productName: string,
    variant: ProductSize,
    modifiers: readonly string[],
  ): Promise<CartItemSize> {
    const displayedSize = await this.item(productName, variant, modifiers)
      .getByText(`Размер ${variant}`, { exact: true })
      .innerText();

    if (!Object.values(CartItemSize).includes(displayedSize as CartItemSize)) {
      throw new Error(`Неизвестный отображаемый размер «${displayedSize}».`);
    }

    return displayedSize as CartItemSize;
  }

  async readItemModifiers(
    productName: string,
    variant: ProductSize,
    modifiers: readonly string[],
  ): Promise<readonly string[]> {
    return this.item(productName, variant, modifiers)
      .getByRole("list", { name: "Добавки", exact: true })
      .getByRole("listitem")
      .allInnerTexts();
  }

  async readItemQuantity(
    productName: string,
    variant: ProductSize,
    modifiers: readonly string[],
  ): Promise<number> {
    return this.quantity(this.item(productName, variant, modifiers));
  }

  async readItemLineTotal(
    productName: string,
    variant: ProductSize,
    modifiers: readonly string[],
  ): Promise<string> {
    return this.item(productName, variant, modifiers)
      .getByTestId("cart-item-line-total")
      .innerText();
  }

  async readTotal(): Promise<string> {
    const total = await this.page
      .getByLabel("Итого заказа", { exact: true })
      .innerText();

    return total.replace("Итого", "").trim();
  }

  async readUpdatedTotals(): Promise<{
    readonly previousTotal: string;
    readonly newTotal: string;
  }> {
    const summary = this.orderSummary();

    await expect(summary, "Показана единственная сводка заказа.").toHaveCount(
      1,
    );
    const previousTotal = await this.totalValue(summary, "Предыдущий итог");
    const newTotal = await this.totalValue(summary, "Новый итог");

    return { previousTotal, newTotal };
  }

  async readItemsCount(): Promise<number> {
    return this.items
      .getByRole("listitem", { name: /^Позиция корзины:/u })
      .count();
  }

  async readItemNames(): Promise<readonly string[]> {
    return this.items.getByRole("heading", { level: 2 }).allInnerTexts();
  }

  async readRepeatWarnings(): Promise<readonly CartRepeatWarning[]> {
    await expect(
      this.repeatWarnings,
      "Показан отчёт о недоступных позициях повторного заказа.",
    ).toBeVisible();

    return (await this.repeatWarningItems().allInnerTexts()).map((warning) =>
      this.readRepeatWarningValues(warning),
    );
  }

  async readRepeatWarning(productName: string): Promise<CartRepeatWarning> {
    const warning = this.repeatWarning(productName);

    await expect(
      warning,
      `Показано предупреждение для позиции «${productName}».`,
    ).toHaveCount(1);
    await expect(
      warning,
      `Предупреждение для позиции «${productName}» показано.`,
    ).toBeVisible();

    return this.readRepeatWarningValues(await warning.innerText());
  }

  async isEmpty(): Promise<boolean> {
    return (await this.items.count()) === 0;
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return this.emptyMessage().isVisible();
  }

  async isItemUnavailable(
    productName: string,
    variant?: ProductSize,
    modifiers: readonly string[] = [],
  ): Promise<boolean> {
    const item = this.item(productName, variant, modifiers);
    const message = this.unavailableItemMessage(item);
    const [descriptionId, messageId] = await Promise.all([
      item.getAttribute("aria-describedby"),
      message.getAttribute("id"),
    ]);

    return (
      (await item.isVisible()) &&
      (await message.isVisible()) &&
      descriptionId !== null &&
      descriptionId === messageId
    );
  }

  async isUnavailableItemMessageVisible(
    productName: string,
    variant?: ProductSize,
    modifiers: readonly string[] = [],
  ): Promise<boolean> {
    return this.unavailableItemMessage(
      this.item(productName, variant, modifiers),
    ).isVisible();
  }

  async waitForUnavailableItemMessage(
    productName: string,
    variant?: ProductSize,
    modifiers: readonly string[] = [],
  ): Promise<void> {
    await expect(
      this.unavailableItemMessage(this.item(productName, variant, modifiers)),
      `Товар «${productName}» помечен недоступным.`,
    ).toBeVisible();
  }

  async isIntakeClosedVisible(): Promise<boolean> {
    return this.page
      .getByText("Приём новых заказов сейчас закрыт.", { exact: true })
      .isVisible();
  }

  async isCheckoutEnabled(): Promise<boolean> {
    return this.checkoutButton.isEnabled();
  }

  async isUpdatedTotalConfirmationVisible(): Promise<boolean> {
    return this.updatedTotalConfirmation().isVisible();
  }

  async setQuantity(
    productName: string,
    quantity: number,
    variant?: ProductSize,
    modifiers: readonly string[] = [],
  ): Promise<void> {
    await test.step(`Установить количество товара «${productName}»: ${quantity}`, async () => {
      const item = this.item(productName, variant, modifiers);

      await expect(
        item,
        `Товар «${productName}» определён в корзине однозначно.`,
      ).toHaveCount(1);
      await expect(
        item,
        `Товар «${productName}» доступен в корзине.`,
      ).toBeVisible();
      const currentQuantity = await this.quantity(item);
      const buttonName =
        quantity > currentQuantity
          ? `Увеличить количество ${productName}`
          : `Уменьшить количество ${productName}`;

      for (
        let value = currentQuantity;
        value !== quantity;
        value += quantity > currentQuantity ? 1 : -1
      ) {
        await item
          .getByRole("button", {
            name: buttonName,
          })
          .click();
      }
      await this.assertQuantity(item, quantity);
    });
  }

  async remove(
    productName: string,
    variant?: ProductSize,
    modifiers: readonly string[] = [],
  ): Promise<void> {
    await test.step(`Удалить товар «${productName}» из корзины`, async () => {
      const item = this.item(productName, variant, modifiers);

      await expect(
        item,
        `Товар «${productName}» показан в корзине.`,
      ).toHaveCount(1);
      await expect(
        item,
        `Товар «${productName}» показан в корзине.`,
      ).toBeVisible();
      await item
        .getByRole("button", { name: `Удалить ${productName}`, exact: true })
        .click();
      await expect(
        item,
        `Товар «${productName}» удалён из корзины.`,
      ).toHaveCount(0);
    });
  }

  async assertEmpty(): Promise<void> {
    await test.step("Проверить пустую корзину", async () => {
      await expect(
        this.emptyMessage(),
        "Показано пустое состояние корзины.",
      ).toBeVisible();
      await expect(this.items, "Список позиций не показан.").toHaveCount(0);
    });
  }

  async continueToMenu(): Promise<void> {
    await test.step("Перейти из корзины в меню", async () => {
      await this.page
        .getByRole("button", { name: "Перейти в меню", exact: true })
        .click();
      await expect(this.page, "Открыт путь публичного меню.").toHaveURL(
        (url) => url.pathname === "/",
      );
    });
  }

  async confirmUpdatedTotal(): Promise<void> {
    await test.step("Подтвердить новый итог заказа", async () => {
      const confirmation = this.updatedTotalConfirmation();

      await expect(
        confirmation,
        "Подтверждение нового итога доступно.",
      ).toBeEnabled();
      await confirmation.click();
      await expect(this.page, "Открыт созданный заказ.").toHaveURL(
        /\/orders\/[0-9a-f-]{36}$/u,
      );
    });
  }

  async requestUpdatedTotalConfirmation(): Promise<void> {
    await test.step("Выбрать оформление заказа", async () => {
      await expect(
        this.checkoutButton,
        "Кнопка оформления доступна.",
      ).toBeEnabled();
      await this.checkoutButton.click();
      await expect(
        this.updatedTotalConfirmation(),
        "Подтверждение нового итога показано.",
      ).toBeVisible();
    });
  }

  async requestAvailabilityRevalidation(): Promise<void> {
    await test.step("Начать оформление для проверки доступности", async () => {
      await expect(
        this.checkoutButton,
        "Кнопка оформления доступна до проверки корзины.",
      ).toBeEnabled();
      await this.checkoutButton.click();
      await expect(
        this.checkoutButton,
        "Оформление заблокировано до удаления недоступной позиции.",
      ).toBeDisabled();
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
    });
  }

  async placeOrderTwice(): Promise<void> {
    await test.step("Дважды выбрать оформление заказа", async () => {
      await expect(
        this.checkoutButton,
        "Кнопка оформления доступна.",
      ).toBeEnabled();
      await this.checkoutButton.dblclick();
      await expect(this.page, "Открыт созданный заказ.").toHaveURL(
        /\/orders\/[0-9a-f-]{36}$/u,
      );
    });
  }

  private item(
    productName: string,
    variant?: ProductSize,
    modifiers: readonly string[] = [],
  ): Locator {
    let item = this.items.getByRole("listitem", {
      name: `Позиция корзины: ${productName}`,
    });

    if (variant === undefined) return item;

    item = item.filter({
      has: this.page.getByText(`Размер ${variant}`, { exact: true }),
    });

    if (modifiers.length === 0) {
      return item.filter({
        hasNot: this.page.getByRole("list", {
          name: "Добавки",
          exact: true,
        }),
      });
    }

    return item.filter({ has: this.modifierList(modifiers) });
  }

  private emptyMessage(): Locator {
    return this.page.getByText("Пока ничего не добавлено", { exact: true });
  }

  private repeatWarningItems(): Locator {
    return this.repeatWarnings.getByRole("list").getByRole("listitem");
  }

  private repeatWarning(productName: string): Locator {
    return this.repeatWarningItems().filter({
      has: this.page.getByText(productName, { exact: true }),
    });
  }

  private readRepeatWarningValues(value: string): CartRepeatWarning {
    const [productName, firstDetail, secondDetail, ...rest] = value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (
      productName === undefined ||
      firstDetail === undefined ||
      rest.length !== 0
    ) {
      throw new Error("Не удалось прочитать предупреждение повторного заказа.");
    }

    if (secondDetail === undefined) {
      return { productName, reason: firstDetail };
    }

    return {
      productName,
      context: firstDetail,
      reason: secondDetail,
    };
  }

  private updatedTotalConfirmation(): Locator {
    return this.page.getByRole("button", {
      name: /^Подтвердить новый итог(?: · \d{1,3}(?: \d{3})* ₽)?$/u,
    });
  }

  private unavailableItemMessage(item: Locator): Locator {
    return item.getByRole("status").filter({
      hasText: "Сейчас недоступно — удалите позицию или выберите другую",
    });
  }

  private orderSummary(): Locator {
    return this.page
      .getByRole("complementary", { name: "Сводка заказа", exact: true })
      .or(this.page.getByLabel("Изменение итога заказа", { exact: true }))
      .filter({ visible: true });
  }

  private async totalValue(summary: Locator, label: string): Promise<string> {
    const total = summary
      .getByRole("group", { name: label, exact: true })
      .getByText(/^\d{1,3}(?:\u00a0\d{3})*\u00a0₽$/u, { exact: true });

    await expect(total, `Показан итог «${label}» в целых рублях.`).toHaveCount(
      1,
    );

    return total.innerText();
  }

  private modifierList(modifiers: readonly string[]): Locator {
    return this.page
      .getByRole("list", { name: "Добавки", exact: true })
      .filter({ hasText: this.modifierPattern(modifiers) });
  }

  private modifierPattern(modifiers: readonly string[]): RegExp {
    const quantities = new Map<string, number>();

    for (const modifier of modifiers) {
      quantities.set(modifier, (quantities.get(modifier) ?? 0) + 1);
    }

    const entries = [...quantities.entries()].map(([modifier, quantity]) => {
      const suffix = quantity === 1 ? "" : `\\s*×\\s*${quantity}`;

      return `\\+\\s*${this.escapeRegExp(modifier)}${suffix}(?=\\s*\\+|\\s*$)`;
    });
    const expectedEntries = entries.map(
      (entry) => `(?=[\\s\\S]*${entry})(?![\\s\\S]*${entry}[\\s\\S]*${entry})`,
    );
    const allowedEntries = entries.join("|");

    return new RegExp(
      `^${expectedEntries.join("")}(?:${allowedEntries})(?:\\s*(?:${allowedEntries}))*\\s*$`,
      "u",
    );
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
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
