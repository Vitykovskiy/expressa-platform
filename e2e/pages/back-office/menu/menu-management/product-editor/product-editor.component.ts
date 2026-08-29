import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  ProductSize,
  ProductSizeUsage,
  ProductType,
} from "./product-editor.types";

export class ProductEditorComponent {
  private readonly addProductButton: Locator;
  private readonly dialog: Locator;
  private readonly confirmationDialog: Locator;
  private readonly categorySelect: Locator;
  private readonly selectedCategoryOption: Locator;
  private readonly productTypeSelect: Locator;
  private readonly productNameInput: Locator;
  private readonly descriptionInput: Locator;
  private readonly activeSwitch: Locator;
  private readonly availableSwitch: Locator;
  private readonly singlePriceInput: Locator;
  private readonly variantsRequiredAlert: Locator;
  private readonly createSaveButton: Locator;
  private readonly editSaveButton: Locator;
  private readonly cancelButton: Locator;
  private readonly deleteButton: Locator;
  private readonly cancelArchiveButton: Locator;
  private readonly confirmArchiveButton: Locator;

  constructor(private readonly page: Page) {
    this.addProductButton = page.getByRole("button", {
      name: "Добавить товар",
      exact: true,
    });
    this.dialog = page.getByRole("dialog");
    this.confirmationDialog = page.getByRole("dialog", {
      name: "Удалить товар?",
      exact: true,
    });
    this.categorySelect = this.dialog.getByLabel("Категория", {
      exact: true,
    });
    this.selectedCategoryOption = this.categorySelect.getByRole("option", {
      selected: true,
    });
    this.productTypeSelect = this.dialog.getByLabel("Тип товара", {
      exact: true,
    });
    this.productNameInput = this.dialog.getByLabel("Название товара", {
      exact: true,
    });
    this.descriptionInput = this.dialog.getByLabel("Описание", {
      exact: true,
    });
    this.activeSwitch = this.dialog.getByRole("switch", {
      name: "Товар активен",
      exact: true,
    });
    this.availableSwitch = this.dialog.getByRole("switch", {
      name: "Товар доступен",
      exact: true,
    });
    this.singlePriceInput = this.dialog.getByLabel("Цена, коп.", {
      exact: true,
    });
    this.variantsRequiredAlert = this.dialog.getByRole("alert");
    this.createSaveButton = this.dialog.getByRole("button", {
      name: "Добавить товар",
      exact: true,
    });
    this.editSaveButton = this.dialog.getByRole("button", {
      name: "Сохранить изменения",
      exact: true,
    });
    this.cancelButton = this.dialog.getByRole("button", {
      name: "Отмена",
      exact: true,
    });
    this.deleteButton = this.dialog.getByRole("button", {
      name: "Удалить товар",
      exact: true,
    });
    this.cancelArchiveButton = this.confirmationDialog.getByRole("button", {
      name: "Отмена",
      exact: true,
    });
    this.confirmArchiveButton = this.confirmationDialog.getByRole("button", {
      name: "Удалить",
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
      await expect(this.dialog, "Диалог нового товара открыт.").toBeVisible();
    });
  }

  async cancelCreation(): Promise<void> {
    await test.step("Отменить создание товара", async () => {
      await this.cancelButton.click();
      await expect(
        this.dialog,
        "Редактор нового товара закрыт без сохранения.",
      ).toHaveCount(0);
    });
  }

  async selectCategory(name: string): Promise<void> {
    await test.step(`Выбрать категорию «${name}»`, async () => {
      const category = this.categorySelect;
      const categoryOption = this.categoryOption(name);

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
      const productType = this.productTypeSelect;

      await expect(productType, `Тип товара «${type}» доступен.`).toBeVisible();
      await productType.selectOption(type);
      await expect(productType, `Выбран тип товара «${type}».`).toHaveValue(
        type,
      );
    });
  }

  async fillName(name: string): Promise<void> {
    await test.step(`Указать название товара «${name}»`, async () => {
      const productName = this.productNameInput;

      await productName.fill(name);
      await expect(productName, "Название товара указано.").toHaveValue(name);
    });
  }

