import { expect, test } from "@playwright/test";

import type { Locator, Page } from "@playwright/test";

export class GuestCheckoutFormComponent {
  private readonly nameInput: Locator;
  private readonly continueButton: Locator;

  constructor(page: Page) {
    this.nameInput = page.getByLabel("Ваше имя", { exact: true });
    this.continueButton = page.getByRole("button", {
      name: "Продолжить",
      exact: true,
    });
  }

  async completeProfileIfShown(name: string): Promise<boolean> {
    if (!(await this.nameInput.isVisible())) return false;

    await test.step("Заполнить профиль нового клиента", async () => {
      await expect(this.nameInput, "Поле имени доступно.").toBeEnabled();
      await this.nameInput.fill(name);
      await expect(
        this.continueButton,
        "Кнопка продолжения доступна.",
      ).toBeEnabled();
      await this.continueButton.click();
      await this.assertProfileCompleted();
    });

    return true;
  }

  async assertNotShown(): Promise<void> {
    await expect(
      this.nameInput,
      "Заполнение профиля не требуется.",
    ).toHaveCount(0);
  }

  async assertProfileCompleted(): Promise<void> {
    await expect(
      this.nameInput,
      "Профиль нового клиента сохранён.",
    ).toHaveCount(0);
  }
}
