import { expect, test, type Locator, type Page } from "@playwright/test";

import type { ProductOrderScenarioData } from "@support/data/product-order-scenario-data";
import { ProductSize, ProductType } from "./product-editor.types";

export class ProductEditorComponent {
  private readonly addProductButton: Locator;

  constructor(private readonly page: Page) {
    this.addProductButton = page.getByRole("button", {
      name: "Добавить товар",
      exact: true,
    });
  }

  async startCreation(): Promise<void> {
    await test.step("Начать создание товара", async () => {
      await expect(
        this.addProductButton,
        "Кнопка добавления товара доступна.",
      ).toBeEnabled();
      await this.addProductButton.click();
      await expect(this.dialog(), "Диалог нового товара открыт.").toBeVisible();
    });
  }

  async selectCategory(name: string): Promise<void> {
    await test.step(`Выбрать категорию «${name}»`, async () => {
      const category = this.dialog().getByLabel("Категория", { exact: true });
      const categoryOption = category.getByRole("option", {
        name,
        exact: true,
      });

      await expect(category, `Категория «${name}» доступна.`).toBeVisible();
      await expect(
        categoryOption,
        `Категория «${name}» доступна для выбора.`,
      ).toHaveCount(1);
      const categoryValue = await categoryOption.getAttribute("value");

      if (categoryValue === null) {
        throw new Error(`У категории «${name}» нет значения.`);
      }

      await category.selectOption({ label: name });
      await expect(category, `Выбрана категория «${name}».`).toHaveValue(
        categoryValue,
      );
    });
  }

  async selectType(type: ProductType): Promise<void> {
    await test.step(`Выбрать тип товара «${type}»`, async () => {
      const productType = this.dialog().getByLabel("Тип товара", {
        exact: true,
      });

      await expect(productType, `Тип товара «${type}» доступен.`).toBeVisible();
      await productType.selectOption(type);
      await expect(productType, `Выбран тип товара «${type}».`).toHaveValue(
        type,
      );
    });
  }

  async fillName(name: string): Promise<void> {
    await test.step(`Указать название товара «${name}»`, async () => {
      const productName = this.dialog().getByLabel("Название товара", {
        exact: true,
      });

      await productName.fill(name);
      await expect(productName, "Название товара указано.").toHaveValue(name);
    });
  }

  async fillDescription(description: string): Promise<void> {
    await test.step("Указать описание товара", async () => {
      const productDescription = this.dialog().getByLabel("Описание", {
        exact: true,
      });

      await productDescription.fill(description);
      await expect(productDescription, "Описание товара указано.").toHaveValue(
        description,
      );
    });
  }

  async setPrice(size: ProductSize, price: string): Promise<void> {
    await test.step(`Установить цену товара размера ${size}`, async () => {
      const priceInput = this.priceInput(size);

      await priceInput.fill(price);
      await expect(
        priceInput,
        `Цена товара размера ${size} установлена.`,
      ).toHaveValue(price);
    });
  }

  async useOnlySize(size: ProductSize): Promise<void> {
    await test.step(`Оставить только размер ${size}`, async () => {
      for (const candidate of Object.values(ProductSize)) {
        const toggle = this.dialog().getByRole("switch", {
          name: `Использовать размер ${candidate}`,
          exact: true,
        });

        if (candidate === size) {
          await toggle.check();
          await expect(
            toggle,
            `Размер ${candidate} используется.`,
          ).toBeChecked();
        } else {
          await toggle.uncheck();
          await expect(
            toggle,
            `Размер ${candidate} отключён.`,
          ).not.toBeChecked();
        }
      }
    });
  }

  async save(name: string): Promise<void> {
    await test.step(`Сохранить товар «${name}»`, async () => {
      await this.dialog()
        .getByRole("button", { name: "Добавить товар", exact: true })
        .click();
      await expect(this.dialog(), `Товар «${name}» создан.`).toHaveCount(0);
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

  async archiveIfPresent(name: string): Promise<void> {
    if ((await this.productEditButton(name).count()) === 0) return;
    await this.archive(name);
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

  private priceInput(size: ProductSize): Locator {
    return this.dialog().getByLabel(`Цена ${size}, коп.`, { exact: true });
  }
}
