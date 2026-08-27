import { expect, test, type Locator, type Page } from "@playwright/test";

export class CategoryEditorComponent {
  private readonly addCategoryButton: Locator;

  constructor(private readonly page: Page) {
    this.addCategoryButton = page.getByRole("button", {
      name: "Добавить группу",
      exact: true,
    });
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
      await this.dialog()
        .getByRole("button", { name: "Добавить категорию", exact: true })
        .click();
      await expect(this.dialog(), `Категория «${name}» создана.`).toHaveCount(
        0,
      );
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

  async archiveIfPresent(name: string): Promise<void> {
    if ((await this.categoryEditButton(name).count()) === 0) return;
    await this.archive(name);
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
