import { expect, test, type Locator, type Page } from "@playwright/test";

export class ModifierAssignmentComponent {
  private readonly managementButton: Locator;

  constructor(private readonly page: Page) {
    this.managementButton = page.getByRole("button", {
      name: "Управление меню",
      exact: true,
    });
  }

  async openCategory(categoryName: string): Promise<void> {
    await test.step(`Открыть назначения категории «${categoryName}»`, async () => {
      await this.openManagement();
      await this.categoryButton(categoryName).click();
      await expect(
        this.assignments(),
        `Открыты назначения категории «${categoryName}».`,
      ).toBeVisible();
    });
  }

  async selectGroup(groupName: string): Promise<void> {
    await test.step(`Назначить группу добавок «${groupName}»`, async () => {
      const groupCheckbox = this.assignments().getByRole("checkbox", {
        name: groupName,
        exact: true,
      });

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

  async save(): Promise<void> {
    await test.step("Сохранить назначения добавок категории", async () => {
      await this.assignments()
        .getByRole("button", { name: "Сохранить назначения", exact: true })
        .click();
      await expect(
        this.assignments(),
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

  private assignments(): Locator {
    return this.page.getByRole("region", {
      name: "Группы добавок категории",
      exact: true,
    });
  }

  private categoryButton(name: string): Locator {
    return this.page.getByRole("button", { name, exact: true });
  }
}
