import { expect, test, type Locator, type Page } from "@playwright/test";

import { ModifierSelectionType } from "./modifier-group-editor.types";

export class ModifierGroupEditorComponent {
  private readonly managementButton: Locator;
  private readonly newModifierGroupButton: Locator;
  private readonly editorRegion: Locator;
  private readonly groupNameInput: Locator;
  private readonly addOptionButton: Locator;
  private readonly saveGroupButton: Locator;
  private newOption: Locator | undefined;

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
    this.saveGroupButton = this.editorRegion.getByRole("button", {
      name: "Сохранить группу",
      exact: true,
    });
  }

  async isGroupVisible(name: string): Promise<boolean> {
    return this.modifierGroupEditButton(name).isVisible();
  }

  async isOptionFree(name: string): Promise<boolean> {
    const optionPrice = await this.optionPriceInputByName(name);

    return (await optionPrice.inputValue()) === "0";
  }

  async isOptionDefault(name: string): Promise<boolean> {
    const optionDefault = await this.optionDefaultSwitch(name);

    return (await optionDefault.getAttribute("aria-checked")) === "true";
  }

  async readOptionOrder(): Promise<readonly string[]> {
    const optionNames = await this.optionNameInputs().all();

    return Promise.all(
      optionNames.map((optionName) => optionName.inputValue()),
    );
  }

  async isOptionMoveUpAvailable(name: string): Promise<boolean> {
    return this.optionMoveUpButton(name).isEnabled();
  }

  async moveOptionUp(name: string): Promise<void> {
    await test.step(`Переместить вариант добавки «${name}» вверх`, async () => {
      const moveUp = this.optionMoveUpButton(name);

      await expect(
        moveUp,
        `Вариант добавки «${name}» можно переместить вверх.`,
      ).toBeEnabled();
      await moveUp.click();
      await expect(
        moveUp,
        `Вариант добавки «${name}» стал первым в группе.`,
      ).toBeDisabled();
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
      await this.openManagement();
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

  async openForEditing(name: string): Promise<void> {
    await test.step(`Открыть редактирование группы добавок «${name}»`, async () => {
      const editGroup = this.modifierGroupEditButton(name);

      await expect(
        editGroup,
        `Редактирование группы добавок «${name}» доступно.`,
      ).toBeEnabled();
      await editGroup.click();
      await expect(
        this.editorRegion,
        `Редактор группы добавок «${name}» открыт.`,
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
      const selectionType = this.editorRegion.getByRole("combobox");

      await selectionType.selectOption(type);
      await expect(selectionType, "Тип группы добавок выбран.").toHaveValue(
        type,
      );
    });
  }

  async setRequired(): Promise<void> {
    await test.step("Сделать выбор добавки обязательным", async () => {
      const required = this.editorRegion.getByRole("switch", {
        name: "Выбор обязателен",
        exact: true,
      });

      await required.click();
      await expect(required, "Выбор добавки обязателен.").toHaveAttribute(
        "aria-checked",
        "true",
      );
    });
  }

  async addOption(): Promise<void> {
    await test.step("Добавить вариант добавки", async () => {
      await this.addOptionButton.click();
      this.newOption = await this.emptyOption();
      await expect(
        this.addedOptionNameInput(),
        "Поле названия варианта добавки показано.",
      ).toBeVisible();
    });
  }

  async fillOptionName(name: string): Promise<void> {
    await test.step(`Указать название варианта добавки «${name}»`, async () => {
      const optionNameInput = this.addedOptionNameInput();

      await optionNameInput.fill(name);
      await expect(
        optionNameInput,
        "Название варианта добавки указано.",
      ).toHaveValue(name);
    });
  }

  async setOptionPrice(price: string): Promise<void> {
    await test.step(`Указать цену варианта добавки «${price}»`, async () => {
      const optionPriceInput = this.addedOption().getByLabel(
        "Изменение цены, коп.",
        { exact: true },
      );

      await optionPriceInput.fill(price);
      await expect(
        optionPriceInput,
        "Цена варианта добавки указана.",
      ).toHaveValue(price);
    });
  }

  async setOptionDefault(): Promise<void> {
    await test.step("Выбрать вариант добавки по умолчанию", async () => {
      const optionDefault = this.editorRegion.getByRole("switch", {
        name: "Выбран по умолчанию",
        exact: true,
      });

      await optionDefault.click();
      await expect(
        optionDefault,
        "Вариант добавки выбран по умолчанию.",
      ).toHaveAttribute("aria-checked", "true");
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

  async cancelEditing(name: string): Promise<void> {
    if ((await this.editorRegion.count()) === 0) return;

    await test.step(`Отменить редактирование группы добавок «${name}»`, async () => {
      await this.editorRegion
        .getByRole("button", { name: "Отмена", exact: true })
        .click();
      await expect(
        this.editorRegion,
        `Редактор группы добавок «${name}» закрыт без изменений.`,
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

  private optionNameInputs(): Locator {
    return this.editorRegion.getByTestId("modifier-option-name");
  }

  private addedOptionNameInput(): Locator {
    return this.addedOption().getByTestId("modifier-option-name");
  }

  private addedOption(): Locator {
    if (this.newOption === undefined)
      throw new Error("Сначала добавьте вариант добавки.");

    return this.newOption;
  }

  private async emptyOption(): Promise<Locator> {
    const emptyOptions: Locator[] = [];
    const options = await this.editorRegion
      .getByRole("group", { name: "Вариант добавки", exact: true })
      .all();

    for (const option of options) {
      const optionNameInput = option.getByTestId("modifier-option-name");

      if ((await optionNameInput.inputValue()) === "")
        emptyOptions.push(option);
    }

    if (emptyOptions.length !== 1)
      throw new Error(
        "Не удалось однозначно найти новый пустой вариант добавки.",
      );

    return emptyOptions[0];
  }

  private async optionByName(name: string): Promise<Locator> {
    const options = await this.editorRegion
      .getByRole("group", { name: "Вариант добавки", exact: true })
      .all();

    for (const option of options) {
      if (
        (await option.getByTestId("modifier-option-name").inputValue()) === name
      )
        return option;
    }

    throw new Error(`Не удалось найти вариант добавки «${name}».`);
  }

  private async optionPriceInputByName(name: string): Promise<Locator> {
    return (await this.optionByName(name)).getByLabel("Изменение цены, коп.", {
      exact: true,
    });
  }

  private async optionDefaultSwitch(name: string): Promise<Locator> {
    return (await this.optionByName(name)).getByRole("switch", {
      name: "Выбран по умолчанию",
      exact: true,
    });
  }

  private optionMoveUpButton(name: string): Locator {
    return this.editorRegion.getByRole("button", {
      name: `Переместить ${name} вверх`,
      exact: true,
    });
  }
}
