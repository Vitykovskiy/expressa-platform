import { expect, test, type Locator, type Page } from "@playwright/test";

export class CategoryEditorComponent {
  private readonly addCategoryButton: Locator;
  private readonly dialog: Locator;
  private readonly createDialog: Locator;
  private readonly editDialog: Locator;
  private readonly confirmationDialog: Locator;
  private readonly nameInput: Locator;
  private readonly activeSwitch: Locator;
  private readonly descriptionInput: Locator;
  private readonly nameRequiredAlert: Locator;
  private readonly createSaveButton: Locator;
  private readonly editSaveButton: Locator;
  private readonly archiveButton: Locator;
  private readonly cancelArchiveButton: Locator;
  private readonly confirmArchiveButton: Locator;

  constructor(private readonly page: Page) {
    this.addCategoryButton = page.getByRole("button", {
      name: "Добавить группу",
      exact: true,
    });
    this.dialog = page.getByRole("dialog");
    this.createDialog = this.dialog.filter({
      has: page.getByRole("heading", {
        name: "Новая категория",
        exact: true,
      }),
    });
    this.editDialog = page.getByRole("dialog", {
      name: /^Редактировать категорию\s+Закрыть диалог$/u,
    });
    this.confirmationDialog = page.getByRole("dialog", {
      name: "Архивировать категорию?",
      exact: true,
    });
    this.nameInput = this.dialog.getByLabel("Название категории", {
      exact: true,
    });
    this.activeSwitch = this.dialog.getByRole("switch", {
      name: "Категория активна",
      exact: true,
    });
    this.descriptionInput = this.dialog.getByLabel("Описание", {
      exact: true,
    });
    this.nameRequiredAlert = this.dialog.getByRole("alert");
    this.createSaveButton = this.dialog.getByRole("button", {
      name: "Добавить категорию",
      exact: true,
    });
    this.editSaveButton = this.dialog.getByRole("button", {
      name: "Сохранить изменения",
      exact: true,
    });
    this.archiveButton = this.dialog.getByRole("button", {
      name: "Архивировать категорию",
      exact: true,
    });
    this.cancelArchiveButton = this.confirmationDialog.getByRole("button", {
      name: "Отмена",
      exact: true,
    });
    this.confirmArchiveButton = this.confirmationDialog.getByRole("button", {
      name: "Архивировать",
      exact: true,
    });
  }

  async readName(): Promise<string> {
    return this.nameInput.inputValue();
  }

  async readDescription(): Promise<string> {
    return this.descriptionInput.inputValue();
  }

  async isActive(): Promise<boolean> {
    return (await this.activeSwitch.getAttribute("aria-checked")) === "true";
  }

  async readNameValidation(): Promise<string | null> {
    const alert = this.nameRequiredAlert;

    return (await alert.isVisible()) ? alert.innerText() : null;
  }

  async isCreateSaveAvailable(): Promise<boolean> {
    return this.createSaveButton.isEnabled();
  }

  async startCreation(): Promise<void> {
    await test.step("Начать создание категории", async () => {
      await expect(
        this.addCategoryButton,
        "Кнопка добавления категории доступна.",
      ).toBeEnabled();
      await this.addCategoryButton.click();
      await expect(this.dialog, "Диалог новой категории открыт.").toBeVisible();
    });
  }

  async fillName(name: string): Promise<void> {
    await test.step(`Указать название категории «${name}»`, async () => {
      const nameInput = this.nameInput;

      await nameInput.fill(name);
      await expect(nameInput, "Название категории указано.").toHaveValue(name);
    });
  }

  async clearName(): Promise<void> {
    await test.step("Очистить название категории", async () => {
      const nameInput = this.nameInput;

      await nameInput.clear();
      await expect(nameInput, "Название категории очищено.").toHaveValue("");
      await expect(
        this.nameRequiredAlert,
        "Показано требование указать название категории.",
      ).toHaveText("Введите название категории");
      await expect(
        this.createSaveButton,
        "Сохранение категории без названия недоступно.",
      ).toBeDisabled();
    });
  }

