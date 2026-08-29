import { expect, test } from "@playwright/test";

import { ProductConfiguratorComponent } from "./product-configurator/product-configurator.component";

import type { Locator, Page } from "@playwright/test";

export class PublicMenuPage {
  public readonly product: ProductConfiguratorComponent;
  private readonly categoryButtons: Locator;
  private readonly categoryList: Locator;
  private readonly emptyMessage: Locator;
  private readonly intakeClosedMessage: Locator;
  private readonly menuHeading: Locator;
  private readonly openedCategoryTitle: Locator;
  private readonly openedProducts: Locator;
  private readonly products: Locator;

  constructor(private readonly page: Page) {
    this.product = new ProductConfiguratorComponent(page);
    this.categoryList = page.getByRole("list", { name: "Категории меню" });
    this.categoryButtons = this.categoryList.getByRole("button");
    this.emptyMessage = page.getByText("Меню пока пустое", { exact: true });
    this.intakeClosedMessage = page.getByText(
      "Новые заказы временно не принимаются",
      { exact: true },
    );
    this.menuHeading = page.getByRole("heading", {
      name: "Что будем заказывать?",
      exact: true,
    });
    this.openedCategoryTitle = page.getByRole("heading", { level: 1 });
    this.products = page.getByRole("list", { name: /^Товары категории /u });
    this.openedProducts = this.products.getByRole("button");
  }

  async open(url: string): Promise<void> {
    await test.step("Открыть меню", async () => {
      await this.page.goto(url);
      await expect(
        this.menuHeading.or(this.emptyMessage),
        "Открыто меню для клиента.",
      ).toBeVisible();
    });
  }

  async readCategoryNames(): Promise<readonly string[]> {
    const categoryButtons = await this.categoryButtons.allInnerTexts();

    return categoryButtons.map((text) => this.categoryName(text));
  }

  async readCategoryProductCounts(): Promise<readonly number[]> {
    const categoryButtons = await this.categoryButtons.allInnerTexts();

    return categoryButtons.map((text) => this.categoryProductCount(text));
  }

  async readOpenedCategoryName(): Promise<string> {
    return this.openedCategoryTitle.innerText();
  }

  async readOpenedProductNames(): Promise<readonly string[]> {
    const products = await this.openedProducts.allInnerTexts();

    return products.map((text) => this.productName(text));
  }

  async isEmptyVisible(): Promise<boolean> {
    return this.emptyMessage.isVisible();
  }

  async isCategoriesAbsent(): Promise<boolean> {
    return (await this.categoryList.count()) === 0;
  }

  async isProductsAbsent(): Promise<boolean> {
    return (await this.products.count()) === 0;
  }

  async isIntakeClosed(): Promise<boolean> {
    return this.intakeClosedMessage.isVisible();
  }

  private categoryName(text: string): string {
    const separator = text.lastIndexOf("\n");

    if (separator < 1) {
      throw new Error("Название категории не распознано.");
    }

    return text.slice(0, separator);
  }

  private productName(text: string): string {
    const [name] = text.split("\n");

    if (name === undefined || name === "") {
      throw new Error("Название товара не распознано.");
    }

    return name;
  }

  private categoryProductCount(text: string): number {
    const separator = text.lastIndexOf("\n");
    const count = Number(text.slice(separator + 1).replace(" позиций", ""));

    if (separator < 0 || !Number.isSafeInteger(count) || count < 0) {
      throw new Error("Количество товаров категории не распознано.");
    }

    return count;
  }
}
