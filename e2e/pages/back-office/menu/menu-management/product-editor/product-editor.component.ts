import { expect, test, type Locator, type Page } from "@playwright/test";

import type { ProductOrderScenarioData } from "@support/data/product-order-scenario-data";

export class ProductEditorComponent {
  private readonly addProductButton: Locator;

  constructor(private readonly page: Page) {
    this.addProductButton = page.getByRole("button", {
      name: "Добавить товар",
      exact: true,
    });
  }

  async create(input: ProductOrderScenarioData): Promise<void> {
    await test.step(`Создать товар «${input.productName}»`, async () => {
      const dialog = this.dialog();

      await expect(
        this.addProductButton,
        "Кнопка добавления товара доступна.",
      ).toBeEnabled();
      await this.addProductButton.click();
      await expect(dialog, "Диалог нового товара открыт.").toBeVisible();
      await dialog
        .getByLabel("Категория", { exact: true })
        .selectOption({ label: input.categoryName });
      await dialog
        .getByLabel("Тип товара", { exact: true })
        .selectOption("DRINK");
      await dialog
        .getByLabel("Название товара", { exact: true })
        .fill(input.productName);
      await dialog
        .getByLabel("Описание", { exact: true })
        .fill(input.productDescription);
      await dialog
        .getByLabel("Цена S, коп.", { exact: true })
        .fill(input.productPrice);
      await dialog
        .getByLabel("Цена M, коп.", { exact: true })
        .fill(input.productPrice);
      await dialog
        .getByLabel("Цена L, коп.", { exact: true })
        .fill(input.productPrice);
      await dialog
        .getByRole("button", { name: "Добавить товар", exact: true })
        .click();
      await expect(dialog, `Товар «${input.productName}» создан.`).toHaveCount(
        0,
      );
    });
  }

  async reopen(input: ProductOrderScenarioData): Promise<void> {
    await test.step(`Повторно открыть товар «${input.productName}»`, async () => {
      await this.productEditButton(input.productName).click();
      await expect(
        this.dialog(),
        `Редактор товара «${input.productName}» открыт.`,
      ).toBeVisible();
      await expect(
        this.dialog().getByLabel("Цена M, коп.", { exact: true }),
        "Сохранённая цена среднего размера показана.",
      ).toHaveValue(input.productPrice);
      await this.dialog()
        .getByRole("button", { name: "Отмена", exact: true })
        .click();
      await expect(
        this.dialog(),
        `Редактор товара «${input.productName}» закрыт.`,
      ).toHaveCount(0);
    });
  }

  async archive(name: string): Promise<void> {
    await test.step(`Архивировать товар «${name}»`, async () => {
      await this.productEditButton(name).click();
      await expect(
        this.dialog(),
        `Редактор товара «${name}» открыт.`,
      ).toBeVisible();
      await this.dialog()
        .getByRole("button", { name: "Архивировать товар", exact: true })
        .click();
      await expect(
        this.confirmationDialog(),
        "Подтверждение архивации товара открыто.",
      ).toBeVisible();
      await this.confirmationDialog()
        .getByRole("button", { name: "Архивировать", exact: true })
        .click();
      await expect(
        this.productEditButton(name),
        `Товар «${name}» архивирован.`,
      ).toHaveCount(0);
    });
  }

  private dialog(): Locator {
    return this.page.getByRole("dialog");
  }

  private confirmationDialog(): Locator {
    return this.page.getByRole("dialog", {
      name: "Архивировать товар?",
      exact: true,
    });
  }

  private productEditButton(name: string): Locator {
    return this.page.getByRole("button", {
      name: `Редактировать товар ${name}`,
      exact: true,
    });
  }
}
