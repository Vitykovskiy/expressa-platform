import { expect, test, type Locator, type Page } from "@playwright/test";

import type { ProductOrderScenarioData } from "@support/data/product-order-scenario-data";

export class CatalogListComponent {
  private readonly emptyState: Locator;
  private readonly categoryToggles: Locator;
  private readonly addCategoryButton: Locator;
  private readonly addProductButton: Locator;
  private readonly productEditButtons: Locator;

  constructor(private readonly page: Page) {
    this.emptyState = page.getByText(
      "Категорий пока нет. Добавьте первую категорию.",
      { exact: true },
    );
    this.categoryToggles = page.getByRole("button", {
      name: /^Открыть категорию /u,
    });
    this.addCategoryButton = page.getByRole("button", {
      name: "Добавить группу",
      exact: true,
    });
    this.addProductButton = page.getByRole("button", {
      name: "Добавить товар",
      exact: true,
    });
    this.productEditButtons = page.getByRole("button", {
      name: /^Редактировать товар /u,
    });
  }

  async isEmpty(): Promise<boolean> {
    return this.emptyState.isVisible();
  }

  async isAddCategoryAvailable(): Promise<boolean> {
    return this.addCategoryButton.isEnabled();
  }

  async isAddProductAvailable(): Promise<boolean> {
    return this.addProductButton.isEnabled();
  }

  async hasCategory(name: string): Promise<boolean> {
    return this.categoryToggle(name).isVisible();
  }

  async readCategoryOrder(): Promise<readonly string[]> {
    const categoryToggles = await this.categoryToggles.all();

    return Promise.all(
      categoryToggles.map(async (toggle) => {
        const label = await toggle.getAttribute("aria-label");

        if (label === null) {
          throw new Error(
            "Не удалось прочитать название категории в каталоге.",
          );
        }

        return label.replace("Открыть категорию ", "");
      }),
    );
  }

  async isCategoryMoveUpAvailable(name: string): Promise<boolean> {
    return this.categoryMoveUpButton(name).isEnabled();
  }

  async moveCategoryUp(name: string): Promise<void> {
    await test.step(`Переместить категорию «${name}» вверх`, async () => {
      const moveUp = this.categoryMoveUpButton(name);

      await expect(
        moveUp,
        `Категорию «${name}» можно переместить вверх.`,
      ).toBeEnabled();
      const categoryOrder = await this.readCategoryOrder();
      const categoryIndex = categoryOrder.indexOf(name);

      if (categoryIndex < 1) {
        throw new Error(
          `Категорию «${name}» нельзя переместить вверх в текущем порядке.`,
        );
      }

      const expectedCategoryOrder = [...categoryOrder];
      const previousCategory = expectedCategoryOrder[categoryIndex - 1];

      if (previousCategory === undefined) {
        throw new Error("Не удалось прочитать предыдущую категорию.");
      }

      expectedCategoryOrder[categoryIndex - 1] = name;
      expectedCategoryOrder[categoryIndex] = previousCategory;
      await moveUp.click();
      await expect(
        this.categoryToggles,
        `Категория «${name}» перемещена вверх в каталоге.`,
      ).toContainText(expectedCategoryOrder);
      await expect(
        moveUp,
        `Категория «${name}» стала первой в каталоге.`,
      ).toBeDisabled();
    });
  }

  async expandCategory(name: string): Promise<void> {
    await test.step(`Открыть категорию «${name}»`, async () => {
      const categoryToggle = this.categoryToggle(name);

      await expect(
        categoryToggle,
        `Категория «${name}» доступна.`,
      ).toBeEnabled();
      if ((await categoryToggle.getAttribute("aria-expanded")) === "false") {
        await categoryToggle.click();
      }
      await expect(
        categoryToggle,
        `Категория «${name}» открыта.`,
      ).toHaveAttribute("aria-expanded", "true");
    });
  }

  async assertProductVisible(name: string): Promise<void> {
    await test.step(`Проверить видимость товара «${name}»`, async () => {
      await expect(
        this.productEditButton(name),
        `Товар «${name}» показан в категории.`,
      ).toBeVisible();
    });
  }

  async isProductVisible(name: string): Promise<boolean> {
    return this.productEditButton(name).isVisible();
  }

  async isProductAbsent(name: string): Promise<boolean> {
    return (await this.productEditButton(name).count()) === 0;
  }

  async readProductPrice(name: string): Promise<string> {
    return this.productEditButton(name).innerText();
  }

  async readProductOrder(): Promise<readonly string[]> {
    const productEditButtons = await this.productEditButtons.all();

    return Promise.all(
      productEditButtons.map(async (button) => {
        const label = await button.getAttribute("aria-label");

        if (label === null) {
          throw new Error("Не удалось прочитать название товара в каталоге.");
        }

        return label.replace("Редактировать товар ", "");
      }),
    );
  }

  async moveProductUp(name: string): Promise<void> {
    await test.step(`Переместить товар «${name}» вверх`, async () => {
      const moveUp = this.productMoveUpButton(name);

      await expect(
        moveUp,
        `Товар «${name}» можно переместить вверх.`,
      ).toBeEnabled();
      const productOrder = await this.readProductOrder();
      const productIndex = productOrder.indexOf(name);

      if (productIndex < 1) {
        throw new Error(
          `Товар «${name}» нельзя переместить вверх в текущем порядке.`,
        );
      }

      const expectedProductOrder = [...productOrder];
      const previousProduct = expectedProductOrder[productIndex - 1];

      if (previousProduct === undefined) {
        throw new Error("Не удалось прочитать предыдущий товар.");
      }

      expectedProductOrder[productIndex - 1] = name;
      expectedProductOrder[productIndex] = previousProduct;
      await moveUp.click();
      await expect(
        this.productEditButtons,
        `Товар «${name}» перемещён вверх в категории.`,
      ).toContainText(expectedProductOrder);
      await expect(
        moveUp,
        `Товар «${name}» стал первым в категории.`,
      ).toBeDisabled();
    });
  }

  async isProductMoveUpAvailable(name: string): Promise<boolean> {
    return this.productMoveUpButton(name).isEnabled();
  }

  async assertScenarioAbsent(data: ProductOrderScenarioData): Promise<void> {
    await test.step("Проверить очистку данных сценария", async () => {
      await expect(this.categoryEditButton(data.categoryName)).toHaveCount(0);
      await expect(this.productEditButton(data.productName)).toHaveCount(0);
      await expect(
        this.modifierGroupEditButton(data.modifierGroupName),
      ).toHaveCount(0);
    });
  }

  private categoryToggle(name: string): Locator {
    return this.page.getByRole("button", {
      name: `Открыть категорию ${name}`,
      exact: true,
    });
  }

  private categoryEditButton(name: string): Locator {
    return this.page.getByRole("button", {
      name: `Редактировать категорию ${name}`,
      exact: true,
    });
  }

  private categoryMoveUpButton(name: string): Locator {
    return this.page.getByRole("button", {
      name: `Переместить категорию ${name} вверх`,
      exact: true,
    });
  }

  private productEditButton(name: string): Locator {
    return this.page.getByRole("button", {
      name: `Редактировать товар ${name}`,
      exact: true,
    });
  }

  private productMoveUpButton(name: string): Locator {
    return this.page.getByRole("button", {
      name: `Переместить товар ${name} вверх`,
      exact: true,
    });
  }

  private modifierGroupEditButton(name: string): Locator {
    return this.page.getByRole("button", {
      name: `Редактировать группу опций ${name}`,
      exact: true,
    });
  }
}
