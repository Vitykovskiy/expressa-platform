import { expect, test, type Locator, type Page } from "@playwright/test";

import type { ProductOrderScenarioData } from "@support/data/product-order-scenario-data";

export class CategoryEditorComponent {
  private readonly addCategoryButton: Locator;

  constructor(private readonly page: Page) {
    this.addCategoryButton = page.getByRole("button", {
      name: "Добавить группу",
      exact: true,
    });
  }

  async create(input: ProductOrderScenarioData): Promise<void> {
    await test.step(`Создать категорию «${input.categoryName}»`, async () => {
      const dialog = this.dialog();

      await expect(
        this.addCategoryButton,
        "Кнопка добавления категории доступна.",
      ).toBeEnabled();
      await this.addCategoryButton.click();
      await expect(dialog, "Диалог новой категории открыт.").toBeVisible();
      await dialog
        .getByLabel("Название категории", { exact: true })
        .fill(input.categoryName);
      await dialog
        .getByLabel("Описание", { exact: true })
        .fill(input.productDescription);
      await dialog
        .getByRole("button", { name: "Добавить категорию", exact: true })
        .click();
      await expect(
        dialog,
        `Категория «${input.categoryName}» создана.`,
      ).toHaveCount(0);
    });
  }

  async archive(name: string): Promise<void> {
    await test.step(`Архивировать категорию «${name}»`, async () => {
      await this.categoryEditButton(name).click();
      await expect(
        this.dialog(),
        `Открыт редактор категории «${name}».`,
      ).toBeVisible();
      await this.dialog()
        .getByRole("button", { name: "Архивировать категорию", exact: true })
        .click();
      await expect(
        this.confirmationDialog(),
        "Подтверждение архивации категории открыто.",
      ).toBeVisible();
      await this.confirmationDialog()
        .getByRole("button", { name: "Архивировать", exact: true })
        .click();
      await expect(
        this.categoryEditButton(name),
        `Категория «${name}» архивирована.`,
      ).toHaveCount(0);
    });
  }

  private dialog(): Locator {
    return this.page.getByRole("dialog");
  }

  private confirmationDialog(): Locator {
    return this.page.getByRole("dialog", {
      name: "Архивировать категорию?",
      exact: true,
    });
  }

  private categoryEditButton(name: string): Locator {
    return this.page.getByRole("button", {
      name: `Редактировать категорию ${name}`,
      exact: true,
    });
  }
}
