import { expect, test, type Locator, type Page } from "@playwright/test";

export class ModifierAssignmentComponent {
  private readonly managementButton: Locator;
  private readonly assignments: Locator;
  private readonly orderInput: Locator;
  private readonly saveButton: Locator;

  constructor(private readonly page: Page) {
    this.managementButton = page.getByRole("button", {
      name: "Управление меню",
      exact: true,
    });
    this.assignments = page.getByRole("region", {
      name: "Группы добавок категории",
      exact: true,
    });
    this.orderInput = this.assignments.getByLabel("Порядок", { exact: true });
    this.saveButton = this.assignments.getByRole("button", {
      name: "Сохранить назначения",
      exact: true,
    });
  }

  async isGroupAssigned(name: string): Promise<boolean> {
    return this.groupCheckbox(name).isChecked();
  }

  async readOrder(): Promise<string> {
    return this.orderInput.inputValue();
  }

  async readOrderValidation(): Promise<string | null> {
    const alert = this.assignments.getByRole("alert");

    return (await alert.isVisible()) ? alert.innerText() : null;
  }

  async isSaveAvailable(): Promise<boolean> {
    return this.saveButton.isEnabled();
  }

  async openCategory(categoryName: string): Promise<void> {
    await test.step(`Открыть назначения категории «${categoryName}»`, async () => {
      await this.openManagement();
      const categoryButton = this.categoryButton(categoryName);

      await expect(
        categoryButton,
        `Категория «${categoryName}» доступна для настройки добавок.`,
      ).toBeEnabled();
      await categoryButton.click();
      await expect(
        this.assignments,
        `Открыты назначения категории «${categoryName}».`,
      ).toBeVisible();
    });
  }

  async selectGroup(groupName: string): Promise<void> {
    await test.step(`Назначить группу добавок «${groupName}»`, async () => {
      const groupCheckbox = this.groupCheckbox(groupName);

      await expect(
        groupCheckbox,
        `Группа добавок «${groupName}» доступна для назначения.`,
      ).toBeEnabled();
      await groupCheckbox.check();
      await expect(
        groupCheckbox,
        `Группа добавок «${groupName}» выбрана для категории.`,
      ).toBeChecked();
    });
  }

  async setOrder(order: string): Promise<void> {
    await test.step(`Указать порядок группы добавок «${order}»`, async () => {
      const orderInput = this.orderInput;

      await expect(
        orderInput,
        "Поле порядка группы добавок показано.",
      ).toBeVisible();
      await orderInput.fill(order);
      await expect(orderInput, "Порядок группы добавок указан.").toHaveValue(
        order,
      );
    });
  }

  async save(): Promise<void> {
    await test.step("Сохранить назначения добавок категории", async () => {
      await expect(
        this.saveButton,
        "Сохранение назначений добавок категории доступно.",
      ).toBeEnabled();
      await this.saveButton.click();
      await expect(
        this.assignments,
        "Назначения добавок категории сохранены.",
      ).toBeVisible();
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

  private categoryButton(name: string): Locator {
    return this.page.getByRole("button", { name, exact: true });
  }

  private groupCheckbox(name: string): Locator {
    return this.assignments.getByRole("checkbox", { name, exact: true });
  }
}
