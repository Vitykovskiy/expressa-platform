import { expect, test, type Locator, type Page } from "@playwright/test";

export class CategoryEditorComponent {
  private readonly addCategoryButton: Locator;

  constructor(private readonly page: Page) {
    this.addCategoryButton = page.getByRole("button", {
      name: "Добавить группу",
      exact: true,
    });
  }

  async readName(): Promise<string> {
    return this.nameInput().inputValue();
  }

  async readDescription(): Promise<string> {
    return this.descriptionInput().inputValue();
  }

  async isActive(): Promise<boolean> {
    return (await this.activeSwitch().getAttribute("aria-checked")) === "true";
  }

  async readNameValidation(): Promise<string | null> {
    const alert = this.nameRequiredAlert();

    return (await alert.isVisible()) ? alert.innerText() : null;
  }

  async isCreateSaveAvailable(): Promise<boolean> {
    return this.createSaveButton().isEnabled();
  }

  async startCreation(): Promise<void> {
    await test.step("Начать создание категории", async () => {
      await expect(
        this.addCategoryButton,
        "Кнопка добавления категории доступна.",
      ).toBeEnabled();
      await this.addCategoryButton.click();
      await expect(
        this.dialog(),
        "Диалог новой категории открыт.",
      ).toBeVisible();
    });
  }

  async fillName(name: string): Promise<void> {
    await test.step(`Указать название категории «${name}»`, async () => {
      const nameInput = this.dialog().getByLabel("Название категории", {
        exact: true,
      });

      await nameInput.fill(name);
      await expect(nameInput, "Название категории указано.").toHaveValue(name);
    });
  }

  async clearName(): Promise<void> {
    await test.step("Очистить название категории", async () => {
      const nameInput = this.nameInput();

      await nameInput.clear();
      await expect(nameInput, "Название категории очищено.").toHaveValue("");
      await expect(
        this.nameRequiredAlert(),
        "Показано требование указать название категории.",
      ).toHaveText("Введите название категории");
      await expect(
        this.createSaveButton(),
        "Сохранение категории без названия недоступно.",
      ).toBeDisabled();
    });
  }

  async fillDescription(description: string): Promise<void> {
    await test.step("Указать описание категории", async () => {
      const descriptionInput = this.dialog().getByLabel("Описание", {
        exact: true,
      });

      await descriptionInput.fill(description);
      await expect(descriptionInput, "Описание категории указано.").toHaveValue(
        description,
      );
    });
  }

  async save(name: string): Promise<void> {
    await test.step(`Сохранить категорию «${name}»`, async () => {
      await this.createSaveButton().click();
      await expect(this.dialog(), `Категория «${name}» создана.`).toHaveCount(
        0,
      );
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
        this.dialog(),
        `Редактор категории «${name}» открыт.`,
      ).toBeVisible();
    });
  }

  async saveChanges(name: string): Promise<void> {
    await test.step(`Сохранить изменения категории «${name}»`, async () => {
      await this.editSaveButton().click();
      await expect(
        this.dialog(),
        `Редактор категории «${name}» закрыт.`,
      ).toHaveCount(0);
      await expect(
        this.categoryEditButton(name),
        `Изменённая категория «${name}» показана в каталоге.`,
      ).toBeVisible();
    });
  }

  async cancelCreation(): Promise<void> {
    const dialog = this.createDialog();

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
    const dialog = this.editDialog();

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
      await this.archiveButton().click();
      await expect(
        this.confirmationDialog(),
        "Подтверждение архивации категории открыто.",
      ).toBeVisible();
    });
  }

  async cancelArchive(name: string): Promise<void> {
    await test.step(`Отменить архивацию категории «${name}»`, async () => {
      await this.cancelArchiveButton().click();
      await expect(
        this.confirmationDialog(),
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
      await this.confirmArchiveButton().click();
      await expect(this.dialog(), "Редакторы категории закрыты.").toHaveCount(
        0,
      );
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
      await expect(this.dialog(), "Редакторы категории закрыты.").toHaveCount(
        0,
      );
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

  async archiveIfPresent(name: string): Promise<void> {
    if ((await this.categoryEditButton(name).count()) === 0) return;
    await this.archive(name);
  }

  private dialog(): Locator {
    return this.page.getByRole("dialog");
  }

  private createDialog(): Locator {
    return this.dialog().filter({
      has: this.page.getByRole("heading", {
        name: "Новая категория",
        exact: true,
      }),
    });
  }

  private editDialog(): Locator {
    return this.page.getByRole("dialog", {
      name: "Редактировать категорию",
      exact: true,
    });
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

  private nameInput(): Locator {
    return this.dialog().getByLabel("Название категории", { exact: true });
  }

  private activeSwitch(): Locator {
    return this.dialog().getByRole("switch", {
      name: "Категория активна",
      exact: true,
    });
  }

  private descriptionInput(): Locator {
    return this.dialog().getByLabel("Описание", { exact: true });
  }

  private nameRequiredAlert(): Locator {
    return this.dialog().getByRole("alert");
  }

  private createSaveButton(): Locator {
    return this.dialog().getByRole("button", {
      name: "Добавить категорию",
      exact: true,
    });
  }

  private editSaveButton(): Locator {
    return this.dialog().getByRole("button", {
      name: "Сохранить изменения",
      exact: true,
    });
  }

  private cancelEditorButton(dialog: Locator): Locator {
    return dialog.getByRole("button", {
      name: "Отмена",
      exact: true,
    });
  }

  private archiveButton(): Locator {
    return this.dialog().getByRole("button", {
      name: "Архивировать категорию",
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
      name: "Архивировать",
      exact: true,
    });
  }
}