  async fillDescription(description: string): Promise<void> {
    await test.step("Указать описание товара", async () => {
      const productDescription = this.descriptionInput;

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
    return this.selectedCategoryOption.innerText();
  }

  async readName(): Promise<string> {
    return this.productNameInput.inputValue();
  }

  async readType(): Promise<ProductType> {
    const type = await this.productTypeSelect.inputValue();

    if (!Object.values(ProductType).includes(type as ProductType)) {
      throw new Error(`Неизвестный тип товара «${type}».`);
    }

    return type as ProductType;
  }

  async isActive(): Promise<boolean> {
    return this.readSwitchState(this.activeSwitch);
  }

  async isAvailable(): Promise<boolean> {
    return this.readSwitchState(this.availableSwitch);
  }

  async isSizeConfigured(size: ProductSize): Promise<boolean> {
    return this.readSwitchState(this.sizeEnabledSwitch(size));
  }

  async isSizeAvailable(size: ProductSize): Promise<boolean> {
    return this.readSwitchState(this.sizeAvailableSwitch(size));
  }

  async setSinglePrice(price: string): Promise<void> {
    await test.step("Установить единую цену товара", async () => {
      const priceInput = this.singlePriceInput;

      await priceInput.fill(price);
      await expect(priceInput, "Единая цена товара установлена.").toHaveValue(
        price,
      );
    });
  }

  async readSinglePrice(): Promise<string> {
    return this.singlePriceInput.inputValue();
  }

  async readSizesPriceValidation(): Promise<string | null> {
    const alert = this.variantsRequiredAlert;

    return (await alert.isVisible()) ? alert.innerText() : null;
  }

  async isCreateSaveAvailable(): Promise<boolean> {
    return this.createSaveButton.isEnabled();
  }

  async setSizeUsage(
    size: ProductSize,
    usage: ProductSizeUsage,
  ): Promise<void> {
    await test.step(`Установить использование размера ${size}`, async () => {
      const sizeSwitch = this.sizeEnabledSwitch(size);
      const checked = usage === ProductSizeUsage.ENABLED;

      if ((await this.readSwitchState(sizeSwitch)) !== checked) {
        await sizeSwitch.click();
      }
      await expect(
        sizeSwitch,
        `Использование размера ${size} установлено.`,
      ).toHaveAttribute("aria-checked", String(checked));
    });
  }

  async useOnlySize(size: ProductSize): Promise<void> {
    await test.step(`Оставить только размер ${size}`, async () => {
      for (const candidate of Object.values(ProductSize)) {
        await this.setSizeUsage(
          candidate,
          candidate === size
            ? ProductSizeUsage.ENABLED
            : ProductSizeUsage.DISABLED,
        );
      }
    });
  }

  async save(name: string): Promise<void> {
    await test.step(`Сохранить товар «${name}»`, async () => {
      const selectedCategory = this.selectedCategoryOption;
      const categoryName = await selectedCategory.innerText();

      await this.createSaveButton.click();
      await expect(this.dialog, `Товар «${name}» создан.`).toHaveCount(0);
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
        this.dialog,
        `Редактор товара «${name}» открыт.`,
      ).toBeVisible();
    });
  }

  async saveChanges(name: string): Promise<void> {
    await test.step(`Сохранить изменения товара «${name}»`, async () => {
      await this.editSaveButton.click();
      await expect(
        this.dialog,
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
      await this.cancelButton.click();
      await expect(
        this.dialog,
        `Редактор товара «${name}» закрыт без изменений.`,
      ).toHaveCount(0);
    });
  }

  async requestArchive(name: string): Promise<void> {
    await test.step(`Запросить архивацию товара «${name}»`, async () => {
      await this.deleteButton.click();
      await expect(
        this.confirmationDialog,
        "Подтверждение архивации товара открыто.",
      ).toBeVisible();
    });
  }

  async cancelArchive(name: string): Promise<void> {
    await test.step(`Отменить архивацию товара «${name}»`, async () => {
      await this.cancelArchiveButton.click();
      await expect(
        this.confirmationDialog,
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
      await this.confirmArchiveButton.click();
      await expect(
        this.productEditButton(name),
        `Товар «${name}» архивирован.`,
      ).toHaveCount(0);
    });
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

  private categoryOption(name: string): Locator {
    return this.categorySelect.getByRole("option", { name, exact: true });
  }

  private sizeEnabledSwitch(size: ProductSize): Locator {
    return this.dialog.getByRole("switch", {
      name: `Использовать размер ${size}`,
      exact: true,
    });
  }

  private sizeAvailableSwitch(size: ProductSize): Locator {
    return this.dialog.getByRole("switch", {
      name: `Размер ${size} доступен`,
      exact: true,
    });
  }

  private priceInput(size: ProductSize): Locator {
    return this.dialog.getByLabel(`Цена ${size}, коп.`, { exact: true });
  }
}
