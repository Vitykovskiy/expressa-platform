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

  async readPrice(size: ProductSize): Promise<string> {
    return this.priceInput(size).inputValue();
  }

  async readSelectedCategoryName(): Promise<string> {
    return this.dialog()
      .getByLabel("Категория", { exact: true })
      .getByRole("option", { selected: true })
      .innerText();
  }

  async readName(): Promise<string> {
    return this.dialog()
      .getByLabel("Название товара", { exact: true })
      .inputValue();
  }

  async readType(): Promise<string> {
    return this.dialog().getByLabel("Тип товара", { exact: true }).inputValue();
  }

  async isActive(): Promise<boolean> {
    return this.readSwitchState(
      this.dialog().getByRole("switch", {
        name: "Товар активен",
        exact: true,
      }),
    );
  }

  async isAvailable(): Promise<boolean> {
    return this.readSwitchState(
      this.dialog().getByRole("switch", {
        name: "Товар доступен",
        exact: true,
      }),
    );
  }

  async isSizeConfigured(size: ProductSize): Promise<boolean> {
    return this.readSwitchState(
      this.dialog().getByRole("switch", {
        name: `Использовать размер ${size}`,
        exact: true,
      }),
    );
  }

  async isSizeAvailable(size: ProductSize): Promise<boolean> {
    return this.readSwitchState(
      this.dialog().getByRole("switch", {
        name: `Размер ${size} доступен`,
        exact: true,
      }),
    );
  }

  async setSinglePrice(price: string): Promise<void> {
    await test.step("Установить единую цену товара", async () => {
      const priceInput = this.singlePriceInput();

      await priceInput.fill(price);
      await expect(priceInput, "Единая цена товара установлена.").toHaveValue(
        price,
      );
    });
  }

  async readSinglePrice(): Promise<string> {
    return this.singlePriceInput().inputValue();
  }

  async readSizesPriceValidation(): Promise<string | null> {
    const alert = this.variantsRequiredAlert();

    return (await alert.isVisible()) ? alert.innerText() : null;
  }

  async isCreateSaveAvailable(): Promise<boolean> {
    return this.createSaveButton().isEnabled();
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
      const selectedCategory = this.dialog()
        .getByLabel("Категория", { exact: true })
        .getByRole("option", { selected: true });
      const categoryName = await selectedCategory.innerText();

      await this.createSaveButton().click();
      await expect(this.dialog(), `Товар «${name}» создан.`).toHaveCount(0);
      const categoryToggle = this.categoryToggle(categoryName);

      const expanded = await categoryToggle.getAttribute("aria-expanded");

      if (expanded !== "true" && expanded !== "false") {
        throw new Error(
          `У категории «${categoryName}» некорректное значение aria-expanded: ${expanded ?? "отсутствует"}.`,
        );
      }

      if (expanded === "false") {
        await categoryToggle.click();
        await expect(
          categoryToggle,
          `Категория «${categoryName}» открыта.`,
        ).toHaveAttribute("aria-expanded", "true");
      }
      await expect(
        this.productEditButton(name),
        `Созданный товар «${name}» показан в каталоге.`,
      ).toBeVisible();
    });
  }

  async openForEditing(name: string): Promise<void> {
    await test.step(`Открыть редактирование товара «${name}»`, async () => {
      await expect(
        this.productEditButton(name),
        `Редактирование товара «${name}» доступно.`,
      ).toBeEnabled();
      await this.productEditButton(name).click();
      await expect(
        this.dialog(),
        `Редактор товара «${name}» открыт.`,
      ).toBeVisible();
    });
  }

  async saveChanges(name: string): Promise<void> {
    await test.step(`Сохранить изменения товара «${name}»`, async () => {
      await this.editSaveButton().click();
      await expect(
        this.dialog(),
        `Редактор товара «${name}» закрыт.`,
      ).toHaveCount(0);
      await expect(
        this.productEditButton(name),
        `Изменённый товар «${name}» показан в каталоге.`,
      ).toBeVisible();
    });
  }

  async cancelEditing(name: string): Promise<void> {
    await test.step(`Отменить редактирование товара «${name}»`, async () => {
      await this.dialog()
        .getByRole("button", { name: "Отмена", exact: true })
        .click();
      await expect(
        this.dialog(),
        `Редактор товара «${name}» закрыт без изменений.`,
      ).toHaveCount(0);
    });
  }

  async requestArchive(name: string): Promise<void> {
    await test.step(`Запросить архивацию товара «${name}»`, async () => {
      await this.deleteButton().click();
      await expect(
        this.confirmationDialog(),
        "Подтверждение архивации товара открыто.",
      ).toBeVisible();
    });
  }

  async cancelArchive(name: string): Promise<void> {
    await test.step(`Отменить архивацию товара «${name}»`, async () => {
      await this.cancelArchiveButton().click();
      await expect(
        this.confirmationDialog(),
        "Подтверждение архивации товара закрыто.",
      ).toHaveCount(0);
      await expect(
        this.productEditButton(name),
        `Товар «${name}» остался в категории.`,
      ).toBeVisible();
    });
  }

  async confirmArchive(name: string): Promise<void> {
    await test.step(`Подтвердить архивацию товара «${name}»`, async () => {
      await this.confirmArchiveButton().click();
      await expect(
        this.productEditButton(name),
        `Товар «${name}» архивирован.`,
      ).toHaveCount(0);
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

  async delete(name: string): Promise<void> {
    await test.step(`Удалить товар «${name}»`, async () => {
      await this.openForEditing(name);
      await this.requestArchive(name);
      await this.confirmArchive(name);
    });
  }

  async deleteIfPresent(name: string): Promise<void> {
    if ((await this.productEditButton(name).count()) === 0) return;
    await this.delete(name);
  }

  private dialog(): Locator {
    return this.page.getByRole("dialog");
  }

  private async readSwitchState(switchControl: Locator): Promise<boolean> {
    const checked = await switchControl.getAttribute("aria-checked");

    if (checked !== "true" && checked !== "false") {
      throw new Error(
        `У переключателя некорректное значение aria-checked: ${checked ?? "отсутствует"}.`,
      );
    }

    return checked === "true";
  }

  private confirmationDialog(): Locator {
    return this.page.getByRole("dialog", {
      name: "Удалить товар?",
      exact: true,
    });
  }

  private productEditButton(name: string): Locator {
    return this.page.getByRole("button", {
      name: `Редактировать товар ${name}`,
      exact: true,
    });
  }

  private categoryToggle(name: string): Locator {
    return this.page.getByRole("button", {
      name: `Открыть категорию ${name}`,
      exact: true,
    });
  }

  private priceInput(size: ProductSize): Locator {
    return this.dialog().getByLabel(`Цена ${size}, коп.`, { exact: true });
  }

  private singlePriceInput(): Locator {
    return this.dialog().getByLabel("Цена, коп.", { exact: true });
  }

  private variantsRequiredAlert(): Locator {
    return this.dialog().getByRole("alert");
  }

  private createSaveButton(): Locator {
    return this.dialog().getByRole("button", {
      name: "Добавить товар",
      exact: true,
    });
  }

  private editSaveButton(): Locator {
    return this.dialog().getByRole("button", {
      name: "Сохранить изменения",
      exact: true,
    });
  }

  private deleteButton(): Locator {
    return this.dialog().getByRole("button", {
      name: "Удалить товар",
      exact: true,
    });
  }

  private cancelArchiveButton(): Locator {
    return this.confirmationDialog().getByRole("button", {
      name: "Отмена",
      exact: true,
    });
  }

  private confirmArchiveButton(): Locator {
    return this.confirmationDialog().getByRole("button", {
      name: "Удалить",
      exact: true,
    });
  }
}
