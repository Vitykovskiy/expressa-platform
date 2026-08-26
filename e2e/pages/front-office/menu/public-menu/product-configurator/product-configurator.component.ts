import { expect, test, type Locator, type Page } from "@playwright/test";

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

  async openProduct(product: ProductOrderScenarioData): Promise<void> {
    await test.step(`Открыть товар «${product.productName}»`, async () => {
      const card = this.productCard(product);
      const price = `${formatPrice(product.productPrice)} ₽`;

      await expect(
        card,
        `Карточка товара «${product.productName}» показана.`,
      ).toBeVisible();
      await expect(
        card.getByText(price, { exact: true }),
        "Цена варианта показана.",
      ).toBeVisible();
      await card.getByRole("button", { name: product.productName }).click();
      await expect(
        this.page.getByRole("heading", {
          name: product.productName,
          exact: true,
        }),
        `Открыта конфигурация товара «${product.productName}».`,
      ).toBeVisible();
    });
  }

  async selectVariant(size: string): Promise<void> {
    await test.step(`Выбрать размер «${size}»`, async () => {
      const variant = this.page.getByRole("button", {
        name: new RegExp(`^${escapeRegExp(size)} ·`, "u"),
      });

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
      const modifier = this.page.getByRole("button", {
        name: new RegExp(`^${escapeRegExp(modifierName)} ·`, "u"),
      });

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

  private productCard(product: ProductOrderScenarioData): Locator {
    const products = this.page.getByRole("list", {
      name: `Товары категории ${product.categoryName}`,
    });

    return products.getByRole("listitem").filter({
      has: this.page.getByRole("button", { name: product.productName }),
    });
  }
}

function formatPrice(minor: string): string {
  return (Number(minor) / 100).toLocaleString("ru-RU");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
