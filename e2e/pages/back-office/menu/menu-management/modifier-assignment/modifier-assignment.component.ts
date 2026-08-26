import { expect, test, type Locator, type Page } from "@playwright/test";

export class ModifierAssignmentComponent {
  private readonly managementButton: Locator;

  constructor(private readonly page: Page) {
    this.managementButton = page.getByRole("button", {
      name: "Управление меню",
      exact: true,
    });
  }

  async assign(categoryName: string, groupName: string): Promise<void> {
    await test.step(`Назначить группе «${categoryName}» добавку «${groupName}»`, async () => {
      await this.openManagement();
      await this.categoryButton(categoryName).click();
      await expect(
        this.assignments(),
        `Открыты назначения категории «${categoryName}».`,
      ).toBeVisible();
      const groupCheckbox = this.assignments().getByRole("checkbox", {
        name: groupName,
        exact: true,
      });

      await expect(
        groupCheckbox,
        `Группа добавок «${groupName}» доступна для назначения.`,
      ).toBeEnabled();
      await groupCheckbox.check();
      await this.assignments()
        .getByRole("button", { name: "Сохранить назначения", exact: true })
        .click();
      await expect(
        groupCheckbox,
        `Группа добавок «${groupName}» назначена категории.`,
      ).toBeChecked();
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
