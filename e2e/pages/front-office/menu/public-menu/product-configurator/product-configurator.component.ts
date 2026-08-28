import { expect, test, type Locator, type Page } from "@playwright/test";

import { ProductSize } from "./product-configurator.types";

import type { ProductOrderScenarioData } from "@support/data/product-order-scenario-data";

export class ProductConfiguratorComponent {
  private readonly categoryList;
  private readonly addToCartButton;

  constructor(private readonly page: Page) {
    this.categoryList = page.getByRole("list", { name: "Категории меню" });
    this.addToCartButton = page.getByRole("button", {
      name: /^Добавить ·/u,
    });
  }

  async openCategory(categoryName: string): Promise<void> {
    await test.step(`Открыть категорию «${categoryName}»`, async () => {
      const category = this.categoryList.getByRole("button", {
        name: categoryName,
        exact: true,
      });

      await expect(
        category,
        `Категория «${categoryName}» доступна.`,
      ).toBeEnabled();
      await category.click();
      await expect(
        this.page.getByRole("heading", { name: categoryName, exact: true }),
        `Открыта категория «${categoryName}».`,
      ).toBeVisible();
    });
  }

  async openProduct(product: ProductOrderScenarioData | string): Promise<void> {
    const productName =
      typeof product === "string" ? product : product.productName;

    await test.step(`Открыть товар «${productName}»`, async () => {
      const card = this.productCard(productName);

      await expect(
        card,
        `Карточка товара «${productName}» показана.`,
      ).toBeVisible();
      await card.getByRole("button", { name: productName }).click();
      await expect(
        this.page.getByRole("heading", {
          name: productName,
          exact: true,
        }),
        `Открыта конфигурация товара «${productName}».`,
      ).toBeVisible();
    });
  }

  async isProductVisible(productName: string): Promise<boolean> {
    return this.productButton(productName).isVisible();
  }

  async isProductOpenable(productName: string): Promise<boolean> {
    return this.productButton(productName).isEnabled();
  }

  async isProductAbsent(productName: string): Promise<boolean> {
    return (await this.productButton(productName).count()) === 0;
  }

  async isVariantSelectable(size: ProductSize): Promise<boolean> {
    return this.variant(size).isEnabled();
  }

  async isModifierSelectable(modifierName: string): Promise<boolean> {
    return this.modifier(modifierName).isEnabled();
  }