  async fillDescription(description: string): Promise<void> {
    await test.step("Указать описание категории", async () => {
      const descriptionInput = this.descriptionInput;

      await descriptionInput.fill(description);
      await expect(descriptionInput, "Описание категории указано.").toHaveValue(
        description,
      );
    });
  }

  async save(name: string): Promise<void> {
    await test.step(`Сохранить категорию «${name}»`, async () => {
      await this.createSaveButton.click();
      await expect(this.dialog, `Категория «${name}» создана.`).toHaveCount(0);
      await expect(
        this.categoryEditButton(name),
        `Созданная категория «${name}» показана в каталоге.`,
      ).toBeVisible();
    });
  }

  async openForEditing(name: string): Promise<void> {
    await test.step(`Открыть редактирование категории «${name}»`, async () => {
      await expect(
        this.categoryEditButton(name),
        `Редактирование категории «${name}» доступно.`,
      ).toBeEnabled();
      await this.categoryEditButton(name).click();
      await expect(
        this.dialog,
        `Редактор категории «${name}» открыт.`,
      ).toBeVisible();
    });
  }

  async saveChanges(name: string): Promise<void> {
    await test.step(`Сохранить изменения категории «${name}»`, async () => {
      await this.editSaveButton.click();
      await expect(
        this.dialog,
        `Редактор категории «${name}» закрыт.`,
      ).toHaveCount(0);
      await expect(
        this.categoryEditButton(name),
        `Изменённая категория «${name}» показана в каталоге.`,
      ).toBeVisible();
    });
  }

  async cancelCreation(): Promise<void> {
    const dialog = this.createDialog;

    if (!(await dialog.isVisible())) return;

    await test.step("Отменить создание категории", async () => {
      await this.cancelEditorButton(dialog).click();
      await expect(
        dialog,
        "Диалог новой категории закрыт без сохранения.",
      ).toHaveCount(0);
    });
  }

  async cancelEditing(name: string): Promise<void> {
    const dialog = this.editDialog;

    if (!(await dialog.isVisible())) return;

    await test.step(`Отменить редактирование категории «${name}»`, async () => {
      await this.cancelEditorButton(dialog).click();
      await expect(
        dialog,
        `Редактор категории «${name}» закрыт без изменений.`,
      ).toHaveCount(0);
    });
  }

  async requestArchive(name: string): Promise<void> {
    await test.step(`Запросить архивацию категории «${name}»`, async () => {
      await this.archiveButton.click();
      await expect(
        this.confirmationDialog,
        "Подтверждение архивации категории открыто.",
      ).toBeVisible();
    });
  }

  async cancelArchive(name: string): Promise<void> {
    await test.step(`Отменить архивацию категории «${name}»`, async () => {
      await this.cancelArchiveButton.click();
      await expect(
        this.confirmationDialog,
        "Подтверждение архивации категории закрыто.",
      ).toHaveCount(0);
      await expect(
        this.categoryEditButton(name),
        `Категория «${name}» осталась в каталоге.`,
      ).toBeVisible();
    });
  }

  async confirmArchive(name: string): Promise<void> {
    await test.step(`Подтвердить архивацию категории «${name}»`, async () => {
      await this.confirmArchiveButton.click();
      await expect(this.dialog, "Редакторы категории закрыты.").toHaveCount(0);
      await expect(
        this.addCategoryButton,
        "Каталог доступен для следующего действия.",
      ).toBeEnabled();
      await expect(
        this.categoryEditButton(name),
        `Категория «${name}» архивирована.`,
      ).toHaveCount(0);
    });
  }

  private categoryEditButton(name: string): Locator {
    return this.page.getByRole("button", {
      name: `Редактировать категорию ${name}`,
      exact: true,
    });
  }

  private cancelEditorButton(dialog: Locator): Locator {
    return dialog.getByRole("button", {
      name: "Отмена",
      exact: true,
    });
  }
}
