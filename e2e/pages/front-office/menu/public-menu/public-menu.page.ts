import { expect, test, type Locator, type Page } from "@playwright/test";

import { ProductConfiguratorComponent } from "./product-configurator/product-configurator.component";

export class PublicMenuPage {
  public readonly product: ProductConfiguratorComponent;

  constructor(private readonly page: Page) {
    this.product = new ProductConfiguratorComponent(page);
  }

  async open(url: string): Promise<void> {
    await test.step("Открыть меню", async () => {
      await this.page.goto(url);
      await expect(
        this.page
          .getByRole("heading", {
            name: "Что будем заказывать?",
            exact: true,
          })
          .or(this.page.getByText("Меню пока пустое", { exact: true })),
        "Открыто меню для клиента.",
      ).toBeVisible();
    });
  }

  async readCategoryNames(): Promise<readonly string[]> {
    const categoryButtons = await this.categoryButtons().allInnerTexts();

    return categoryButtons.map((text) => this.categoryName(text));
  }

  async readCategoryProductCounts(): Promise<readonly number[]> {
    const categoryButtons = await this.categoryButtons().allInnerTexts();

    return categoryButtons.map((text) => this.categoryProductCount(text));
  }

  async readOpenedCategoryName(): Promise<string> {
    return this.openedCategoryTitle().innerText();
  }

  async readOpenedProductNames(): Promise<readonly string[]> {
    return this.openedProducts().allInnerTexts();
  }

  async isEmptyVisible(): Promise<boolean> {
    return this.emptyMessage().isVisible();
  }

  async isCategoriesAbsent(): Promise<boolean> {
    return (await this.categoryList().count()) === 0;
  }

  async isProductsAbsent(): Promise<boolean> {
    return (await this.products().count()) === 0;
  }

  async isIntakeClosed(): Promise<boolean> {
    return this.intakeClosedMessage().isVisible();
  }

  private categoryList(): Locator {
    return this.page.getByRole("list", { name: "Категории меню" });
  }

  private categoryButtons(): Locator {
    return this.categoryList().getByRole("button");
  }

  private emptyMessage(): Locator {
    return this.page.getByText("Меню пока пустое", { exact: true });
  }

  private intakeClosedMessage(): Locator {
    return this.page.getByText("Новые заказы временно не принимаются", {
      exact: true,
    });
  }

  private openedCategoryTitle(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  private openedProducts(): Locator {
    return this.products().getByRole("button");
  }

  private products(): Locator {
    return this.page.getByRole("list", { name: /^Товары категории /u });
  }

  private categoryName(text: string): string {
    const separator = text.lastIndexOf("\n");

    if (separator < 1) {
      throw new Error("Название категории не распознано.");
    }

    return text.slice(0, separator);
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