  async selectVariant(size: ProductSize): Promise<void> {
    await test.step(`Выбрать размер «${size}»`, async () => {
      const variant = this.variant(size);

      await expect(variant, `Размер «${size}» доступен.`).toBeEnabled();
      await variant.click();
      await expect(variant, `Выбран размер «${size}».`).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  }

  async selectModifier(modifierName: string): Promise<void> {
    await test.step(`Выбрать добавку «${modifierName}»`, async () => {
      const modifier = this.modifier(modifierName);

      await expect(
        modifier,
        `Добавка «${modifierName}» доступна.`,
      ).toBeEnabled();
      await modifier.click();
      await expect(
        modifier,
        `Выбрана добавка «${modifierName}».`,
      ).toHaveAttribute("aria-pressed", "true");
    });
  }

  async readProductPrice(): Promise<string> {
    const [, price] = (await this.selectedSize().innerText()).split(" · ");

    if (price === undefined) {
      throw new Error("Цена выбранного размера не найдена.");
    }

    return price;
  }

  async readConfigurationTotal(): Promise<string> {
    const [, total] = (await this.configurationTotal().innerText()).split(
      " · ",
    );

    if (total === undefined) {
      throw new Error("Итог конфигурации товара не найден.");
    }

    return total;
  }

  async readOpenedProductTitle(): Promise<string> {
    return this.productTitle().innerText();
  }

  async isProductDescriptionVisible(expected: string): Promise<boolean> {
    return this.productDescription(expected).isVisible();
  }

  async readVariants(): Promise<readonly ProductSize[]> {
    const variants = await this.variants().allInnerTexts();

    return variants.map((variant) => this.variantSize(variant));
  }

  async readModifierGroupNames(): Promise<readonly string[]> {
    const groups = await this.modifierGroups().allInnerTexts();

    return groups
      .map((group) => group.split("\n")[0]?.trim())
      .filter(
        (groupName): groupName is string =>
          groupName !== undefined && groupName !== "Размер",
      );
  }

  async readSelectedSize(): Promise<ProductSize> {
    const [size] = (await this.selectedSize().innerText()).split(" · ");

    if (!this.isProductSize(size)) {
      throw new Error("Выбранный размер товара не распознан.");
    }

    return size;
  }

  async readSelectedRequiredModifier(groupName: string): Promise<string> {
    const [modifierName] = (
      await this.selectedRequiredModifier(groupName).innerText()
    ).split(" · ");

    if (modifierName === undefined) {
      throw new Error("Выбранная обязательная добавка не найдена.");
    }

    return modifierName;
  }

  async readQuantity(): Promise<number> {
    const value = await this.quantity().textContent();
    const quantity = Number(value);

    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      throw new Error("Количество конфигурации товара не распознано.");
    }

    return quantity;
  }

  async setQuantity(quantity: number): Promise<void> {
    await test.step(`Установить количество товара: ${quantity}`, async () => {
      const currentQuantity = await this.readQuantity();
      const buttonName =
        quantity > currentQuantity
          ? "Увеличить количество"
          : "Уменьшить количество";

      for (
        let value = currentQuantity;
        value !== quantity;
        value += quantity > currentQuantity ? 1 : -1
      ) {
        await this.page
          .getByRole("button", { name: buttonName, exact: true })
          .click();
      }

      await expect(
        this.page.getByLabel("Количество", { exact: true }),
        `Количество товара равно ${quantity}.`,
      ).toContainText(String(quantity));
    });
  }

  async addToCart(): Promise<void> {
    await test.step("Добавить настроенный товар в корзину", async () => {
      await expect(
        this.addToCartButton,
        "Кнопка добавления доступна.",
      ).toBeEnabled();
      await this.addToCartButton.click();
      await expect(
        this.addToCartButton,
        "Конфигурация товара закрыта.",
      ).toHaveCount(0);
    });
  }

  private productCard(productName: string): Locator {
    const products = this.page.getByRole("list", {
      name: /^Товары категории /u,
    });

    return products.getByRole("listitem").filter({
      has: this.page.getByRole("button", { name: productName, exact: true }),
    });
  }

  private productButton(productName: string): Locator {
    return this.page.getByRole("button", { name: productName, exact: true });
  }

  private productTitle(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  private productDescription(expected: string): Locator {
    return this.page.getByText(expected, { exact: true });
  }

  private variants(): Locator {
    return this.page
      .getByRole("group", { name: "Размер", exact: true })
      .getByRole("button");
  }

  private variant(size: ProductSize): Locator {
    return this.page.getByRole("button", {
      name: new RegExp(`^${escapeRegExp(size)} ·`, "u"),
    });
  }

  private modifier(modifierName: string): Locator {
    return this.page.getByRole("button", {
      name: new RegExp(`^${escapeRegExp(modifierName)} ·`, "u"),
    });
  }

  private modifierGroups(): Locator {
    return this.page.getByRole("group");
  }

  private quantity(): Locator {
    return this.page.getByLabel("Количество", { exact: true });
  }

  private configurationTotal(): Locator {
    return this.addToCartButton;
  }

  private selectedSize(): Locator {
    return this.page
      .getByRole("group", { name: "Размер", exact: true })
      .getByRole("button", { pressed: true });
  }

  private selectedRequiredModifier(groupName: string): Locator {
    return this.page
      .getByRole("group", { name: groupName, exact: true })
      .getByRole("button", { pressed: true });
  }

  private isProductSize(value: string | undefined): value is ProductSize {
    return Object.values(ProductSize).includes(value as ProductSize);
  }

  private variantSize(variant: string): ProductSize {
    const [size] = variant.split(" · ");

    if (!this.isProductSize(size)) {
      throw new Error("Вариант товара не распознан.");
    }

    return size;
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
