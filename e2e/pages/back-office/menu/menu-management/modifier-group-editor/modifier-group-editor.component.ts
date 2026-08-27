import { expect, test, type Locator, type Page } from "@playwright/test";

import { ModifierSelectionType } from "./modifier-group-editor.types";

export class ModifierGroupEditorComponent {
  private readonly managementButton: Locator;
  private readonly newModifierGroupButton: Locator;
  private readonly editorRegion: Locator;
  private readonly groupNameInput: Locator;
  private readonly addOptionButton: Locator;
  private readonly optionNameInput: Locator;
  private readonly optionPriceInput: Locator;
  private readonly saveGroupButton: Locator;

  constructor(private readonly page: Page) {
    this.managementButton = page.getByRole("button", {
      name: "Управление меню",
      exact: true,
    });
    this.newModifierGroupButton = page.getByRole("button", {
      name: "Новая группа опций",
      exact: true,
    });
    this.editorRegion = page.getByRole("dialog").getByRole("region", {
      name: "Группа добавок",
      exact: true,
    });
    this.groupNameInput = this.editorRegion.getByLabel("Название", {
      exact: true,
    });
    this.addOptionButton = this.editorRegion.getByRole("button", {
      name: "Добавить вариант",
      exact: true,
    });
    this.optionNameInput = this.editorRegion.getByTestId(
      "modifier-option-name",
    );
    this.optionPriceInput = this.editorRegion.getByLabel(
      "Изменение цены, коп.",
      { exact: true },
    );
    this.saveGroupButton = this.editorRegion.getByRole("button", {
      name: "Сохранить группу",
      exact: true,
    });
  }

  async openManagement(): Promise<void> {
    await test.step("Открыть управление меню", async () => {
      const expanded =
        await this.managementButton.getAttribute("aria-expanded");

      if (expanded === "true") {
        await expect(
          this.managementButton,
          "Управление меню открыто.",
        ).toHaveAttribute("aria-expanded", "true");
        return;
      }
      await expect(
        this.managementButton,
        "Управление меню доступно.",
      ).toBeEnabled();
      await this.managementButton.click();
      await expect(
        this.managementButton,
        "Управление меню открыто.",
      ).toHaveAttribute("aria-expanded", "true");
    });
  }

  async startCreation(): Promise<void> {
    await test.step("Начать создание группы добавок", async () => {
      await expect(
        this.newModifierGroupButton,
        "Кнопка новой группы добавок доступна.",
      ).toBeEnabled();
      await this.newModifierGroupButton.click();
      await expect(
        this.editorRegion,
        "Редактор новой группы добавок открыт.",
      ).toBeVisible();
    });
  }

  async fillName(name: string): Promise<void> {
    await test.step(`Указать название группы добавок «${name}»`, async () => {
      await this.groupNameInput.fill(name);
      await expect(
        this.groupNameInput,
        "Название группы добавок указано.",
      ).toHaveValue(name);
    });
  }

  async selectType(type: ModifierSelectionType): Promise<void> {
    await test.step(`Выбрать тип группы добавок «${type}»`, async () => {
      const selectionType = this.editorRegion.getByLabel("Тип выбора", {
        exact: true,
      });

      await selectionType.selectOption(type);
      await expect(selectionType, "Тип группы добавок выбран.").toHaveValue(
        type,
      );
    });
  }

  async setRequired(): Promise<void> {
    await test.step("Сделать выбор добавки обязательным", async () => {
      const required = this.editorRegion.getByRole("checkbox", {
        name: "Выбор обязателен",
        exact: true,
      });

      await required.check();
      await expect(required, "Выбор добавки обязателен.").toBeChecked();
    });
  }

  async addOption(): Promise<void> {
    await test.step("Добавить вариант добавки", async () => {
      await this.addOptionButton.click();
      await expect(
        this.optionNameInput,
        "Поле названия варианта добавки показано.",
      ).toBeVisible();
    });
  }

  async fillOptionName(name: string): Promise<void> {
    await test.step(`Указать название варианта добавки «${name}»`, async () => {
      await this.optionNameInput.fill(name);
      await expect(
        this.optionNameInput,
        "Название варианта добавки указано.",
      ).toHaveValue(name);
    });
  }

  async setOptionPrice(price: string): Promise<void> {
    await test.step(`Указать цену варианта добавки «${price}»`, async () => {
      await this.optionPriceInput.fill(price);
      await expect(
        this.optionPriceInput,
        "Цена варианта добавки указана.",
      ).toHaveValue(price);
    });
  }

  async setOptionDefault(): Promise<void> {
    await test.step("Выбрать вариант добавки по умолчанию", async () => {
      const optionDefault = this.editorRegion.getByRole("checkbox", {
        name: "Выбран по умолчанию",
        exact: true,
      });

      await optionDefault.check();
      await expect(
        optionDefault,
        "Вариант добавки выбран по умолчанию.",
      ).toBeChecked();
    });
  }

  async save(): Promise<void> {
    await test.step("Сохранить группу добавок", async () => {
      await this.saveGroupButton.click();
      await expect(
        this.editorRegion,
        "Редактор группы добавок закрыт.",
      ).toHaveCount(0);
    });
  }

  async archive(name: string): Promise<void> {
    await test.step(`Архивировать группу добавок «${name}»`, async () => {
      await this.openManagement();
      await this.modifierGroupEditButton(name).click();
      await expect(
        this.editorRegion,
        `Редактор группы добавок «${name}» открыт.`,
      ).toBeVisible();
      await this.editorRegion
        .getByRole("button", { name: "Архивировать группу", exact: true })
        .click();
      await expect(
        this.confirmationDialog(),
        "Подтверждение архивации группы добавок открыто.",
      ).toBeVisible();
      await this.confirmationDialog()
        .getByRole("button", { name: "Архивировать", exact: true })
        .click();
      await expect(
        this.modifierGroupEditButton(name),
        `Группа добавок «${name}» архивирована.`,
      ).toHaveCount(0);
    });
  }

  async archiveIfPresent(name: string): Promise<void> {
    await this.openManagement();
    if ((await this.modifierGroupEditButton(name).count()) === 0) return;
    await this.archive(name);
  }

  private confirmationDialog(): Locator {
    return this.page.getByRole("dialog", {
      name: "Архивировать группу добавок?",
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
