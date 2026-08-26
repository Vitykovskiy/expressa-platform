import { expect, test, type Locator, type Page } from "@playwright/test";

import type { ProductOrderScenarioData } from "@support/data/product-order-scenario-data";

export class ModifierGroupEditorComponent {
  private readonly managementButton: Locator;
  private readonly newModifierGroupButton: Locator;

  constructor(private readonly page: Page) {
    this.managementButton = page.getByRole("button", {
      name: "Управление меню",
      exact: true,
    });
    this.newModifierGroupButton = page.getByRole("button", {
      name: "Новая группа опций",
      exact: true,
    });
  }

  async create(input: ProductOrderScenarioData): Promise<void> {
    await test.step(`Создать группу добавок «${input.modifierGroupName}»`, async () => {
      await this.openManagement();
      await expect(
        this.newModifierGroupButton,
        "Кнопка новой группы добавок доступна.",
      ).toBeEnabled();
      await this.newModifierGroupButton.click();
      await expect(
        this.editor(),
        "Редактор новой группы добавок открыт.",
      ).toBeVisible();
      await this.editor()
        .getByLabel("Название", { exact: true })
        .fill(input.modifierGroupName);
      await this.editor()
        .getByRole("button", { name: "Добавить вариант", exact: true })
        .click();
      await expect(
        this.optionNameInput(),
        "Поле названия варианта добавки показано.",
      ).toBeVisible();
      await this.optionNameInput().fill(input.modifierName);
      await this.editor()
        .getByLabel("Изменение цены, коп.", { exact: true })
        .fill("0");
      await this.editor()
        .getByRole("button", { name: "Сохранить группу", exact: true })
        .click();
      await expect(
        this.modifierGroupEditButton(input.modifierGroupName),
        `Группа добавок «${input.modifierGroupName}» создана.`,
      ).toBeVisible();
    });
  }

  async archive(name: string): Promise<void> {
    await test.step(`Архивировать группу добавок «${name}»`, async () => {
      await this.openManagement();
      await this.modifierGroupEditButton(name).click();
      await expect(
        this.editor(),
        `Редактор группы добавок «${name}» открыт.`,
      ).toBeVisible();
      await this.editor()
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

  private async openManagement(): Promise<void> {
    const expanded = await this.managementButton.getAttribute("aria-expanded");

    if (expanded === "true") return;
    await expect(
      this.managementButton,
      "Управление меню доступно.",
    ).toBeEnabled();
    await this.managementButton.click();
    await expect(
      this.managementButton,
      "Управление меню открыто.",
    ).toHaveAttribute("aria-expanded", "true");
  }

  private editor(): Locator {
    return this.page.getByRole("dialog").getByRole("region", {
      name: "Группа добавок",
      exact: true,
    });
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

  private optionNameInput(): Locator {
    return this.editor().getByTestId("modifier-option-name");
  }
}
