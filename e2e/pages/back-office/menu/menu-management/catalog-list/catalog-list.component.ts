import { expect, test, type Locator, type Page } from "@playwright/test";

import type { ProductOrderScenarioData } from "@support/data/product-order-scenario-data";

export class CatalogListComponent {
  constructor(private readonly page: Page) {}

  async expandCategory(name: string): Promise<void> {
    await test.step(`Открыть категорию «${name}»`, async () => {
      const categoryToggle = this.categoryToggle(name);

      await expect(
        categoryToggle,
        `Категория «${name}» доступна.`,
      ).toBeEnabled();
      await categoryToggle.click();
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

  private productEditButton(name: string): Locator {
    return this.page.getByRole("button", {
      name: `Редактировать товар ${name}`,
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
