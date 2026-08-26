import { test, type Page } from "@playwright/test";

import { BackOfficeAuthFormComponent } from "./back-office-auth-form/back-office-auth-form.component";

export class BackOfficeAuthPage {
  public readonly form: BackOfficeAuthFormComponent;

  constructor(private readonly page: Page) {
    this.form = new BackOfficeAuthFormComponent(page);
  }

  async open(url: string): Promise<void> {
    await test.step("Открыть back-office", async () => {
      await this.page.goto(url);
      await this.form.waitReady();
    });
  }
}
