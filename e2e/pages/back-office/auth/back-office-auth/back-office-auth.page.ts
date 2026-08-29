import { test } from "@playwright/test";

import { BackOfficeAuthFormComponent } from "@pages/back-office/auth/back-office-auth/back-office-auth-form/back-office-auth-form.component";

import { BackOfficeWorkspaceSection } from "./back-office-auth.page.types";

import type { Locator, Page } from "@playwright/test";

export class BackOfficeAuthPage {
  public readonly form: BackOfficeAuthFormComponent;

  private readonly queueButton: Locator;
  private readonly availabilityButton: Locator;
  private readonly menuButton: Locator;

  constructor(private readonly page: Page) {
    this.form = new BackOfficeAuthFormComponent(page);
    this.queueButton = page.getByRole("button", {
      name: "Очередь",
      exact: true,
    });
    this.availabilityButton = page.getByRole("button", {
      name: "Доступность",
      exact: true,
    });
    this.menuButton = page.getByRole("button", {
      name: "Меню",
      exact: true,
    });
  }

  async open(url: string): Promise<void> {
    await test.step("Открыть back-office", async () => {
      await this.page.goto(url);
      await this.form.waitReady();
    });
  }

  async isWorkspaceSectionVisible(
    section: BackOfficeWorkspaceSection,
  ): Promise<boolean> {
    return this.workspaceSection(section).isVisible();
  }

  private workspaceSection(section: BackOfficeWorkspaceSection): Locator {
    switch (section) {
      case BackOfficeWorkspaceSection.QUEUE:
        return this.queueButton;
      case BackOfficeWorkspaceSection.AVAILABILITY:
        return this.availabilityButton;
      case BackOfficeWorkspaceSection.MENU:
        return this.menuButton;
    }
  }
}
